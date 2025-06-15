const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

/**
 * デスクトップ通知を送信する
 * @param {string} message - 通知のメッセージ
 * @param {Object} options - 追加オプション
 * @param {string} options.title - 通知のタイトル（デフォルト: "Legendaly"）
 * @param {string} options.sound - 通知音 (default, Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink)
 * @param {string} options.subtitle - サブタイトル (macOSのみ)
 */
function sendNotification(message, options = {}) {
  const title = options.title || 'Legendaly';
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      // macOS
      const sound = options.sound ? `sound name "${options.sound}"` : '';
      const subtitle = options.subtitle ? `subtitle "${escapeQuotes(options.subtitle)}"` : '';
      
      const script = `display notification "${escapeQuotes(message)}" with title "${escapeQuotes(title)}" ${subtitle} ${sound}`.trim();
      execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
      
    } else if (platform === 'linux') {
      // Linux (notify-send)
      try {
        execSync(`notify-send "${escapeQuotes(title)}" "${escapeQuotes(message)}"`, { stdio: 'ignore' });
      } catch (error) {
        // notify-sendがインストールされていない場合は無視
      }
      
    } else if (platform === 'win32') {
      // Windows (PowerShell) - シンプルなメッセージボックス
      const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${escapeQuotes(message)}', '${escapeQuotes(title)}', 'OK', 'Information')`;
      execSync(`powershell -Command "${script}"`, { stdio: 'ignore' });
    }
  } catch (error) {
    // 通知の失敗は静かに無視（通知は補助機能なので）
  }
}

/**
 * ターミナル画面を点滅させる視覚的通知
 * @param {number} times - 点滅回数
 * @param {number} interval - 点滅間隔（ミリ秒）
 */
function flashScreen(times = 3, interval = 200) {
  for (let i = 0; i < times; i++) {
    setTimeout(() => {
      // 画面を反転（点滅効果）
      process.stdout.write('\x1b[?5h'); // 画面反転ON
      setTimeout(() => {
        process.stdout.write('\x1b[?5l'); // 画面反転OFF
      }, interval / 2);
    }, i * interval);
  }
}

/**
 * カラフルなボーダーで視覚的通知を表示
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ ('success', 'error', 'warning')
 */
function showVisualNotification(message, type = 'success') {
  const colors = {
    success: '\x1b[42m\x1b[30m', // 緑背景、黒文字
    error: '\x1b[41m\x1b[37m',   // 赤背景、白文字
    warning: '\x1b[43m\x1b[30m', // 黄背景、黒文字
    info: '\x1b[44m\x1b[37m'     // 青背景、白文字
  };
  
  const reset = '\x1b[0m';
  const color = colors[type] || colors.info;
  const width = Math.min(process.stdout.columns || 80, 80);
  const padding = Math.max(0, Math.floor((width - message.length - 4) / 2));
  
  const border = '═'.repeat(width);
  const spacer = ' '.repeat(width);
  const content = ' '.repeat(padding) + `📢 ${message}` + ' '.repeat(width - message.length - padding - 3);
  
  console.log(`\n${color}${border}${reset}`);
  console.log(`${color}${spacer}${reset}`);
  console.log(`${color}${content}${reset}`);
  console.log(`${color}${spacer}${reset}`);
  console.log(`${color}${border}${reset}\n`);
}

/**
 * アニメーション付きプログレスバー風通知
 * @param {string} message - メッセージ
 * @param {number} duration - アニメーション時間（ミリ秒）
 */
function showProgressNotification(message, duration = 2000) {
  const width = Math.min(process.stdout.columns || 80, 60);
  const steps = 20;
  const stepTime = duration / steps;
  
  console.log(`\n🎯 ${message}`);
  
  for (let i = 0; i <= steps; i++) {
    setTimeout(() => {
      const filled = '█'.repeat(i);
      const empty = '░'.repeat(steps - i);
      const percent = Math.round((i / steps) * 100);
      
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`\x1b[32m[${filled}${empty}] ${percent}%\x1b[0m`);
      
      if (i === steps) {
        console.log(' ✅ 完了!');
      }
    }, i * stepTime);
  }
}

/**
 * 完了通知を送信する
 * @param {string} quote - 生成された名言
 * @param {Object} metadata - 名言のメタデータ
 * @param {Object} options - 通知オプション
 */
function notifyCompletion(quote, metadata = {}, options = {}) {
  const message = quote ? `名言を生成しました: "${quote}"` : '名言の生成が完了しました';
  
  // 視覚的通知が有効な場合
  if (options.visualNotification) {
    showVisualNotification('✨ 名言生成完了 ✨', 'success');
    if (options.flashScreen) {
      flashScreen(2, 300);
    }
  }
  
  // デスクトップ通知（音声なしオプション対応）
  sendNotification(message, {
    title: 'Legendaly - 完了',
    sound: options.disableSound ? undefined : 'Glass',
    subtitle: metadata.character || ''
  });
}

/**
 * エラー通知を送信する
 * @param {string} errorMessage - エラーメッセージ
 * @param {Object} options - 通知オプション
 */
function notifyError(errorMessage, options = {}) {
  // 視覚的通知が有効な場合
  if (options.visualNotification) {
    showVisualNotification(`❌ エラー: ${errorMessage}`, 'error');
    if (options.flashScreen) {
      flashScreen(5, 150); // エラー時は多めに点滅
    }
  }
  
  sendNotification(`エラーが発生しました: ${errorMessage}`, {
    title: 'Legendaly - エラー',
    sound: options.disableSound ? undefined : 'Basso'
  });
}

/**
 * 判断が必要な通知を送信する
 * @param {string} message - メッセージ
 * @param {Object} options - 通知オプション
 */
function notifyAction(message, options = {}) {
  // 視覚的通知が有効な場合
  if (options.visualNotification) {
    showVisualNotification(`⚠️ ${message}`, 'warning');
    if (options.flashScreen) {
      flashScreen(3, 250);
    }
  }
  
  sendNotification(message, {
    title: 'Legendaly - 確認が必要',
    sound: options.disableSound ? undefined : 'Ping'
  });
}

/**
 * クォートをエスケープする
 * @param {string} str - エスケープする文字列
 */
function escapeQuotes(str) {
  return str.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

// 後方互換性のため、元の関数もエクスポート
module.exports = {
  sendNotification,
  notifyCompletion,
  notifyError,
  notifyAction,
  flashScreen,
  showVisualNotification,
  showProgressNotification
};
