#!/usr/bin/env node

const path = require('path');
const readline = require('readline');
require('dotenv').config();
const {
  hideCursor,
  showCursor,
  playSound
} = require('./ui');
const config = require('./config');
const openai = require(config.openaiClientPath);
const { generateBatchQuotes } = require('./lib/quotes');
const { initializeLogPaths, rotateLogIfNeeded, cleanOldLogs, Timer, verboseLog } = require('./lib/logger');
const { setupSignalHandlers, displayHeader, displayQuoteLoop, showLoadingAnimation, calculateLayout } = require('./lib/animation');
const { promptForActions } = require('./lib/interactive');
const { filterByRating } = require('./lib/ratings');
const { sendNotification } = require('./lib/notify');

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
  interactive
} = config;
const args = process.argv.slice(2);
const interactiveMode = interactive || args.includes('--interactive');
const interval = fetchInterval;
const baseTone = combinedTones[0] || tone;
const combinedTone = combinedTones.join('+');

// ログパスの初期化
const { logPath, echoesPath } = initializeLogPaths(__dirname, baseTone, language);

// ログローテーションとクリーンアップ
rotateLogIfNeeded(logPath);
cleanOldLogs(path.join(__dirname, 'echoes'));

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
  console.error('エラーが発生しました:', err);
  process.exit(1);
});

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
  
  // ヘッダーを表示
  displayHeader(figletFont, lolcatArgs);
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
    await displayQuoteLoop(filteredQuotes.length ? filteredQuotes : allQuotes, typeSpeed, displayTime, fadeSteps, fadeDelay, interval, figletFont, baseTone, displayStyle, async (q) => {
      if (enableNotifications) {
        sendNotification(q[0]);
      }
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
    // エラー発生時もローディングアニメーションを停止
    stopLoading();
    // エラー発生時はカーソルを表示
    showCursor();
  }
}

mainLoop();
