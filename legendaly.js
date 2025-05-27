#!/usr/bin/env node

const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const openai = require(path.join(os.homedir(), '.config', 'common', 'openaiClients.js'));
const isFullwidth = require('is-fullwidth-code-point').default;

// Load user configuration
const { tone, fetchInterval, figletFont, model, colorToneMap } = require('./config');

const lolcatArgs = colorToneMap[tone] || '';
const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs}`;
const logPath = path.join(__dirname, 'legendaly.log');
const role = `
あなたは創作された名言とその文脈を専門に捏造する、AI名言作家です。
tone（雰囲気）に合った世界観・口調で、創作された名言とその背景情報を作ってください。
出力は以下の厳格な形式に従ってください：

名言 : （カギカッコなしの短い一文）
キャラクター名 : （名言を言った架空の人物の名前）
作品名 : （そのキャラクターが登場する架空の作品名）
西暦 : （作品の時代設定。tone と矛盾のない時代を使うこと）

注意点：
- 実在の人物や作品は使用しないでください。
- 「架空の」「発言者」などの説明的な語句は含めないでください。
- 名言にはカギカッコをつけないでください。
`;
const userPrompt = `tone: ${tone} に合う雰囲気で、上記の出力形式に沿って名言とキャラクター情報を生成してください。`;

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

async function generateQuote() {
  try {
    const res = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: role },
        { role: "user", content: userPrompt }
      ]
    });

    const output = res.choices[0].message.content.trim();

    // フォーマットに基づきパース
    const quoteMatch = output.match(/^名言\s*:\s*(.*)/m);
    const userMatch = output.match(/^キャラクター名\s*:\s*(.*)/m);
    const sourceMatch = output.match(/^作品名\s*:\s*(.*)/m);
    const dateMatch = output.match(/^西暦\s*:\s*(.*)/m);

    const quote = quoteMatch ? quoteMatch[1] : '（名言取得失敗）';
    const displayUser = userMatch ? userMatch[1] : 'Unknown';
    const source = sourceMatch ? sourceMatch[1] : 'Unknown';
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];

    const logLine = `[${date}] ${displayUser}『${source}』：「${quote}」\n`;
    fs.appendFileSync(logPath, logLine);

    return [
      `  --- ${quote}`,
      `     　　${displayUser}『${source}』 ${date}`
    ];
  } catch (err) {
    console.error('OpenAI API request failed:', err);
    return [
      '  --- Error fetching quote',
      `     　　Unknown『Unknown』 ${new Date().toISOString().split("T")[0]}`
    ];
  }
}

async function mainLoop() {
  console.clear();
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Crafting legendary quotes with AI...\n\n");

  const topOffset = 10;

  while (true) {
    // 表示エリアをクリア
    for (let i = 0; i < 5; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    const lines = await generateQuote();
    await typeOut(lines, 40, topOffset);
    await sleep(2000);
    await fadeOutFullwidth(lines, topOffset, 8, 100);
    await sleep(fetchInterval * 1000);
  }
}

mainLoop();
