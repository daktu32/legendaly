const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { formatDateAsCompactString, initializeLogPaths, ensureLegendaryDirectory } = require('../src/utils/logger');

test('logger functions', async (t) => {
  await t.test('formatDateAsCompactString formats date correctly', () => {
    const date = new Date('2024-01-15T14:30:45.123Z');
    const formatted = formatDateAsCompactString(date);
    
    // 期待される形式: yyyyMMddHHmmssfff
    assert.match(formatted, /^\d{17}$/);
    assert(formatted.startsWith('202401'));
  });

  await t.test('initializeLogPaths creates ~/.legendaly directories and returns paths', () => {
    const { logPath, echoesPath, legendaryDir } = initializeLogPaths('dummy', 'epic', 'ja');
    
    // ~/.legendalyディレクトリが作成されているか確認
    const expectedLegendaryDir = path.join(os.homedir(), '.legendaly');
    assert.strictEqual(legendaryDir, expectedLegendaryDir);
    assert(fs.existsSync(legendaryDir));
    
    // サブディレクトリが作成されているか確認
    assert(fs.existsSync(path.join(legendaryDir, 'logs')));
    assert(fs.existsSync(path.join(legendaryDir, 'echoes')));
    assert(fs.existsSync(path.join(legendaryDir, 'config')));
    assert(fs.existsSync(path.join(legendaryDir, 'cache')));
    
    // パスが正しく設定されているか確認
    assert.strictEqual(logPath, path.join(legendaryDir, 'logs', 'legendaly.log'));
    assert(echoesPath.startsWith(path.join(legendaryDir, 'echoes')));
    assert(echoesPath.includes('-epic-ja.echoes'));
  });

  await t.test('ensureLegendaryDirectory creates all required subdirectories', () => {
    const legendaryDir = ensureLegendaryDirectory();
    
    // 期待されるパス
    const expectedDir = path.join(os.homedir(), '.legendaly');
    assert.strictEqual(legendaryDir, expectedDir);
    
    // 全てのサブディレクトリが存在するか確認
    const requiredSubDirs = ['logs', 'echoes', 'config', 'cache'];
    requiredSubDirs.forEach(subDir => {
      assert(fs.existsSync(path.join(legendaryDir, subDir)), `${subDir} directory should exist`);
    });
  });
});