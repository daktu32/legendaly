const fs = require('fs');
const path = require('path');

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

// ログディレクトリとファイルパスの初期化
function initializeLogPaths(baseDir, tone, language) {
  // echoesディレクトリが存在しない場合は作成
  const echoesDir = path.join(baseDir, 'echoes');
  if (!fs.existsSync(echoesDir)) {
    fs.mkdirSync(echoesDir, { recursive: true });
  }
  
  // 現在の実行用のログファイル名を生成
  const now = new Date();
  const formattedTime = formatDateAsCompactString(now);
  const echoesFname = `${formattedTime}-${tone}-${language}.echoes`;
  const echoesPath = path.join(echoesDir, echoesFname);
  
  // レガシーログパスも残しておく（後方互換性のため）
  const logPath = path.join(baseDir, 'legendaly.log');
  
  return { logPath, echoesPath };
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
  cleanOldLogs
};