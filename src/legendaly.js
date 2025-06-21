#!/usr/bin/env node

// 初期エラーチェック
function checkDependencies() {
  try {
    require('openai');
  } catch (e) {
    console.error('\n❌ Missing required dependencies.');
    console.error('Please run: npm install\n');
    process.exit(1);
  }
}

checkDependencies();

require('dotenv').config();
const path = require('path');
const readline = require('readline');
const {
  hideCursor,
  showCursor,
  playSound
} = require('./ui/ui');
const config = require('./core/config');
const openai = require('./utils/openaiClients.js');
const { generateBatchQuotes } = require('./core/quotes');
const { initializeLogPaths, rotateLogIfNeeded, cleanOldLogs, Timer, verboseLog } = require('./utils/logger');
const { setupSignalHandlers, displayHeader, displayQuoteLoop, showLoadingAnimation, calculateLayout } = require('./core/animation');
const { promptForActions } = require('./features/interactive');
const { filterByRating } = require('./features/ratings');
const { sendNotification, notifyCompletion, notifyError } = require('./features/notify');

// 設定の取得
const {
  tone,
  language,
  fetchInterval,
  quoteCount,
  typeSpeed,
  fadeSteps,
  fadeDelay,
  displayTime,
  figletFont,
  model,
  verbose,
  colorToneMap,
  combinedTones,
  category,
  userPrompt,
  minRating,
  displayStyle,
  audioFile,
  enableNotifications,
  visualNotifications,
  disableSound,
  flashScreen,
  interactive
} = config;
const args = process.argv.slice(2);
const interactiveMode = interactive || args.includes('--interactive');
const interval = fetchInterval;
const baseTone = combinedTones[0] || tone;
const combinedTone = combinedTones.join('+');

// ログパスの初期化
const { logPath, echoesPath, legendaryDir } = initializeLogPaths(__dirname, baseTone, language);

// ログローテーションとクリーンアップ
rotateLogIfNeeded(logPath);
cleanOldLogs(path.join(legendaryDir, 'echoes'));

const lolcatArgs = colorToneMap[baseTone] || '';

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
  return locale.createBatchPrompt(combinedTone, count, category);
}

// プログラム終了時にカーソルを確実に表示する
process.on('exit', () => {
  showCursor();
});

// エラー発生時にもカーソルを表示する
process.on('uncaughtException', (err) => {
  showCursor();
  console.error('\n❌ エラーが発生しました:', err.message || err);
  if (err.code === 'ENOENT' && err.path && err.path.includes('figlet')) {
    console.error('\n💡 figletが見つかりません。インストールしてください:');
    console.error('   macOS: brew install figlet');
    console.error('   Linux: sudo apt-get install figlet\n');
  }
  if (err.message && err.message.includes('lolcat')) {
    console.error('\n💡 lolcatが見つかりません。インストールしてください:');
    console.error('   gem install lolcat\n');
  }
  process.exit(1);
});

// ヘルプ表示
if (args.includes('-h') || args.includes('--help')) {
  console.log(`
Legendaly - AI-powered inspirational quote generator

Usage: legendaly [options]

Options:
  -h, --help        Show this help message
  --interactive     Enable interactive mode
  --version         Show version

Environment variables:
  OPENAI_API_KEY    Required: Your OpenAI API key
  TONE              Quote tone (epic, zen, cyberpunk, etc.)
  LANGUAGE          Output language (ja, en, zh, ko, fr, es, de)
  MODEL             OpenAI model (gpt-4o-mini, gpt-4-turbo, etc.)

Examples:
  legendaly                    # Generate a quote
  legendaly --interactive      # Interactive mode
  TONE=zen legendaly          # Generate a zen quote
  LANGUAGE=en legendaly       # Generate English quote
`);
  process.exit(0);
}

// バージョン表示
if (args.includes('--version')) {
  const pkg = require('../package.json');
  console.log(`legendaly v${pkg.version}`);
  process.exit(0);
}

// プログラム開始時に一度だけカーソルを確実に非表示にする
hideCursor();

// シグナルハンドラーをセットアップ
setupSignalHandlers(showCursor);

async function mainLoop() {
  const mainTimer = new Timer('メインループ', verbose);
  
  console.clear();
  
  verboseLog(`設定: tone=${tone}, lang=${language}, model=${model}, count=${quoteCount}`, verbose);
  
  // 美的レイアウト計算
  const layout = calculateLayout();
  mainTimer.mark('レイアウト計算完了');
  
  // ヘッダーを表示（ウェイブ演出付き）
  await displayHeader(figletFont, lolcatArgs, true);
  mainTimer.mark('ヘッダー表示完了');
  
  // ローディングアニメーションを開始（動的位置計算）
  const stopLoading = showLoadingAnimation(layout.quoteTopOffset, 150, tone);
  mainTimer.mark('ローディングアニメ開始');
  
  try {
    verboseLog('名言生成処理を開始', verbose);
    // 名言を取得
    const allQuotes = await generateBatchQuotes(
      openai, 
      model, 
      role, 
      createBatchPrompt, 
      allPatterns, 
      language, 
      combinedTone,
      logPath,
      echoesPath,
      Math.min(quoteCount, 10),
      verbose,
      userPrompt,
      category
    );
    mainTimer.mark('名言生成完了');
    
    // ローディングアニメーションを停止して表示をクリア
    stopLoading();
    mainTimer.mark('ローディング停止');
    
    // ローディングアニメーション領域をクリア（より広範囲）
    for (let i = 0; i < 8; i++) {
      readline.cursorTo(process.stdout, 0, layout.quoteTopOffset + i);
      readline.clearLine(process.stdout, 0);
    }
    
    const filteredQuotes = filterByRating(allQuotes, minRating);
    verboseLog('名言表示ループを開始', verbose);
    // 名言を美的レイアウトで表示するループ
    const quotesToDisplay = filteredQuotes.length ? filteredQuotes : allQuotes;
    
    // 名言生成完了を通知
    if (enableNotifications && quotesToDisplay.length > 0) {
      const firstQuote = quotesToDisplay[0];
      notifyCompletion(firstQuote[0], {
        character: firstQuote[1],
        work: firstQuote[2],
        count: quotesToDisplay.length
      }, {
        visualNotification: visualNotifications,
        disableSound: disableSound,
        flashScreen: flashScreen
      });
    }
    
    await displayQuoteLoop(quotesToDisplay, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, figletFont, baseTone, displayStyle, async (q) => {
      if (audioFile) {
        playSound(audioFile);
      }
      if (interactiveMode) {
        await promptForActions(q);
      }
    });
    
    mainTimer.end();
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    // エラーを通知
    if (enableNotifications) {
      notifyError(error.message || 'APIコールに失敗しました', {
        visualNotification: visualNotifications,
        disableSound: disableSound,
        flashScreen: flashScreen
      });
    }
    // エラー発生時もローディングアニメーションを停止
    stopLoading();
    // エラー発生時はカーソルを表示
    showCursor();
  }
}

mainLoop();
