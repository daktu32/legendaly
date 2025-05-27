const dotenv = require('dotenv');
const path = require('path');

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
  tone: process.env.TONE || 'epic',
  fetchInterval: Number(process.env.FETCH_INTERVAL || 3),
  figletFont: process.env.FIGLET_FONT || 'slant',
  model: process.env.MODEL || 'gpt-4o',
  colorToneMap
};
