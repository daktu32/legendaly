#!/usr/bin/env node

const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
require('dotenv').config();
const openaiClientPath = process.env.OPENAI_CLIENT_PATH ||
  path.join(os.homedir(), '.config', 'common', 'openaiClients.js');
const openai = require(openaiClientPath);
const isFullwidth = require('is-fullwidth-code-point').default;

// 環境変数を取得
const tone = process.env.TONE || 'epic';
const language = process.env.LANGUAGE || 'ja'; // 出力言語（デフォルトは日本語）
const interval = Number(process.env.FETCH_INTERVAL || 3);
const quoteCount = Number(process.env.QUOTE_COUNT || 100); // 取得する名言の数
const typeSpeed = Number(process.env.TYPE_SPEED || 40); // 文字表示の速度（ミリ秒）
const fadeSteps = Number(process.env.FADE_STEPS || 8); // フェードアウトのステップ数
const fadeDelay = Number(process.env.FADE_DELAY || 100); // フェードアウトの遅延時間（ミリ秒）
const displayTime = Number(process.env.DISPLAY_TIME || 2000); // 表示時間（ミリ秒）

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

const colorToneMap = {
  cyberpunk: '--freq=0.9 --spread=2.0',
  mellow: '--freq=0.2 --spread=3.0',
  retro: '--freq=0.5 --spread=2.0',
  neon: '--freq=1.0 --spread=3.5',
  epic: '--freq=0.8 --spread=2.0 --seed 17',
  zen: '--freq=0.15 --spread=3.0',
  default: ''
};
const lolcatArgs = colorToneMap[tone] || '';
const figletFont = process.env.FIGLET_FONT || 'slant';
const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs} --force`;
const model = process.env.MODEL || "gpt-4o";

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
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// カーソルを非表示にする関数
function hideCursor() {
  // 確実に非表示にするため複数のコントロールシーケンスを使用
  process.stderr.write('\x1B[?25l');
}

// カーソルを表示する関数
function showCursor() {
  // 確実に表示するため複数のコントロールシーケンスを使用
  process.stderr.write('\x1B[?25h');
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

// ローディングアニメーションを表示する関数
function showLoadingAnimation(topOffset = 9, frameDelay = 150) {
  const line = topOffset;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let intervalId = null;
  
  // 画面をクリアする関数
  const clearLoading = () => {
    // ローディング表示をクリア
    readline.cursorTo(process.stdout, 0, line);
    readline.clearLine(process.stdout, 0);
  };
  
  // インターバルでアニメーションを更新
  intervalId = setInterval(() => {
    clearLoading();
    // ローディングアニメーションを表示
    const loadingString = `${frames[frameIndex]} Loading wisdom...`;
    process.stdout.write(loadingString);
    frameIndex = (frameIndex + 1) % frames.length;
  }, frameDelay);
  
  // 停止関数を返す
  return function() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      // 表示をクリア
      clearLoading();
    }
  };
}

async function typeOut(lines, delay = 40, topOffset = 9) {
  // linesがundefinedの場合は空の配列に設定
  if (!lines) {
    console.error('Warning: Tried to display undefined lines');
    lines = [
      '  --- Error: Unable to parse quote properly',
      '     　　System『Legendaly』 ' + new Date().toISOString().split("T")[0]
    ];
  }

  // 表示領域をクリア
  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }

  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    for (const char of line) {
      process.stdout.write(char);
      await sleep(delay);
    }
  }
}

async function fadeOutFullwidth(lines, topOffset = 9, steps = 6, stepDelay = 120) {
  // linesがundefinedの場合は空の配列に設定
  if (!lines) {
    console.error('Warning: Tried to fade undefined lines');
    return;
  }
  
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        const fade = Math.random() < step / steps;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay);
  }
  
  // 最後に完全に消去するための処理を追加
  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }
}

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
