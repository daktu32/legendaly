const fs = require('fs');
const path = require('path');
const { sleep } = require('../ui');

// リトライ機能付きのAPI呼び出し
async function callOpenAIWithRetry(openai, model, messages, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model,
        messages
      });
      return res;
    } catch (error) {
      lastError = error;
      console.error(`API呼び出し失敗 (試行 ${attempt + 1}/${maxRetries}):`, error.message);
      
      // リトライしない場合のエラー
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // 最後の試行でなければ待機
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt); // 指数バックオフ
        console.log(`${delay}ms 待機後にリトライします...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

// 1回のAPI呼び出しで複数の名言をまとめて生成
async function generateBatchQuotes(openai, model, role, createBatchPrompt, allPatterns, language, tone, logPath, echoesPath, count) {
  try {
    const res = await callOpenAIWithRetry(openai, model, [
      { role: "system", content: role },
      { role: "user", content: createBatchPrompt(count) }
    ]);

    const output = res.choices[0].message.content.trim();
    
    // 出力を "---" で分割して複数の名言に分ける
    const quoteBlocks = output.split(/\s*---\s*/).filter(block => block.trim() !== '');
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