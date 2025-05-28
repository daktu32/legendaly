const readline = require('readline');
const isFullwidth = require('is-fullwidth-code-point').default;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showDotAnimation(topOffset = 9, maxDots = 30, frameDelay = 150) {
  const line = topOffset;
  let dots = 0;
  let shouldContinue = true;

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

    readline.cursorTo(process.stdout, 0, line);
    readline.clearLine(process.stdout, 0);
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

function showLoadingAnimation(topOffset = 9, frameDelay = 150) {
  const line = topOffset;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let intervalId = null;

  const clearLoading = () => {
    readline.cursorTo(process.stdout, 0, line);
    readline.clearLine(process.stdout, 0);
  };

  intervalId = setInterval(() => {
    clearLoading();
    const loadingString = `${frames[frameIndex]} Loading wisdom...`;
    process.stdout.write(loadingString);
    frameIndex = (frameIndex + 1) % frames.length;
  }, frameDelay);

  return function() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      clearLoading();
    }
  };
}

async function typeOut(lines, delay = 40, topOffset = 9) {
  if (!lines) {
    console.error('Warning: Tried to display undefined lines');
    lines = [
      '  --- Error: Unable to parse quote properly',
      '     　　System\u300eLegendaly\u300f ' + new Date().toISOString().split('T')[0]
    ];
  }

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

  for (let i = 0; i < lines.length + 1; i++) {
    readline.cursorTo(process.stdout, 0, topOffset + i);
    readline.clearLine(process.stdout, 0);
  }
}

module.exports = {
  sleep,
  showDotAnimation,
  hideCursor,
  showCursor,
  showLoadingAnimation,
  typeOut,
  fadeOutFullwidth
};
