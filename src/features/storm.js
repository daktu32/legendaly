const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// TTE effects configuration
const TTE_EFFECTS = [
  'beams', 'binarypath', 'blackhole', 'bouncyballs', 'bubbles', 'burn',
  'colorshift', 'crumble', 'decrypt', 'errorcorrect', 'expand', 'fireworks',
  'highlight', 'laseretch', 'matrix', 'middleout', 'orbittingvolley',
  'overflow', 'pour', 'print', 'rain', 'randomsequence', 'rings',
  'scattered', 'slice', 'slide', 'spotlights', 'spray', 'swarm',
  'sweep', 'synthgrid', 'unstable', 'vhstape', 'waves', 'wipe'
];

const DISSOLVE_EFFECTS = ['crumble', 'scattered', 'spray', 'swarm', 'burn'];

// Check if tte is available
function checkTTE() {
  try {
    execSync('which tte', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get terminal dimensions
function getTerminalSize() {
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24
  };
}

// Adjust left margin based on content for center alignment
function centerContent(lines) {
  const { columns } = getTerminalSize();
  let maxLen = 0;
  
  // Find the longest line
  lines.forEach(line => {
    const len = line.replace(/\x1b\[[0-9;]*m/g, '').length; // Remove ANSI codes
    if (len > maxLen) maxLen = len;
  });
  
  const padding = Math.max(0, Math.floor((columns - maxLen) / 3));
  return lines.map(line => ' '.repeat(padding) + line);
}

// Format quote for display
function formatQuoteForStorm(quote) {
  if (!quote || !Array.isArray(quote)) return [];
  
  const [text, character, work, period] = quote;
  const lines = [];
  
  // Add quote text
  if (text) {
    lines.push(`「${text}」`);
  }
  
  // Add attribution
  if (character || work) {
    let attribution = '';
    if (character) attribution += ` - ${character}`;
    if (work) attribution += ` (${work})`;
    if (period) attribution += ` - ${period}`;
    lines.push(attribution);
  }
  
  return lines;
}

// Load quotes from echoes directory
async function loadHistoricalQuotes(limit = 100) {
  const echoesDir = path.join(os.homedir(), '.legendaly', 'echoes');
  const quotes = [];
  
  try {
    const files = fs.readdirSync(echoesDir)
      .filter(f => f.endsWith('.echoes'))
      .sort((a, b) => b.localeCompare(a)) // Most recent first
      .slice(0, 10); // Last 10 sessions
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(echoesDir, file), 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.quote) {
            quotes.push(parsed.quote);
            if (quotes.length >= limit) return quotes;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  } catch (err) {
    console.error('Failed to load historical quotes:', err.message);
  }
  
  return quotes;
}

// Display quote with TTE effect
function displayWithTTE(content, effect) {
  return new Promise((resolve, reject) => {
    const tte = spawn('tte', [
      '--canvas-width', '0',
      '--canvas-height', '0',
      '--wrap-text',
      '--anchor-canvas', 'c',
      effect
    ]);
    
    tte.stdin.write(content);
    tte.stdin.end();
    
    tte.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`TTE exited with code ${code}`));
      }
    });
    
    tte.on('error', reject);
  });
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main echoes mode function
async function runEchoesMode(quotes, options = {}) {
  const {
    interval = 5000,
    includeHistory = true,
    randomOrder = true,
    continuous = true
  } = options;
  
  // Check TTE availability
  if (!checkTTE()) {
    console.error('\n❌ Echoes mode requires Terminal Text Effects (tte)');
    console.error('\n📦 Install with: pip install terminal-text-effects\n');
    process.exit(1);
  }
  
  // Prepare quotes pool
  let quotePool = [...quotes];
  
  if (includeHistory) {
    const historicalQuotes = await loadHistoricalQuotes();
    quotePool = [...quotePool, ...historicalQuotes];
  }
  
  if (quotePool.length === 0) {
    console.error('No quotes available for echoes mode');
    return;
  }
  
  // Hide cursor
  process.stdout.write('\x1b[?25l');
  
  // Restore cursor on exit
  const cleanup = () => {
    process.stdout.write('\x1b[?25h'); // Show cursor
    console.clear();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  // Main display loop
  let index = 0;
  while (continuous || index < quotePool.length) {
    console.clear();
    
    // Select quote
    const quoteIndex = randomOrder 
      ? Math.floor(Math.random() * quotePool.length)
      : index % quotePool.length;
    const quote = quotePool[quoteIndex];
    
    // Format and center the quote
    const lines = formatQuoteForStorm(quote);
    const centeredLines = centerContent(lines);
    const content = centeredLines.join('\n');
    
    // Select random effect
    const effect = TTE_EFFECTS[Math.floor(Math.random() * TTE_EFFECTS.length)];
    
    try {
      // Display with effect
      await displayWithTTE(content, effect);
      
      // Wait before next quote
      await sleep(interval);
      
    } catch (err) {
      console.error('TTE error:', err.message);
      // Fallback to simple display
      console.log(content);
      await sleep(interval);
    }
    
    index++;
  }
  
  // Cleanup
  cleanup();
}

// Echoes mode with existing quotes in memory
async function echoesModeWithQuotes(quotes, options = {}) {
  console.log('\n🔮  Entering Echoes Mode...\n');
  await sleep(1000);
  await runEchoesMode(quotes, options);
}

// Standalone echoes mode (loads historical quotes only)
async function standaloneEchoesMode(options = {}) {
  console.log('\n🔮  Echoes Mode: Loading historical quotes...\n');
  const quotes = await loadHistoricalQuotes(200);
  
  if (quotes.length === 0) {
    console.error('No historical quotes found. Generate some quotes first!');
    return;
  }
  
  console.log(`Found ${quotes.length} quotes. Starting echoes...\n`);
  await sleep(1000);
  
  await runEchoesMode(quotes, { ...options, includeHistory: false });
}

module.exports = {
  runEchoesMode,
  echoesModeWithQuotes,
  standaloneEchoesMode,
  // Legacy aliases for backward compatibility
  runStormMode: runEchoesMode,
  stormModeWithQuotes: echoesModeWithQuotes,
  standaloneStormMode: standaloneEchoesMode,
  checkTTE,
  TTE_EFFECTS,
  DISSOLVE_EFFECTS
};