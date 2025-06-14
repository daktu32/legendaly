const readline = require('readline');
const isFullwidth = require('is-fullwidth-code-point').default;

// Clear a line with extra compatibility handling for terminals like iTerm2
function clearLineSafe(stream, y) {
  readline.cursorTo(stream, 0, y);
  const term = process.env.TERM_PROGRAM || '';
  if (term.toLowerCase().includes('iterm')) {
    stream.write('\x1b[2K');
  } else {
    readline.clearLine(stream, 0);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showDotAnimation(topOffset = 9, maxDots = 30, frameDelay = 150) {
  const line = topOffset;
  let dots = 0;
  let shouldContinue = true;

  const animationLoop = async () => {
    while (dots < maxDots && shouldContinue) {
      clearLineSafe(process.stdout, line);

      let dotString = 'Generating wisdom';
      for (let i = 0; i < dots % 4; i++) {
        dotString += '.';
      }

      process.stdout.write(dotString);
      dots++;

      await sleep(frameDelay);
    }

    clearLineSafe(process.stdout, line);
  };

  animationLoop();

  return function() {
    shouldContinue = false;
  };
}

function hideCursor() {
  process.stderr.write('\x1B[?25l');
}

function showCursor() {
  process.stderr.write('\x1B[?25h');
}

function playSound(file) {
  if (!file) return;
  const { spawn } = require('child_process');
  const player = process.platform === 'darwin' ? 'afplay' : 'aplay';
  try {
    spawn(player, [file], { stdio: 'ignore', detached: true }).unref();
  } catch (e) {
    // ignore errors when audio playback is unavailable
  }
}

function showLoadingAnimation(topOffset = 9, frameDelay = 150, tone = 'epic') {
  const line = topOffset;
  let frameIndex = 0;
  let intervalId = null;

  // toneに応じたローディングフレーム
  const toneFrames = {
    cyberpunk: ['▓', '▒', '░', '▒', '▓', '█', '▓', '▒'],
    zen: ['○', '◔', '◑', '◕', '●', '◕', '◑', '◔'],
    epic: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    mellow: ['·', '•', '●', '•'],
    retro: ['|', '/', '-', '\\'],
    neon: ['◈', '◇', '◆', '◇']
  };
  
  const frames = toneFrames[tone] || toneFrames.epic;
  
  // toneに応じたメッセージ
  const toneMessages = {
    cyberpunk: 'Hacking the Matrix...',
    zen: 'Contemplating wisdom...',
    epic: 'Loading wisdom...',
    mellow: 'Gathering thoughts...',
    retro: 'Processing data...',
    neon: 'Syncing frequencies...'
  };
  
  const baseMessage = toneMessages[tone] || toneMessages.epic;

  // toneに応じたアニメーション速度調整
  const speedMultipliers = {
    cyberpunk: 0.7,
    zen: 2.0,
    epic: 1.0,
    mellow: 1.5,
    retro: 1.2,
    neon: 0.8
  };

  const clearLoading = () => {
    clearLineSafe(process.stdout, line);
  };

  intervalId = setInterval(() => {
    clearLoading();
    
    const loadingText = `${frames[frameIndex]} ${baseMessage}`;
    
    // ローディングテキストを中央寄せ
    const { columns } = process.stdout;
    const safeColumns = columns || 80;
    const visualLength = loadingText.length;
    const indent = Math.max(0, Math.floor((safeColumns - visualLength) / 2));
    
    readline.cursorTo(process.stdout, indent, line);
    process.stdout.write(loadingText);
    frameIndex = (frameIndex + 1) % frames.length;
  }, frameDelay * (speedMultipliers[tone] || 1.0));

  return function() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      clearLoading();
    }
  };
}

async function typeOut(lines, delay = 40, topOffset = 9, tone = 'epic') {
  if (!lines) {
    console.error('Warning: Tried to display undefined lines');
    lines = [
      '  --- Error: Unable to parse quote properly',
      '     　　System\u300eLegendaly\u300f ' + new Date().toISOString().split('T')[0]
    ];
  }

  // カーソルを非表示にする
  hideCursor();

  for (let i = 0; i < lines.length + 1; i++) {
    clearLineSafe(process.stdout, topOffset + i);
  }

  // toneに応じたタイプライターエフェクト
  await applyToneTypingEffect(lines, delay, topOffset, tone);

  // タイプ完了後もカーソルは非表示のままにする（メインループで管理）
}

// toneに応じたタイプライターエフェクト
async function applyToneTypingEffect(lines, delay, topOffset, tone) {
  switch (tone) {
    case 'cyberpunk':
      await cyberpunkTypeEffect(lines, delay, topOffset);
      break;
    case 'zen':
      await zenTypeEffect(lines, delay, topOffset);
      break;
    case 'epic':
      await epicTypeEffect(lines, delay, topOffset);
      break;
    case 'mellow':
      await mellowTypeEffect(lines, delay, topOffset);
      break;
    case 'retro':
      await retroTypeEffect(lines, delay, topOffset);
      break;
    case 'neon':
      await neonTypeEffect(lines, delay, topOffset);
      break;
    default:
      await standardTypeEffect(lines, delay, topOffset);
  }
}

// サイバーパンク: グリッチエフェクト付きタイピング
async function cyberpunkTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];
    let displayText = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      // ランダムでグリッチ文字を表示
      if (Math.random() < 0.1 && char !== ' ') {
        const glitchChars = ['█', '▓', '▒', '░', '¿', '§', '¤', '◄', '►'];
        const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        
        readline.cursorTo(process.stdout, 0, topOffset + i);
        process.stdout.write(displayText + glitchChar);
        await sleep(delay * 0.3);
        
        readline.cursorTo(process.stdout, 0, topOffset + i);
        process.stdout.write(displayText + char);
        await sleep(delay * 0.7);
      } else {
        process.stdout.write(char);
        await sleep(delay);
      }
      
      displayText += char;
    }
  }
}

// 禅: ゆっくりと瞑想的なタイピング
async function zenTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    for (const char of line) {
      process.stdout.write(char);
      // 句読点や重要な文字で一時停止
      if ('。、？！.!?'.includes(char)) {
        await sleep(delay * 3);
      } else if (char === ' ') {
        await sleep(delay * 0.5);
      } else {
        await sleep(delay * 1.5);
      }
    }
  }
}

// エピック: ドラマチックな波状タイピング
async function epicTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      process.stdout.write(char);
      
      // 文の重要な部分で速度を変化
      const intensity = Math.sin(j / line.length * Math.PI) + 1;
      await sleep(delay * (2 - intensity * 0.5));
    }
  }
}

// メロー: 穏やかで一定のリズム
async function mellowTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    for (const char of line) {
      process.stdout.write(char);
      await sleep(delay * 1.2); // やや遅めの一定リズム
    }
  }
}

// レトロ: 古いタイプライター風
async function retroTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    for (const char of line) {
      process.stdout.write(char);
      
      // ランダムな機械的遅延
      const variance = Math.random() * 0.5 + 0.75;
      await sleep(delay * variance);
      
      // 時々詰まる感じ
      if (Math.random() < 0.05) {
        await sleep(delay * 2);
      }
    }
  }
}

// ネオン: 電光掲示板風のタイピング
async function neonTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];
    
    // 単語ごとに一気に表示
    const words = line.split(' ');
    let currentPos = 0;
    
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      
      readline.cursorTo(process.stdout, currentPos, topOffset + i);
      process.stdout.write(word);
      
      currentPos += word.length;
      if (w < words.length - 1) {
        process.stdout.write(' ');
        currentPos += 1;
      }
      
      await sleep(delay * Math.max(3, word.length * 0.5));
    }
  }
}

// 標準: 通常のタイピングエフェクト
async function standardTypeEffect(lines, delay, topOffset) {
  for (let i = 0; i < lines.length; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    const line = lines[i];

    for (const char of line) {
      process.stdout.write(char);
      await sleep(delay);
    }
  }
}

async function fadeOutFullwidth(lines, topOffset = 9, steps = 6, stepDelay = 120, tone = 'epic') {
  if (!lines) {
    console.error('Warning: Tried to fade undefined lines');
    return;
  }

  // toneに応じたフェードエフェクト
  await applyToneFadeEffect(lines, topOffset, steps, stepDelay, tone);

  // 最終クリーンアップ
  for (let i = 0; i < lines.length + 1; i++) {
    clearLineSafe(process.stdout, topOffset + i);
  }
}

// toneに応じたフェードエフェクト
async function applyToneFadeEffect(lines, topOffset, steps, stepDelay, tone) {
  switch (tone) {
    case 'cyberpunk':
      await cyberpunkFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    case 'zen':
      await zenFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    case 'epic':
      await epicFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    case 'mellow':
      await mellowFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    case 'retro':
      await retroFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    case 'neon':
      await neonFadeEffect(lines, topOffset, steps, stepDelay);
      break;
    default:
      await standardFadeEffect(lines, topOffset, steps, stepDelay);
  }
}

// サイバーパンク: グリッチしながらデジタル分解
async function cyberpunkFadeEffect(lines, topOffset, steps, stepDelay) {
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        const fadeChance = step / steps;
        
        if (Math.random() < fadeChance) {
          // グリッチ文字に変換してから消失
          if (Math.random() < 0.3) {
            const glitchChars = ['▓', '▒', '░'];
            return { text: glitchChars[Math.floor(Math.random() * glitchChars.length)], width: isWide ? 2 : 1 };
          } else {
            return { text: isWide ? '　' : ' ', width: isWide ? 2 : 1 };
          }
        }
        return { text: char, width: isWide ? 2 : 1 };
      });
      clearLineSafe(process.stdout, topOffset + i);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay * 0.8); // サイバーパンクは速め
  }
}

// 禅: 静かに霧のように消える
async function zenFadeEffect(lines, topOffset, steps, stepDelay) {
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        // より滑らかなフェード
        const fadeChance = Math.pow(step / steps, 0.7);
        const fade = Math.random() < fadeChance;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      clearLineSafe(process.stdout, topOffset + i);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay * 1.5); // 禅は遅め
  }
}

// エピック: ドラマチックな波状フェード
async function epicFadeEffect(lines, topOffset, steps, stepDelay) {
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fadedLine = line.split('').map((char, j) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        
        // 波状のフェード（端から中央へ）
        const wavePosition = Math.abs(j - line.length / 2) / (line.length / 2);
        const fadeChance = (step / steps) * (1 - wavePosition * 0.3);
        const fade = Math.random() < fadeChance;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      clearLineSafe(process.stdout, topOffset + i);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay);
  }
}

// メロー: 穏やかな均等フェード
async function mellowFadeEffect(lines, topOffset, steps, stepDelay) {
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        const fade = Math.random() < step / steps;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      clearLineSafe(process.stdout, topOffset + i);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay * 1.3);
  }
}

// レトロ: 古いTVのように行ごとに消える
async function retroFadeEffect(lines, topOffset, steps, stepDelay) {
  // 行ごとに順番に消去
  for (let i = 0; i < lines.length; i++) {
    await sleep(stepDelay * 2);
    clearLineSafe(process.stdout, topOffset + i);
  }
}

// ネオン: 点滅しながら消える
async function neonFadeEffect(lines, topOffset, steps, stepDelay) {
  // 点滅エフェクト
  for (let blink = 0; blink < 3; blink++) {
    // 消す
    for (let i = 0; i < lines.length; i++) {
      clearLineSafe(process.stdout, topOffset + i);
    }
    await sleep(stepDelay * 0.5);
    
    // 表示
    for (let i = 0; i < lines.length; i++) {
      readline.cursorTo(process.stdout, 0, topOffset + i);
      process.stdout.write(lines[i]);
    }
    await sleep(stepDelay * 0.5);
  }
  
  // 最終消去
  for (let i = 0; i < lines.length; i++) {
    clearLineSafe(process.stdout, topOffset + i);
  }
}

// 標準: 通常のランダムフェード
async function standardFadeEffect(lines, topOffset, steps, stepDelay) {
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < lines.length; i++) {
      const fadedLine = lines[i].split('').map((char) => {
        if (char === ' ') return { text: ' ', width: 1 };
        const isWide = isFullwidth(char.codePointAt(0));
        const fade = Math.random() < step / steps;
        const replacement = fade ? (isWide ? '　' : ' ') : char;
        return { text: replacement, width: isWide ? 2 : 1 };
      });
      clearLineSafe(process.stdout, topOffset + i);
      process.stdout.write(fadedLine.map(seg => seg.text).join(''));
    }
    await sleep(stepDelay);
  }
}

module.exports = {
  sleep,
  showDotAnimation,
  hideCursor,
  showCursor,
  showLoadingAnimation,
  playSound,
  typeOut,
  fadeOutFullwidth,
  _testInternals: { clearLineSafe }
};
