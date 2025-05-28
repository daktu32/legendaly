#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
require('dotenv').config();
const {
  sleep,
  hideCursor,
  showCursor,
  showLoadingAnimation,
  typeOut,
  fadeOutFullwidth
} = require('./ui');
const config = require('./config');
const openai = require(config.openaiClientPath);
const isFullwidth = require('is-fullwidth-code-point').default;

// 設定の取得
const {
  tone,
  language,
  fetchInterval,
  quoteCount,
  typeSpeed,
  fadeSteps,
  fadeDelay,
  displayTime,
  figletFont,
  model,
  colorToneMap
} = config;
const interval = fetchInterval;

// echoesディレクトリが存在しない場合は作成
const echoesDir = path.join(__dirname, 'echoes');
if (!fs.existsSync(echoesDir)) {
  fs.mkdirSync(echoesDir, { recursive: true });
}

// 現在の実行用のログファイル名を生成
const now = new Date();
const formattedTime = formatDateAsCompactString(now);
const echoesFname = `${formattedTime}-${tone}-${language}.echoes`;
const echoesPath = path.join(echoesDir, echoesFname);

// 日付をyyyyMMddHHmmssfff形式でフォーマットする関数
function formatDateAsCompactString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

// レガシーログパスも残しておく（後方互換性のため）
const logPath = path.join(__dirname, 'legendaly.log');

const lolcatArgs = colorToneMap[tone] || '';
const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs} --force`;

// Load language resources
const locales = {
  ja: require('./locales/ja'),
  en: require('./locales/en'),
  zh: require('./locales/zh'),
  ko: require('./locales/ko'),
  fr: require('./locales/fr'),
  es: require('./locales/es'),
  de: require('./locales/de')
};
const getLocale = lang => locales[lang] || locales['ja'];
let locale = getLocale(language);
const role = locale.system;
const allPatterns = Object.fromEntries(
  Object.entries(locales).map(([k, v]) => [k, v.patterns])
);

function createBatchPrompt(count) {
  locale = getLocale(language);
  return locale.createBatchPrompt(tone, count);
}

// シンプルなドットアニメーションを表示する関数
async function showDotAnimation(topOffset = 9, maxDots = 30, frameDelay = 150) {
  const line = topOffset;
  let dots = 0;
  let shouldContinue = true;
  
  // アニメーション実行
  const animationLoop = async () => {
    while (dots < maxDots && shouldContinue) {
      readline.cursorTo(process.stdout, 0, line);
      readline.clearLine(process.stdout, 0);
      
      let dotString = 'Generating wisdom';
      for (let i = 0; i < dots % 4; i++) {
        dotString += '.';
      }
      
      process.stdout.write(dotString);
      dots++;
      
      await sleep(frameDelay);
    }
    
    // 最後にクリア
    readline.cursorTo(process.stdout, 0, line);
    readline.clearLine(process.stdout, 0);
  };
  
  // アニメーションを開始
  animationLoop();
  
  // アニメーション停止関数を返す
  return function() {
    shouldContinue = false;
  };
}


// プログラム終了時にカーソルを確実に表示する
process.on('exit', () => {
  showCursor();
});

// Ctrl+C などでの中断時にもカーソルを表示する
process.on('SIGINT', () => {
  showCursor();
  // 画面の右下に表示
  const { columns, rows } = process.stdout;
  // 最後にスクリーンをクリア
  console.clear();
  // To Be Continued... を右下に表示
  readline.cursorTo(process.stdout, columns - 22, rows - 3);
  console.log('To Be Continued...');
  process.exit(0);
});

// SIGTERM シグナルでもカーソルを表示
process.on('SIGTERM', () => {
  showCursor();
  // 画面の右下に表示
  const { columns, rows } = process.stdout;
  // 最後にスクリーンをクリア
  console.clear();
  // To Be Continued... を右下に表示
  readline.cursorTo(process.stdout, columns - 22, rows - 3);
  console.log('To Be Continued...');
  process.exit(0);
});

// エラー発生時にもカーソルを表示する
process.on('uncaughtException', (err) => {
  showCursor();
  console.error('エラーが発生しました:', err);
  process.exit(1);
});

// プログラム開始時に一度だけカーソルを確実に非表示にする
hideCursor();



// 1回のAPI呼び出しで複数の名言をまとめて生成
async function generateBatchQuotes(count) {
  try {
    const res = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: role },
        { role: "user", content: createBatchPrompt(count) }
      ]
    });

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
    console.error('OpenAI API request failed:', err);
    // エラー時は少なくとも1つのダミー名言を返す
    return [
      [
        '  --- Error fetching quotes',
        `     　　Unknown『Unknown』 ${new Date().toISOString().split("T")[0]}`
      ]
    ];
  }
}

// 複数の名言を一度に生成する関数（互換性のため残す）
async function generateMultipleQuotes(count) {
  // バッチ処理で一度に取得
  return generateBatchQuotes(Math.min(count, 25)); // APIの制限を考慮して上限を設ける
}

async function mainLoop() {
  console.clear();
  
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Creating mystical wisdom with AI...\n\n");

  const topOffset = 9;
  
  // ローディングアニメーションを開始
  const stopLoading = showLoadingAnimation(topOffset);
  
  try {
    // 名言を取得
    const allQuotes = await generateBatchQuotes(Math.min(quoteCount, 25)); // APIの制限を考慮して上限を設ける
    
    // ローディングアニメーションを停止して表示をクリア
    stopLoading();
    
    // ローディングアニメーション領域のみをクリア（ロゴとメッセージは保持）
    for (let i = 0; i < 5; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    // 取得した名言をループして表示
    let quoteIndex = 0;
    
    while (true) {
      // 表示エリアをクリア
      for (let i = 0; i < 5; i++) {
        readline.cursorTo(process.stdout, 0, topOffset + i);
        readline.clearLine(process.stdout, 0);
      }
      
      const currentQuote = allQuotes[quoteIndex];
      await typeOut(currentQuote, typeSpeed, topOffset);
      await sleep(displayTime);
      await fadeOutFullwidth(currentQuote, topOffset, fadeSteps, fadeDelay);
      
      // 次の名言へ
      quoteIndex = (quoteIndex + 1) % allQuotes.length;
      
      await sleep(interval * 1000);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    // エラー発生時もローディングアニメーションを停止
    stopLoading();
    // エラー発生時はカーソルを表示
    showCursor();
  }
}

mainLoop();
