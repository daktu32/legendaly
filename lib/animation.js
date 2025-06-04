const readline = require('readline');
const { execSync } = require('child_process');
const { sleep, showLoadingAnimation, typeOut, fadeOutFullwidth } = require('../ui');

// Ctrl+C などでの中断時の処理をセットアップ
function setupSignalHandlers(showCursor) {
  const displayExitMessage = () => {
    showCursor();
    const { columns, rows } = process.stdout;
    console.clear();
    
    // 美的な終了メッセージを黄金比位置に表示
    const exitMessage = "To Be Continued...";
    const goldenRatio = 1.618;
    const safeColumns = columns || 80;
    const safeRows = rows || 24;
    const verticalPos = Math.floor(safeRows / goldenRatio);
    const horizontalPos = Math.floor((safeColumns - exitMessage.length) / 2);
    
    readline.cursorTo(process.stdout, horizontalPos, verticalPos);
    console.log(exitMessage);
    process.exit(0);
  };

  process.on('SIGINT', displayExitMessage);
  process.on('SIGTERM', displayExitMessage);
}

// 美的レイアウト計算（ロゴ基準）
function calculateLayout(figletFont = 'slant') {
  const { columns, rows } = process.stdout;
  
  // 安全な最小値を設定
  const safeColumns = Math.max(columns || 80, 40);
  const safeRows = Math.max(rows || 24, 10);
  
  // figletロゴの実際のサイズを測定
  let logoHeight = 6; // デフォルト値
  let logoMaxWidth = 0;
  
  try {
    const figletOutput = execSync(`figlet -f ${figletFont} "Legendaly"`, { encoding: 'utf8' });
    const logoLines = figletOutput.trim().split('\n');
    logoHeight = logoLines.length;
    logoMaxWidth = Math.max(...logoLines.map(line => line.length));
  } catch (e) {
    // figletが失敗した場合はデフォルト値を使用
  }
  
  // ロゴを基準とした美的配置
  const totalContentHeight = logoHeight + 8; // ロゴ + サブタイトル + 名言エリア
  const verticalCenter = Math.floor(safeRows / 2);
  const headerTopOffset = Math.max(2, verticalCenter - Math.floor(totalContentHeight / 2));
  
  // サブタイトル位置をロゴの幅を基準に調整
  const subtitleTopOffset = headerTopOffset + logoHeight + 2; // ロゴの直下 + 適切な間隔
  
  // 名言表示位置をサブタイトルから適切な間隔で配置
  const quoteTopOffset = subtitleTopOffset + 3; // サブタイトルから黄金比的間隔
  
  // サブタイトルの水平中央寄せ用のインデント計算
  const subtitleText = "Creating mystical wisdom with AI...";
  const subtitleIndent = Math.max(0, Math.floor((safeColumns - subtitleText.length) / 2));
  
  return {
    columns: safeColumns,
    rows: safeRows,
    headerTopOffset,
    subtitleTopOffset,
    quoteTopOffset,
    subtitleIndent,
    logoHeight,
    logoMaxWidth,
    verticalCenter,
    horizontalCenter: Math.floor(safeColumns / 2)
  };
}

// ヘッダーを美的に表示
function displayHeader(figletFont, lolcatArgs) {
  const layout = calculateLayout(figletFont);
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  // 上部に適切な空白を追加
  for (let i = 0; i < layout.headerTopOffset; i++) {
    console.log("");
  }
  
  // figletロゴを生成して中央寄せ
  const figletOutput = execSync(`figlet -f ${figletFont} "Legendaly"`, { encoding: 'utf8' });
  const logoLines = figletOutput.trim().split('\n');
  
  // 一時ファイルを使用してlolcatに渡す
  const tmpFile = path.join(os.tmpdir(), 'legendaly_logo.txt');
  
  try {
    // 中央寄せしたロゴを一時ファイルに書き込み
    const centeredLogo = logoLines.map(line => {
      const visualLength = line.length;
      const indent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
      return ' '.repeat(indent) + line;
    }).join('\n');
    
    fs.writeFileSync(tmpFile, centeredLogo);
    
    // lolcatで色付けして表示
    if (lolcatArgs) {
      execSync(`cat "${tmpFile}" | lolcat ${lolcatArgs} --force`, { stdio: 'inherit' });
    } else {
      console.log(centeredLogo);
    }
  } finally {
    // 一時ファイルを削除
    try {
      fs.unlinkSync(tmpFile);
    } catch (e) {
      // ファイル削除エラーは無視
    }
  }
  
  // ロゴとサブタイトル間に美的な間隔を設定
  console.log(""); // 1行の間隔
  
  // サブタイトルを中央寄せで表示（より洗練された位置）
  const subtitleText = "Creating mystical wisdom with AI...";
  const spaces = ' '.repeat(layout.subtitleIndent);
  console.log(spaces + subtitleText);
  
  // サブタイトルと名言エリア間の美的間隔
  console.log(""); // 追加の間隔
}

// 名言を美的に表示するループ
async function displayQuoteLoop(quotes, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, figletFont, tone) {
  let quoteIndex = 0;
  
  while (true) {
    const layout = calculateLayout(figletFont);
    const topOffset = layout.quoteTopOffset;
    
    // 表示エリアをクリア（より大きな範囲をクリア）
    for (let i = 0; i < 10; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    const currentQuote = quotes[quoteIndex];
    
    // 名言をロゴの幅を考慮した美的配置で表示
    const aestheticQuote = createAestheticQuoteLayout(currentQuote, layout);
    
    await typeOut(aestheticQuote, typeSpeed, topOffset, tone);
    await sleep(displayTime);
    await fadeOutFullwidth(aestheticQuote, topOffset, fadeSteps, fadeDelay, tone);
    
    // 次の名言へ
    quoteIndex = (quoteIndex + 1) % quotes.length;
    
    await sleep(interval * 1000);
  }
}

// ロゴを基準とした美的な名言レイアウトを作成
function createAestheticQuoteLayout(quote, layout) {
  if (!quote || !Array.isArray(quote)) return quote;
  
  return quote.map((line, index) => {
    if (!line) return line;
    
    // より正確な表示幅計算
    let visualLength = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const code = char.charCodeAt(0);
      
      // 全角文字の判定
      if (code >= 0x3000 || (code >= 0xFF00 && code <= 0xFFEF) || 
          (code >= 0x4E00 && code <= 0x9FAF) || (code >= 0x3040 && code <= 0x309F) ||
          (code >= 0x30A0 && code <= 0x30FF)) {
        visualLength += 2;
      } else {
        visualLength += 1;
      }
    }
    
    // ロゴの最大幅を基準とした配置
    // 1行目（名言本文）は中央寄せ
    // 2行目（作者・作品情報）は右寄り（より美的）
    let indent;
    if (index === 0) {
      // 名言本文: 完全中央寄せ
      indent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
    } else {
      // 作者情報: ロゴの右端位置に合わせるか、やや右寄りに配置
      const logoEndPosition = Math.floor(layout.columns / 2) + Math.floor(layout.logoMaxWidth / 2);
      const authorIndent = Math.max(0, logoEndPosition - visualLength);
      const centerIndent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
      
      // より美的に見える位置を選択（右寄りだが極端にならない）
      indent = Math.min(authorIndent, centerIndent + Math.floor(layout.columns * 0.1));
    }
    
    return ' '.repeat(indent) + line;
  });
}


module.exports = {
  setupSignalHandlers,
  displayHeader,
  displayQuoteLoop,
  showLoadingAnimation,
  calculateLayout
};