const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');
const os = require('os');

// OpenAI APIクライアントの初期化
// 1. 環境変数から直接読み込み
// 2. 外部のopenaiClients.jsファイルがあれば使用（後方互換性）
function createOpenAIClient() {
  // 外部ファイルのパスを確認
  const customPath = process.env.OPENAI_CLIENT_PATH;
  const defaultPath = path.join(os.homedir(), '.config/common/openaiClients.js');
  const externalPath = customPath || defaultPath;
  
  try {
    // 外部ファイルが存在する場合は使用（後方互換性）
    if (fs.existsSync(externalPath)) {
      return require(externalPath);
    }
  } catch (error) {
    // 外部ファイルの読み込みに失敗した場合は内部実装を使用
    console.warn(`Warning: Could not load external OpenAI client from ${externalPath}`);
  }
  
  // APIキーの確認
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ Error: OPENAI_API_KEY environment variable is not set.');
    console.error('\n📝 Please set your OpenAI API key:');
    console.error('   export OPENAI_API_KEY="your-api-key-here"\n');
    process.exit(1);
  }
  
  // 内部でOpenAIクライアントを作成
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

module.exports = createOpenAIClient();
