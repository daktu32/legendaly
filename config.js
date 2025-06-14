const dotenv = require('dotenv');
const path = require('path');
const os = require('os');

// Load environment variables from .env if present
dotenv.config();

const colorToneMap = {
  cyberpunk: '--freq=0.9 --spread=2.5 --seed 42',
  mellow: '--freq=0.2 --spread=3.0',
  retro: '--freq=0.5 --spread=2.0',
  neon: '--freq=1.0 --spread=3.5',
  epic: '--freq=0.8 --spread=2.0 --seed 17',
  zen: '--freq=0.15 --spread=3.0',
  default: ''
};

// 設定値のバリデーション関数
function validateNumber(value, min, max, defaultValue, name) {
  const num = Number(value);
  if (isNaN(num)) {
    console.warn(`警告: ${name} の値が無効です。デフォルト値 ${defaultValue} を使用します。`);
    return defaultValue;
  }
  if (num < min || num > max) {
    console.warn(`警告: ${name} の値は ${min} から ${max} の範囲内である必要があります。デフォルト値 ${defaultValue} を使用します。`);
    return defaultValue;
  }
  return num;
}

function validateString(value, allowedValues, defaultValue, name) {
  if (!allowedValues.includes(value)) {
    console.warn(`警告: ${name} の値 '${value}' は無効です。許可される値: ${allowedValues.join(', ')}。デフォルト値 '${defaultValue}' を使用します。`);
    return defaultValue;
  }
  return value;
}

function validatePath(value, defaultValue, name) {
  if (!value) {
    return defaultValue;
  }
  // パスが ~ で始まる場合はホームディレクトリに展開
  const expandedPath = value.startsWith('~') 
    ? path.join(os.homedir(), value.slice(1))
    : value;
  return expandedPath;
}

// サポートされている値
const supportedTones = ['epic', 'cyberpunk', 'mellow', 'retro', 'neon', 'zen'];
const supportedLanguages = ['ja', 'en', 'zh', 'ko', 'fr', 'es', 'de'];
const supportedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

module.exports = {
  openaiClientPath: validatePath(
    process.env.OPENAI_CLIENT_PATH,
    path.join(os.homedir(), '.config', 'common', 'openaiClients.js'),
    'OPENAI_CLIENT_PATH'
  ),
  tone: validateString(
    process.env.TONE || 'epic',
    supportedTones,
    'epic',
    'TONE'
  ),
  language: validateString(
    process.env.LANGUAGE || 'ja',
    supportedLanguages,
    'ja',
    'LANGUAGE'
  ),
  fetchInterval: validateNumber(
    process.env.FETCH_INTERVAL || 1,
    1, 300, 1, 'FETCH_INTERVAL'
  ),
  quoteCount: validateNumber(
    process.env.QUOTE_COUNT || 25,
    1, 1000, 25, 'QUOTE_COUNT'
  ),
  typeSpeed: validateNumber(
    process.env.TYPE_SPEED || 40,
    1, 1000, 40, 'TYPE_SPEED'
  ),
  fadeSteps: validateNumber(
    process.env.FADE_STEPS || 8,
    1, 50, 8, 'FADE_STEPS'
  ),
  fadeDelay: validateNumber(
    process.env.FADE_DELAY || 100,
    10, 5000, 100, 'FADE_DELAY'
  ),
  displayTime: validateNumber(
    process.env.DISPLAY_TIME || 2000,
    100, 60000, 2000, 'DISPLAY_TIME'
  ),
  figletFont: process.env.FIGLET_FONT || 'slant',
  model: validateString(
    process.env.MODEL || 'gpt-4o-mini',
    supportedModels,
    'gpt-4o-mini',
    'MODEL'
  ),
  verbose: process.env.VERBOSE === 'true' || process.env.VERBOSE === '1',
  colorToneMap,
  combinedTones: (process.env.TONES || process.env.TONE || 'epic').split(',').map(t => t.trim()).filter(Boolean),
  category: process.env.CATEGORY || '',
  userPrompt: process.env.USER_PROMPT || '',
  minRating: validateNumber(process.env.MIN_RATING || 0, 0, 5, 0, 'MIN_RATING'),
  displayStyle: process.env.DISPLAY_STYLE || 'standard',
  audioFile: process.env.AUDIO_FILE || '',
  enableNotifications: process.env.NOTIFY === 'true' || process.env.NOTIFY === '1',
  interactive: process.env.INTERACTIVE === 'true' || process.env.INTERACTIVE === '1'
};