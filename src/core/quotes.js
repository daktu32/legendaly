const fs = require('fs');
const path = require('path');
const { sleep } = require('../ui/ui');
const { Timer, verboseLog } = require('../utils/logger');

// 名言キャッシュ（メモリ上に最大300個まで保持）
const quoteCache = new Map();
const MAX_CACHE_SIZE = 300;

// キャッシュキーを生成
function createCacheKey(language, tone, count, customPrompt = '', category = '') {
  const extra = (customPrompt + category).length ? String(customPrompt + category).length : '';
  return `${language}-${tone}-${count}-${extra}`;
}

// キャッシュから名言を取得
function getCachedQuotes(language, tone, count, customPrompt = '', category = '') {
  const key = createCacheKey(language, tone, count, customPrompt, category);
  return quoteCache.get(key);
}

// キャッシュに名言を保存
function setCachedQuotes(language, tone, count, quotes, customPrompt = '', category = '') {
  const key = createCacheKey(language, tone, count, customPrompt, category);
  
  // キャッシュサイズ制限
  if (quoteCache.size >= MAX_CACHE_SIZE) {
    const firstKey = quoteCache.keys().next().value;
    quoteCache.delete(firstKey);
  }
  
  quoteCache.set(key, {
    quotes,
    timestamp: Date.now()
  });
}

// リトライ機能付きのAPI呼び出し
async function callOpenAIWithRetry(openai, model, messages, maxRetries = 3, initialDelay = 500, verbose = false) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiTimer = Date.now();
      const res = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 4000, // レスポンス制限を設定
        temperature: 0.8 // 創造性を維持しつつ安定性向上
      });
      const apiLatency = Date.now() - apiTimer;
      verboseLog(`API応答時間: ${apiLatency}ms, 使用トークン: ${res.usage?.total_tokens || 'N/A'}`, verbose);
      return res;
    } catch (error) {
      lastError = error;
      const errorMsg = `API呼び出し失敗 (試行 ${attempt + 1}/${maxRetries}): ${error.message}`;
      console.error(errorMsg);
      verboseLog(errorMsg, verbose);
      
      // リトライしない場合のエラー
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // 最後の試行でなければ待機
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt); // 指数バックオフ
        const retryMsg = `${delay}ms 待機後にリトライします...`;
        console.log(retryMsg);
        verboseLog(retryMsg, verbose);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

// 1回のAPI呼び出しで複数の名言をまとめて生成
async function generateBatchQuotes(openai, model, role, createBatchPrompt, allPatterns, language, tone, logPath, echoesPath, count, verbose = false, customPrompt = '', category = '') {
  const timer = new Timer('名言生成', verbose);
  
  // キャッシュをチェック（5分以内の結果のみ有効）
  const cached = getCachedQuotes(language, tone, count, customPrompt, category);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5分 = 300,000ms
    verboseLog('キャッシュから名言を取得', verbose);
    console.log('キャッシュから名言を取得中...');
    timer.end();
    return cached.quotes;
  }
  
  verboseLog(`APIを使用して${count}個の名言を生成開始 (model: ${model}, tone: ${tone}, lang: ${language})`, verbose);
  
  try {
    timer.mark('API呼び出し開始');
    const messages = [
      { role: "system", content: role },
      { role: "user", content: createBatchPrompt(count, category) }
    ];
    if (customPrompt) {
      messages.push({ role: 'user', content: customPrompt });
    }
    
    // プロンプトサイズを計測
    const promptSize = JSON.stringify(messages).length;
    verboseLog(`プロンプトサイズ: ${promptSize}文字, 推定${Math.ceil(promptSize/4)}トークン`, verbose);
    
    const res = await callOpenAIWithRetry(openai, model, messages, 3, 500, verbose);
    timer.mark('API呼び出し完了');

    const output = res.choices[0].message.content.trim();
    verboseLog(`API応答を受信 (${output.length}文字)`, verbose);
    
    timer.mark('名言パース開始');
    // 出力を "---" で分割して複数の名言に分ける
    const quoteBlocks = output.split(/\s*---\s*/).filter(block => block.trim() !== '');
    verboseLog(`${quoteBlocks.length}個のブロックを検出`, verbose);
    const quotes = [];
    
    for (const block of quoteBlocks) {
      // 各言語のフォーマットに対応するための正規表現パターン
      
      // 選択された言語のパターンを使用（見つからない場合は全パターンを試す）
      let patternSet = allPatterns[language];
      let quoteMatch = null;
      let userMatch = null;
      let sourceMatch = null;
      let dateMatch = null;
      
      // 選択された言語のパターンで検索
      if (patternSet) {
        quoteMatch = block.match(patternSet.quote);
        userMatch = block.match(patternSet.user);
        sourceMatch = block.match(patternSet.source);
        dateMatch = block.match(patternSet.date);
      }
      
      // 見つからなかった場合は、全言語のパターンを試す
      if (!quoteMatch) {
        for (const lang in allPatterns) {
          patternSet = allPatterns[lang];
          quoteMatch = block.match(patternSet.quote);
          if (quoteMatch) {
            userMatch = block.match(patternSet.user);
            sourceMatch = block.match(patternSet.source);
            dateMatch = block.match(patternSet.date);
            break;
          }
        }
      }

      if (quoteMatch) {
        const quote = quoteMatch ? quoteMatch[1].trim() : '（名言取得失敗）';
        const displayUser = userMatch ? userMatch[1].trim() : 'Unknown';
        const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
        const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];

        // toneとlanguageの情報を含めたログを記録
        const timestamp = new Date().toISOString();
        const logLine = `[${date}] ${displayUser}『${source}』：「${quote}」 (tone: ${tone}, lang: ${language}, time: ${timestamp})\n`;
        
        // 従来のログファイルとechoesディレクトリの両方に保存
        fs.appendFileSync(logPath, logLine);
        fs.appendFileSync(echoesPath, logLine);

        quotes.push([
          `  --- ${quote}`,
          `     ${displayUser}『${source}』 ${date}`
        ]);
      }
    }
    
    timer.mark('パース完了');
    verboseLog(`${quotes.length}個の名言を正常にパース`, verbose);
    
    // キャッシュに保存
    setCachedQuotes(language, tone, count, quotes, customPrompt, category);
    verboseLog('キャッシュに保存完了', verbose);
    
    timer.end();
    return quotes;
    
  } catch (err) {
    console.error('名言の生成に失敗しました:', err);
    
    // ネットワークエラーの場合は再接続を促す
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return [
        [
          '  --- ネットワーク接続を確認してください',
          `     　　System『Legendaly』 ${new Date().toISOString().split("T")[0]}`
        ]
      ];
    }
    
    // API キーエラーの場合
    if (err.status === 401) {
      return [
        [
          '  --- OpenAI APIキーを確認してください',
          `     　　System『Legendaly』 ${new Date().toISOString().split("T")[0]}`
        ]
      ];
    }
    
    // レート制限の場合
    if (err.status === 429) {
      return [
        [
          '  --- APIレート制限に達しました。しばらくお待ちください',
          `     　　System『Legendaly』 ${new Date().toISOString().split("T")[0]}`
        ]
      ];
    }
    
    // その他のエラー
    return [
      [
        '  --- 予期せぬエラーが発生しました',
        `     　　System『Legendaly』 ${new Date().toISOString().split("T")[0]}`
      ]
    ];
  }
}

module.exports = {
  generateBatchQuotes
};