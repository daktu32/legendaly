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

// 滑らかな文字出現アニメーション
async function displayCharacterSequence(figletFont, layout) {
  // figletロゴを生成
  const figletOutput = execSync(`figlet -f ${figletFont} "Legendaly"`, { encoding: 'utf8' });
  const logoLines = figletOutput.trim().split('\n');
  
  // 各文字の位置範囲を特定する
  const characterRanges = identifyCharacterRanges(logoLines);
  const totalAnimationTime = 2000; // 全体のアニメーション時間（ミリ秒）
  const frameRate = 60; // フレームレート
  const frameTime = 1000 / frameRate; // フレーム間隔
  const totalFrames = Math.floor(totalAnimationTime / frameTime);
  
  // 各文字の出現タイミングを計算
  const characterTimings = characterRanges.map((_, index) => {
    const start = (index / characterRanges.length) * 0.7; // 70%の時間で文字出現完了
    const duration = 0.3; // 各文字のフェードイン時間
    return { start, duration };
  });
  
  // 滑らかなアニメーションループ
  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    
    // 前のフレームをクリア
    if (frame > 0) {
      for (let i = 0; i < logoLines.length; i++) {
        readline.cursorTo(process.stdout, 0, layout.headerTopOffset + i);
        readline.clearLine(process.stdout, 0);
      }
    }
    
    // 各文字を描画
    for (let charIndex = 0; charIndex < characterRanges.length; charIndex++) {
      const timing = characterTimings[charIndex];
      const range = characterRanges[charIndex];
      
      // 文字のアニメーション進行度を計算
      let charAlpha = 0;
      if (progress >= timing.start) {
        const charProgress = Math.min(1, (progress - timing.start) / timing.duration);
        charAlpha = easeOutCubic(charProgress);
      }
      
      // 他の文字との相対的な明度を計算
      let brightness = 0.3; // 基本の薄さ
      let shouldRender = charAlpha > 0; // 文字を描画するかどうか
      
      if (charAlpha > 0) {
        // より滑らかなアクティブ文字の計算（小数値を保持）
        const exactActiveChar = progress * characterRanges.length / 0.7;
        const currentActiveChar = Math.floor(exactActiveChar);
        const activeCharFraction = exactActiveChar - currentActiveChar;
        
        if (charIndex === currentActiveChar) {
          // 現在出現中の文字は最も明るく（フェーズに応じて調整）
          const baseBrightness = 0.3 + (charAlpha * 0.7);
          // アクティブ度に応じた追加の明るさ
          const activeBrightness = 0.4 * (1 - activeCharFraction);
          brightness = Math.min(1, baseBrightness + activeBrightness);
        } else if (charIndex === currentActiveChar + 1 && activeCharFraction > 0.5) {
          // 次に出現する文字の準備（少し明るくし始める）
          brightness = 0.3 + (charAlpha * 0.7 * activeCharFraction);
        } else if (charIndex < currentActiveChar) {
          // 既に出現済みの文字は滑らかにフェードアウト
          const distanceFromActive = exactActiveChar - charIndex;
          
          // 指数関数的な減衰で滑らかなグラデーション
          const fadeRate = 0.3; // フェード速度
          const fadeCurve = Math.exp(-fadeRate * distanceFromActive);
          
          if (fadeCurve < 0.05) {
            // ほぼ見えないレベルになったら完全に消す
            shouldRender = false;
          } else {
            // 初期の明るさから滑らかに減衰
            const initialBrightness = 0.3 + (charAlpha * 0.7);
            brightness = initialBrightness * fadeCurve;
            brightness = Math.max(0.05, brightness); // 最小値を保証
          }
        } else {
          // まだ出現していない文字
          brightness = 0.3 + (charAlpha * 0.7);
        }
      }
      
      // 文字を描画
      if (shouldRender) {
        const gray = Math.round(brightness * 255);
        const colorCode = `\x1b[38;2;${gray};${gray};${gray}m`;
        const boldCode = brightness > 0.8 ? '\x1b[1m' : '';
        
        for (let lineIndex = 0; lineIndex < logoLines.length; lineIndex++) {
          const line = logoLines[lineIndex];
          const baseIndent = Math.max(0, Math.floor((layout.columns - line.length) / 2));
          const finalLine = layout.headerTopOffset + lineIndex;
          
          for (let pos = range.start; pos <= range.end; pos++) {
            if (pos < line.length && line[pos] !== ' ') {
              readline.cursorTo(process.stdout, baseIndent + pos, finalLine);
              process.stdout.write(`${colorCode}${boldCode}${line[pos]}\x1b[0m`);
            }
          }
        }
      }
    }
    
    await sleep(frameTime);
  }
  
  // 全文字表示完了後の演出
  await smoothFadeOut(logoLines, layout, 800);
  
  // 少し待ってから波エフェクトを開始
  await sleep(200);
}

// イージング関数（滑らかな出現）
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// 滑らかなフェードアウト
async function smoothFadeOut(logoLines, layout, duration) {
  const frameRate = 60;
  const frameTime = 1000 / frameRate;
  const totalFrames = Math.floor(duration / frameTime);
  
  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    const alpha = 1 - easeOutCubic(progress);
    
    // 前のフレームをクリア
    for (let i = 0; i < logoLines.length; i++) {
      readline.cursorTo(process.stdout, 0, layout.headerTopOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    // アルファ値に基づいて文字を描画
    if (alpha > 0) {
      const gray = Math.round(alpha * 200);
      const colorCode = `\x1b[38;2;${gray};${gray};${gray}m`;
      
      for (let lineIndex = 0; lineIndex < logoLines.length; lineIndex++) {
        const line = logoLines[lineIndex];
        const baseIndent = Math.max(0, Math.floor((layout.columns - line.length) / 2));
        const finalLine = layout.headerTopOffset + lineIndex;
        
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const char = line[charIndex];
          if (char !== ' ') {
            readline.cursorTo(process.stdout, baseIndent + charIndex, finalLine);
            process.stdout.write(`${colorCode}${char}\x1b[0m`);
          }
        }
      }
    }
    
    await sleep(frameTime);
  }
  
  // 最終クリア
  for (let i = 0; i < logoLines.length + 2; i++) {
    readline.cursorTo(process.stdout, 0, layout.headerTopOffset + i - 1);
    readline.clearLine(process.stdout, 0);
  }
}

// figletロゴから各文字の位置範囲を特定する
function identifyCharacterRanges(logoLines) {
  const maxWidth = Math.max(...logoLines.map(line => line.length));
  const ranges = [];
  
  // 簡単な推定：各文字が約12文字幅と仮定
  const estimatedCharWidth = Math.floor(maxWidth / 8); // "Legendaly"は8文字
  
  for (let i = 0; i < 8; i++) {
    const start = i * estimatedCharWidth;
    const end = Math.min((i + 1) * estimatedCharWidth - 1, maxWidth - 1);
    ranges.push({ start, end });
  }
  
  return ranges;
}

// ロゴにウェイブ演出を適用（左から右への色変化エフェクト付き）
async function displayLogoWithWave(figletFont, lolcatArgs, layout) {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  // figletロゴを生成
  const figletOutput = execSync(`figlet -f ${figletFont} "Legendaly"`, { encoding: 'utf8' });
  const logoLines = figletOutput.trim().split('\n');
  
  // ロゴ全体の最大幅を取得
  const maxLogoWidth = Math.max(...logoLines.map(line => line.length));
  
  // カラー付きロゴをTrueColorで表示
  const colorWaveFrames = 60; // より長いアニメーション
  const frameSpeed = 70; // 少し速く
  
  for (let frame = 0; frame < colorWaveFrames; frame++) {
    // 前回の表示をクリア（より広範囲）
    if (frame > 0) {
      for (let i = 0; i < logoLines.length + 2; i++) {
        readline.cursorTo(process.stdout, 0, layout.headerTopOffset + i - 1);
        readline.clearLine(process.stdout, 0);
      }
    }
    
    // 各行を文字単位で色付けして表示
    for (let lineIndex = 0; lineIndex < logoLines.length; lineIndex++) {
      const line = logoLines[lineIndex];
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === ' ') continue;
        
        // 左から右への波の進行
        const waveProgress = (frame / colorWaveFrames) * (maxLogoWidth + 25);
        const charDistance = Math.abs(charIndex - waveProgress);
        
        // より強い発光エフェクト（波の中心に近いほど明るく）
        const glowRadius = 12;
        const glowIntensity = Math.max(0, 1 - charDistance / glowRadius);
        const superGlow = glowIntensity > 0.7 ? Math.pow(glowIntensity, 0.5) : glowIntensity;
        
        // 基本位置計算（固定）
        const baseIndent = Math.max(0, Math.floor((layout.columns - line.length) / 2));
        const finalIndent = baseIndent;
        const finalLine = layout.headerTopOffset + lineIndex;
        
        // 色相の変化（より鮮やかな虹色の波）
        const baseHue = (frame * 4 + charIndex * 3) % 360;
        const hue = baseHue + superGlow * 90;
        
        // より強烈な彩度と明度の調整
        const saturation = 85 + superGlow * 15;  // より鮮やかな色
        const lightness = 45 + superGlow * 50;   // より強い発光
        
        // HSLからRGBに変換
        const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100);
        
        // カーソル位置設定
        readline.cursorTo(process.stdout, finalIndent + charIndex, finalLine);
        
        // 基本カラーコード
        const colorCode = `\x1b[38;2;${Math.round(rgb.r)};${Math.round(rgb.g)};${Math.round(rgb.b)}m`;
        
        // 波の中心での太字エフェクト
        let effectCodes = '';
        if (superGlow > 0.5) {
          // 太字のみ
          effectCodes = '\x1b[1m';
        }
        
        // シンプルな一回描画
        const resetCode = '\x1b[0m';
        process.stdout.write(`${colorCode}${effectCodes}${char}${resetCode}`);
      }
    }
    
    await sleep(frameSpeed);
  }
}

// HSLからRGBに変換する関数
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: r * 255,
    g: g * 255,
    b: b * 255
  };
}

// ヘッダーを美的に表示（ウェイブ演出付き）
async function displayHeader(figletFont, lolcatArgs, withWave = true) {
  const layout = calculateLayout(figletFont);
  
  // 上部に適切な空白を追加
  for (let i = 0; i < layout.headerTopOffset; i++) {
    console.log("");
  }
  
  if (withWave) {
    // まず文字を一つずつ表示
    await displayCharacterSequence(figletFont, layout);
    // その後ウェイブ演出を開始
    await displayLogoWithWave(figletFont, lolcatArgs, layout);
  } else {
    // 従来の方法でロゴを表示
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const figletOutput = execSync(`figlet -f ${figletFont} "Legendaly"`, { encoding: 'utf8' });
    const logoLines = figletOutput.trim().split('\n');
    const tmpFile = path.join(os.tmpdir(), 'legendaly_logo.txt');
    
    try {
      const centeredLogo = logoLines.map(line => {
        const visualLength = line.length;
        const indent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
        return ' '.repeat(indent) + line;
      }).join('\n');
      
      fs.writeFileSync(tmpFile, centeredLogo);
      
      if (lolcatArgs) {
        execSync(`cat "${tmpFile}" | lolcat ${lolcatArgs} --force`, { stdio: 'inherit' });
      } else {
        console.log(centeredLogo);
      }
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // ファイル削除エラーは無視
      }
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
async function displayQuoteLoop(quotes, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, figletFont, tone, style = 'standard', afterDisplay = async () => {}) {
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
    const aestheticQuote = createAestheticQuoteLayout(currentQuote, layout, style);
    
    await typeOut(aestheticQuote, typeSpeed, topOffset, tone);
    await sleep(displayTime);
    await fadeOutFullwidth(aestheticQuote, topOffset, fadeSteps, fadeDelay, tone);
    await afterDisplay(currentQuote);
    
    // 次の名言へ
    quoteIndex = (quoteIndex + 1) % quotes.length;
    
    await sleep(interval * 1000);
  }
}

// ロゴを基準とした美的な名言レイアウトを作成
function createAestheticQuoteLayout(quote, layout, style = 'standard') {
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
    if (style === 'left') {
      indent = 0;
    } else if (style === 'right') {
      indent = Math.max(0, layout.columns - visualLength - 2);
    } else if (style === 'wave') {
      const wave = Math.floor(Math.sin(Date.now() / 200) * 10);
      indent = Math.max(0, Math.floor((layout.columns - visualLength) / 2) + wave);
    } else if (index === 0) {
      indent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
    } else {
      const logoEndPosition = Math.floor(layout.columns / 2) + Math.floor(layout.logoMaxWidth / 2);
      const authorIndent = Math.max(0, logoEndPosition - visualLength);
      const centerIndent = Math.max(0, Math.floor((layout.columns - visualLength) / 2));
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