const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { generateBatchQuotes } = require('../src/core/quotes');

// モックのOpenAIクライアント
function createMockOpenAI(response, shouldFail = false, errorType = null) {
  return {
    chat: {
      completions: {
        create: async () => {
          if (shouldFail) {
            const error = new Error('API Error');
            if (errorType === 'network') {
              error.code = 'ENOTFOUND';
            } else if (errorType === 'auth') {
              error.status = 401;
            } else if (errorType === 'rate') {
              error.status = 429;
            }
            throw error;
          }
          return {
            choices: [{
              message: {
                content: response
              }
            }]
          };
        }
      }
    }
  };
}

test('generateBatchQuotes', async (t) => {
  const tempDir = path.join(__dirname, 'temp');
  const logPath = path.join(tempDir, 'test.log');
  const echoesPath = path.join(tempDir, 'test.echoes');
  
  // テスト前にディレクトリを作成
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // テスト後にクリーンアップ
  t.after(() => {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    if (fs.existsSync(echoesPath)) fs.unlinkSync(echoesPath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  });

  await t.test('generates quotes successfully', async () => {
    const mockResponse = `名言 : 山があるから登るのだ
キャラクター名 : 佐藤太郎
作品名 : 山男伝
西暦 : 1980
---
名言 : 知識は力なり
キャラクター名 : 田中花子
作品名 : 未来の書
西暦 : 2050`;

    const mockOpenAI = createMockOpenAI(mockResponse);
    const allPatterns = {
      ja: {
        quote: /名言\s*:\s*(.*?)(?:\n|$)/m,
        user: /キャラクター名\s*:\s*(.*?)(?:\n|$)/m,
        source: /作品名\s*:\s*(.*?)(?:\n|$)/m,
        date: /西暦\s*:\s*(.*?)(?:\n|$)/m
      }
    };
    
    const quotes = await generateBatchQuotes(
      mockOpenAI,
      'gpt-4o',
      'system prompt',
      () => 'batch prompt',
      allPatterns,
      'ja',
      'epic',
      logPath,
      echoesPath,
      2
    );
    
    assert.strictEqual(quotes.length, 2);
    assert(quotes[0][0].includes('山があるから登るのだ'));
    assert(quotes[0][1].includes('佐藤太郎'));
    assert(quotes[1][0].includes('知識は力なり'));
    assert(quotes[1][1].includes('田中花子'));
    
    // ログファイルが作成されているか確認
    assert(fs.existsSync(logPath));
    assert(fs.existsSync(echoesPath));
  });

  await t.test('handles network errors', async () => {
    const mockOpenAI = createMockOpenAI('', true, 'network');
    const allPatterns = { ja: {} };
    
    const quotes = await generateBatchQuotes(
      mockOpenAI,
      'gpt-4o',
      'system prompt',
      () => 'batch prompt',
      allPatterns,
      'ja',
      'epic',
      logPath,
      echoesPath,
      1
    );
    
    assert.strictEqual(quotes.length, 1);
    assert(quotes[0][0].includes('ネットワーク接続を確認してください'));
  });

  await t.test('handles auth errors', async () => {
    const mockOpenAI = createMockOpenAI('', true, 'auth');
    const allPatterns = { ja: {} };
    
    const quotes = await generateBatchQuotes(
      mockOpenAI,
      'gpt-4o',
      'system prompt',
      () => 'batch prompt',
      allPatterns,
      'ja',
      'epic',
      logPath,
      echoesPath,
      1
    );
    
    assert.strictEqual(quotes.length, 1);
    assert(quotes[0][0].includes('OpenAI APIキーを確認してください'));
  });

  await t.test('handles rate limit errors', async () => {
    const mockOpenAI = createMockOpenAI('', true, 'rate');
    const allPatterns = { ja: {} };
    
    const quotes = await generateBatchQuotes(
      mockOpenAI,
      'gpt-4o',
      'system prompt',
      () => 'batch prompt',
      allPatterns,
      'ja',
      'epic',
      logPath,
      echoesPath,
      1
    );
    
    assert.strictEqual(quotes.length, 1);
    assert(quotes[0][0].includes('APIレート制限に達しました'));
  });
});