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

module.exports = {
  openaiClientPath:
    process.env.OPENAI_CLIENT_PATH ||
    path.join(os.homedir(), '.config', 'common', 'openaiClients.js'),
  tone: process.env.TONE || 'epic',
  language: process.env.LANGUAGE || 'ja',
  fetchInterval: Number(process.env.FETCH_INTERVAL || 3),
  quoteCount: Number(process.env.QUOTE_COUNT || 100),
  typeSpeed: Number(process.env.TYPE_SPEED || 40),
  fadeSteps: Number(process.env.FADE_STEPS || 8),
  fadeDelay: Number(process.env.FADE_DELAY || 100),
  displayTime: Number(process.env.DISPLAY_TIME || 2000),
  figletFont: process.env.FIGLET_FONT || 'slant',
  model: process.env.MODEL || 'gpt-4o',
  colorToneMap
};
