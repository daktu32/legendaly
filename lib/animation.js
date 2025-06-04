const readline = require('readline');
const { execSync } = require('child_process');
const { sleep, showLoadingAnimation, typeOut, fadeOutFullwidth } = require('../ui');

// Ctrl+C などでの中断時の処理をセットアップ
function setupSignalHandlers(showCursor) {
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
}

// ヘッダーを表示
function displayHeader(figletFont, lolcatArgs) {
  const figletCmd = `figlet -f ${figletFont} "Legendaly" | lolcat ${lolcatArgs} --force`;
  execSync(figletCmd, { stdio: 'inherit' });
  console.log("Creating mystical wisdom with AI...\n\n");
}

// 名言を表示するループ
async function displayQuoteLoop(quotes, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, topOffset) {
  let quoteIndex = 0;
  
  while (true) {
    // 表示エリアをクリア
    for (let i = 0; i < 5; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    const currentQuote = quotes[quoteIndex];
    await typeOut(currentQuote, typeSpeed, topOffset);
    await sleep(displayTime);
    await fadeOutFullwidth(currentQuote, topOffset, fadeSteps, fadeDelay);
    
    // 次の名言へ
    quoteIndex = (quoteIndex + 1) % quotes.length;
    
    await sleep(interval * 1000);
  }
}

module.exports = {
  setupSignalHandlers,
  displayHeader,
  displayQuoteLoop,
  showLoadingAnimation
};