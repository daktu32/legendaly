#!/usr/bin/env node

const path = require('path');
const os = require('os');
const openai = require(path.join(os.homedir(), '.config', 'common', 'openaiClients.js'));
const readline = require('readline');
const { execSync } = require('child_process');

const tone = process.env.TONE || 'epic';
const user = process.env.TWEET_USER || 'しごできジャイアン';
const colorTone = process.env.COLOR_TONE || 'cyan';
const figletCmd = `figlet -f big "Legendaly" | lolcat --freq=0.3 --speed=25`;

console.clear();
execSync(figletCmd, { stdio: 'inherit' });
console.log("Crafting legendary quotes with AI...\n");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeOut(text, delay = 40) {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(delay);
  }
  process.stdout.write('\n');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function mistOutRandom(lines, topOffset = 8, delay = 8) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].split('');
    const indices = [...line.keys()];
    shuffleArray(indices);
    for (const j of indices) {
      readline.cursorTo(process.stdout, j, topOffset + i);
      process.stdout.write(' ');
      await sleep(delay);
    }
  }
}

(async () => {
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "あなたは名言を創るのが得意な偉人です。" },
      { role: "user", content: `「${tone}」なスタイルで、短い名言を1つ述べてください。` }
    ]
  });

  const quote = res.choices[0].message.content.trim();
  const date = new Date().toISOString().split("T")[0];
  const lines = [
    `  --- ${quote}`,
    `     　　　　　　         ${date}  ${user}`
  ];

  const topOffset = 8;

  for (const line of lines) {
    await typeOut(line);
    await sleep(300);
  }

  await sleep(2000); // pause before mist
  await mistOutRandom(lines, topOffset, 10);
})();
