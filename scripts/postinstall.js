#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('\n🎉 Thanks for installing Legendaly!\n');

// 設定ディレクトリの作成
const configDir = path.join(os.homedir(), '.legendaly');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`✓ Created config directory: ${configDir}`);
}

// 環境変数の例を表示
console.log('\n📝 To use Legendaly, you need to set up your OpenAI API key:');
console.log('\n   1. Create a .env file in your project or add to your shell profile:');
console.log('      export OPENAI_API_KEY="your-api-key-here"\n');

// figletとlolcatの確認
console.log('📦 Optional dependencies for enhanced visual effects:');
console.log('   - figlet: brew install figlet (macOS) or apt-get install figlet (Linux)');
console.log('   - lolcat: gem install lolcat\n');

// openaiClients.jsの確認とセットアップガイド
const openaiClientPath = path.join(os.homedir(), '.config/common/openaiClients.js');
if (!fs.existsSync(openaiClientPath)) {
  console.log('⚠️  OpenAI client helper not found at default location.');
  console.log(`   Expected location: ${openaiClientPath}`);
  console.log('\n   You can either:');
  console.log('   1. Create the file at the above location');
  console.log('   2. Set OPENAI_CLIENT_PATH environment variable to your custom location');
  console.log('\n   Example openaiClients.js:');
  console.log(`
const { OpenAI } = require('openai');

module.exports = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
`);
}

console.log('\n🚀 Quick start:');
console.log('   legendaly          # Generate an inspirational quote');
console.log('   legendaly -h       # Show help (if implemented)\n');

console.log('📖 For more information, visit: https://github.com/yourusername/legendaly\n');