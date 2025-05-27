#!/usr/bin/env node

const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
require('dotenv').config();
const openai = require(path.join(os.homedir(), '.config', 'common', 'openaiClients.js'));
const isFullwidth = require('is-fullwidth-code-point').default;

const tone = process.env.TONE || 'epic';
const interval = Number(process.env.FETCH_INTERVAL || 3);
const quoteCount = Number(process.env.QUOTE_COUNT || 100); // 取得する名言の数
const typeSpeed = Number(process.env.TYPE_SPEED || 40); // 文字表示の速度（ミリ秒）
const fadeSteps = Number(process.env.FADE_STEPS || 8); // フェードアウトのステップ数
const fadeDelay = Number(process.env.FADE_DELAY || 100); // フェードアウトの遅延時間（ミリ秒）
const displayTime = Number(process.env.DISPLAY_TIME || 2000); // 表示時間（ミリ秒）
const colorToneMap = {
  cyberpunk: '--freq=0.9 --spread=2.5 --seed 42',
  mellow: '--freq=0.2 --spread=3.0',
  retro: '--freq=0.5 --spread=2.0',
  neon: '--freq=1.0 --spread=3.5',
  epic: '--freq=0.8 --spread=2.0 --seed 17',
  zen: '--freq=0.15 --spread=3.0',
  default: ''
};
const lolcatArgs = colorToneMap[tone] || '';
const figletFont = process.env.FIGLET_FONT || 'slant';
const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs}`;
const logPath = path.join(__dirname, 'legendaly.log');
const model = process.env.MODEL || "gpt-4o";
const role = `
あなたは創作された名言とその文脈を専門に捏造する、AI名言作家です。
tone（雰囲気）に合った世界観・口調で、創作された複数の名言とその背景情報を作ってください。
各名言は以下の厳格な形式に従ってください：

名言 : （カギカッコなしの短い一文）
キャラクター名 : （名言を言った架空の人物の名前）
作品名 : （そのキャラクターが登場する架空の作品名）
西暦 : （作品の時代設定。tone と矛盾のない時代を使うこと）
---

注意点：
- 実在の人物や作品は使用しないでください。
- 「架空の」「発言者」などの説明的な語句は含めないでください。
- 名言にはカギカッコをつけないでください。
- 各名言の最後に必ず "---" を入れて区切ってください。
`;

// 複数の名言を一度に生成するプロンプト
function createBatchPrompt(count) {
  return `tone: ${tone} に合う雰囲気で、上記の出力形式に沿って ${count} 個の名言とキャラクター情報を生成してください。
各名言の最後に必ず "---" を入れて区切ってください。`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function glitchText(text, intensity = 0.2) {
  const noiseChars = ['#', '%', '*', 'ﾐ', 'ﾅ', 'ｱ', 'ﾓ'];
  return text.split('').map(char =>
    Math.random() < intensity ? noiseChars[Math.floor(Math.random() * noiseChars.length)] : char
  ).join('');
}

async function typeOut(lines, delay = 40, topOffset = 9) {
  // 表示領域をクリア
  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }

  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    if (tone === 'cyberpunk') {
      for (let f = 0; f < 3; f++) {
        readline.cursorTo(process.stdout, 0, topOffset + i);
        process.stdout.write(glitchText(line));
        await sleep(80);
      }
    }

    for (const char of line) {
      process.stdout.write(char);
      await sleep(delay);
    }
  }
}

async function fadeOutFullwidth(lines, topOffset = 9, steps = 6, stepDelay = 120) {
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
  console.log(`Fetching ${count} quotes in a single request...`);
  
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
      // 各ブロックをパース
      const quoteMatch = block.match(/名言\s*:\s*(.*?)(?:\n|$)/m);
      const userMatch = block.match(/キャラクター名\s*:\s*(.*?)(?:\n|$)/m);
      const sourceMatch = block.match(/作品名\s*:\s*(.*?)(?:\n|$)/m);
      const dateMatch = block.match(/西暦\s*:\s*(.*?)(?:\n|$)/m);

      if (quoteMatch) {
        const quote = quoteMatch ? quoteMatch[1].trim() : '（名言取得失敗）';
        const displayUser = userMatch ? userMatch[1].trim() : 'Unknown';
        const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
        const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];

        const logLine = `[${date}] ${displayUser}『${source}』：「${quote}」\n`;
        fs.appendFileSync(logPath, logLine);

        quotes.push([
          `  --- ${quote}`,
          `     　　${displayUser}『${source}』 ${date}`
        ]);
      }
    }
    
    console.log(`\nFetched ${quotes.length} quotes successfully!`);
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

  const topOffset = 10;
  
  // 最初に指定した件数分の名言を一気に取得
  const allQuotes = await generateBatchQuotes(Math.min(quoteCount, 25)); // APIの制限を考慮して上限を設ける
  
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
}

mainLoop();
