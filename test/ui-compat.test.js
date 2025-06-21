const test = require('node:test');
const assert = require('node:assert');
const { PassThrough } = require('stream');
const readline = require('readline');
const ui = require('../src/ui/ui');

function runWithEnv(env, fn) {
  const prev = process.env.TERM_PROGRAM;
  if (env === undefined) {
    delete process.env.TERM_PROGRAM;
  } else {
    process.env.TERM_PROGRAM = env;
  }
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.TERM_PROGRAM; else process.env.TERM_PROGRAM = prev;
  }
}

test('clearLineSafe bypasses readline on iTerm2', () => {
  const out = new PassThrough();
  out.isTTY = true;
  let called = false;
  const orig = readline.clearLine;
  readline.clearLine = () => { called = true; };
  runWithEnv('iTerm.app', () => ui._testInternals.clearLineSafe(out, 0));
  readline.clearLine = orig;
  assert.strictEqual(called, false);
  assert.strictEqual(out.read().toString(), '\x1b[1;1H\x1b[2K');
});

test('clearLineSafe uses readline on other terminals', () => {
  const out = new PassThrough();
  out.isTTY = true;
  let called = false;
  const orig = readline.clearLine;
  readline.clearLine = () => { called = true; out.write('RL'); };
  runWithEnv('xterm', () => ui._testInternals.clearLineSafe(out, 0));
  readline.clearLine = orig;
  assert.strictEqual(called, true);
  assert.strictEqual(out.read().toString(), '\x1b[1;1HRL');
});
