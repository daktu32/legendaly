const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');

test('config validation', async (t) => {
  await t.test('validates numeric values', () => {
    const env = {
      ...process.env,
      FETCH_INTERVAL: 'invalid',
      QUOTE_COUNT: '-5',
      TYPE_SPEED: '2000',
      FADE_STEPS: '100'
    };
    
    const child = spawn('node', ['-e', `
      const config = require('./config');
      console.log(JSON.stringify({
        fetchInterval: config.fetchInterval,
        quoteCount: config.quoteCount,
        typeSpeed: config.typeSpeed,
        fadeSteps: config.fadeSteps
      }));
    `], { env, cwd: path.dirname(__dirname) });
    
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${error}`));
          return;
        }
        
        // 警告メッセージが出力されているか確認
        assert(error.includes('警告'), 'Should show warning messages');
        
        // デフォルト値が使用されているか確認
        const config = JSON.parse(output);
        assert.strictEqual(config.fetchInterval, 1, 'Invalid FETCH_INTERVAL should use default');
        assert.strictEqual(config.quoteCount, 25, 'Negative QUOTE_COUNT should use default');
        assert.strictEqual(config.typeSpeed, 40, 'Out of range TYPE_SPEED should use default');
        assert.strictEqual(config.fadeSteps, 8, 'Out of range FADE_STEPS should use default');
        resolve();
      });
    });
  });

  await t.test('validates string values', () => {
    const env = {
      ...process.env,
      TONE: 'invalid_tone',
      LANGUAGE: 'xx',
      MODEL: 'gpt-2'
    };
    
    const child = spawn('node', ['-e', `
      const config = require('./config');
      console.log(JSON.stringify({
        tone: config.tone,
        language: config.language,
        model: config.model
      }));
    `], { env, cwd: path.dirname(__dirname) });
    
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${error}`));
          return;
        }
        
        // 警告メッセージが出力されているか確認
        assert(error.includes('警告'), 'Should show warning messages');
        
        // デフォルト値が使用されているか確認
        const config = JSON.parse(output);
        assert.strictEqual(config.tone, 'epic', 'Invalid TONE should use default');
        assert.strictEqual(config.language, 'ja', 'Invalid LANGUAGE should use default');
        assert.strictEqual(config.model, 'gpt-4o-mini', 'Invalid MODEL should use default');
        resolve();
      });
    });
  });

  await t.test('expands home directory in paths', () => {
    const env = {
      ...process.env,
      OPENAI_CLIENT_PATH: '~/test/path.js'
    };
    
    const child = spawn('node', ['-e', `
      const config = require('./config');
      const os = require('os');
      console.log(JSON.stringify({
        openaiClientPath: config.openaiClientPath,
        homeDir: os.homedir()
      }));
    `], { env, cwd: path.dirname(__dirname) });
    
    return new Promise((resolve, reject) => {
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`));
          return;
        }
        
        const result = JSON.parse(output);
        assert(result.openaiClientPath.startsWith(result.homeDir), 'Path should start with home directory');
        assert(result.openaiClientPath.endsWith('test/path.js'), 'Path should end with specified path');
        resolve();
      });
    });
  });
});