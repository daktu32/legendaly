const fs = require('fs');
const path = require('path');
const os = require('os');

// Verbose logging utility
class Timer {
  constructor(name, verbose = false) {
    this.name = name;
    this.verbose = verbose;
    this.startTime = Date.now();
    if (this.verbose) {
      console.log(`[VERBOSE] ${this.name}: 開始`);
    }
  }
  
  mark(label) {
    if (this.verbose) {
      const elapsed = Date.now() - this.startTime;
      console.log(`[VERBOSE] ${this.name}: ${label} (${elapsed}ms)`);
    }
  }
  
  end() {
    if (this.verbose) {
      const elapsed = Date.now() - this.startTime;
      console.log(`[VERBOSE] ${this.name}: 完了 (${elapsed}ms)`);
    }
    return Date.now() - this.startTime;
  }
}

function verboseLog(message, verbose = false) {
  if (verbose) {
    console.log(`[VERBOSE] ${message}`);
  }
}

// 日付をyyyyMMddHHmmssfff形式でフォーマットする関数
function formatDateAsCompactString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

// ~/.legendalyディレクトリの初期化
function ensureLegendaryDirectory() {
  const legendaryDir = path.join(os.homedir(), '.legendaly');
  const subDirs = ['logs', 'echoes', 'config', 'cache'];
  
  // メインディレクトリの作成
  if (!fs.existsSync(legendaryDir)) {
    fs.mkdirSync(legendaryDir, { recursive: true });
  }
  
  // サブディレクトリの作成
  subDirs.forEach(subDir => {
    const dirPath = path.join(legendaryDir, subDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  return legendaryDir;
}

// ログディレクトリとファイルパスの初期化
function initializeLogPaths(baseDir, tone, language) {
  // ~/.legendalyディレクトリを初期化
  const legendaryDir = ensureLegendaryDirectory();
  
  // 新しいパス構造
  const logsDir = path.join(legendaryDir, 'logs');
  const echoesDir = path.join(legendaryDir, 'echoes');
  
  // 現在の実行用のechoesファイル名を生成
  const now = new Date();
  const formattedTime = formatDateAsCompactString(now);
  const echoesFname = `${formattedTime}-${tone}-${language}.echoes`;
  const echoesPath = path.join(echoesDir, echoesFname);
  
  // ログファイルパス
  const logPath = path.join(logsDir, 'legendaly.log');
  
  return { logPath, echoesPath, legendaryDir };
}

// ログファイルのサイズをチェックしてローテーション
function rotateLogIfNeeded(logPath, maxSizeBytes = 10 * 1024 * 1024) { // デフォルト10MB
  try {
    const stats = fs.statSync(logPath);
    if (stats.size > maxSizeBytes) {
      const timestamp = formatDateAsCompactString(new Date());
      const backupPath = logPath.replace(/\.log$/, `.${timestamp}.log`);
      fs.renameSync(logPath, backupPath);
      return true;
    }
  } catch (err) {
    // ファイルが存在しない場合は何もしない
  }
  return false;
}

// 古いログファイルを削除
function cleanOldLogs(logDir, daysToKeep = 30) {
  try {
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // ミリ秒に変換
    
    files.forEach(file => {
      if (file.endsWith('.echoes') || file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (err) {
    console.error('ログクリーンアップエラー:', err.message);
  }
}

module.exports = {
  formatDateAsCompactString,
  initializeLogPaths,
  rotateLogIfNeeded,
  cleanOldLogs,
  ensureLegendaryDirectory,
  Timer,
  verboseLog
};