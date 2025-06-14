const { exec } = require('child_process');

function sendNotification(message) {
  const cmd = process.platform === 'darwin'
    ? `osascript -e 'display notification "${message.replace(/'/g, "'")}" with title "Legendaly"'`
    : `notify-send "Legendaly" "${message.replace(/"/g, '\\"')}"`;
  exec(cmd, () => {});
}

module.exports = { sendNotification };
