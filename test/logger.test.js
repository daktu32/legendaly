const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { formatDateAsCompactString, initializeLogPaths } = require('../src/utils/logger');

test('logger functions', async (t) => {
  await t.test('formatDateAsCompactString formats date correctly', () => {
    const date = new Date('2024-01-15T14:30:45.123Z');
    const formatted = formatDateAsCompactString(date);
    
    // 期待される形式: yyyyMMddHHmmssfff
    assert.match(formatted, /^\d{17}$/);
    assert(formatted.startsWith('202401'));
  });

  await t.test('initializeLogPaths creates directories and returns paths', () => {
    const tempDir = path.join(__dirname, 'temp_logger_test');
    
    // テスト前にディレクトリが存在しないことを確認
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    
    const { logPath, echoesPath } = initializeLogPaths(tempDir, 'epic', 'ja');
    
    // echoesディレクトリが作成されているか確認
    assert(fs.existsSync(path.join(tempDir, 'echoes')));
    
    // パスが正しく設定されているか確認
    assert.strictEqual(logPath, path.join(tempDir, 'legendaly.log'));
    assert(echoesPath.startsWith(path.join(tempDir, 'echoes')));
    assert(echoesPath.includes('-epic-ja.echoes'));
    
    // クリーンアップ
    fs.rmSync(tempDir, { recursive: true });
  });

  await t.test('initializeLogPaths works with existing directories', () => {
    const tempDir = path.join(__dirname, 'temp_logger_test2');
    const echoesDir = path.join(tempDir, 'echoes');
    
    // ディレクトリを事前に作成
    fs.mkdirSync(echoesDir, { recursive: true });
    
    const { logPath, echoesPath } = initializeLogPaths(tempDir, 'zen', 'en');
    
    // パスが正しく設定されているか確認
    assert.strictEqual(logPath, path.join(tempDir, 'legendaly.log'));
    assert(echoesPath.includes('-zen-en.echoes'));
    
    // クリーンアップ
    fs.rmSync(tempDir, { recursive: true });
  });
});