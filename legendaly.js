#!/usr/bin/env node

const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');
const openai = require(path.join(os.homedir(), '.config', 'common', 'openaiClients.js'));
const isFullwidth = require('is-fullwidth-code-point').default;

const tone = process.env.TONE || 'epic';
const user = process.env.TWEET_USER || 'Unsung Hero';
const colorTone = process.env.COLOR_TONE || 'cyan';
const interval = Number(process.env.FETCH_INTERVAL || 10); // seconds
const figletCmd = `figlet -f big "Legendaly" | lolcat --freq=0.3 --speed=25`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeOut(lines, delay = 40, topOffset = 9) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    for (const char of lines[i]) {
      process.stdout.write(char);
      await sleep(delay);
    }
    process.stdout.write('\n');
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
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay);
  }
}

async function generateQuote() {
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "あなたは名言を創るのが得意な偉人です。" },
      { role: "user", content: `「${tone}」なスタイルで、短い名言を1つ述べてください。` }
    ]
  });

  const quote = res.choices[0].message.content.trim();
  const date = new Date().toISOString().split("T")[0];
  return [
    `  --- ${quote}`,
    `     　　　　　　         ${date}  ${user}`
  ];
}

async function mainLoop() {
  console.clear();
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Crafting legendary quotes with AI...\n");

  const topOffset = 9;

  while (true) {
    const lines = await generateQuote();
    await typeOut(lines, 40, topOffset);
    await sleep(2000);
    await fadeOutFullwidth(lines, topOffset, 8, 100);
    await sleep(interval * 1000);
  }
}

mainLoop();
