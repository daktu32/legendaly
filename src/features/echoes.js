const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// TTE effects configuration - all officially available effects
const TTE_EFFECTS = [
  'beams',           // Create beams which travel over the canvas illuminating characters
  'binarypath',      // Binary representations move towards character home coordinates
  'blackhole',       // Characters consumed by black hole and explode outwards
  'bouncyballs',     // Characters as bouncy balls falling from top
  'bubbles',         // Characters formed into bubbles that float down and pop
  'burn',            // Burns vertically in the canvas
  'colorshift',      // Display gradient that shifts colors across terminal
  'crumble',         // Characters lose color, crumble to dust, vacuumed up, reformed
  'decrypt',         // Movie style decryption effect
  'errorcorrect',    // Characters start wrong and are corrected in sequence
  'expand',          // Expands text from a single point
  'fireworks',       // Characters launch, explode like fireworks, fall into place
  'highlight',       // Run specular highlight across text
  'laseretch',       // Laser etches characters onto terminal
  'matrix',          // Matrix digital rain effect
  'middleout',       // Text expands in single row/column from middle then out
  'orbittingvolley', // Four launchers orbit canvas firing volleys inward
  'overflow',        // Text overflows and scrolls randomly until ordered
  'pour',            // Pours characters into position from given direction
  'print',           // Lines printed one at a time following print head
  'rain',            // Rain characters from top of canvas
  'randomsequence',  // Prints input data in random sequence
  'rings',           // Characters dispersed and form into spinning rings
  'scattered',       // Text scattered across canvas, moves into position
  'slice',           // Slices input in half, slides from opposite directions
  'slide',           // Slide characters into view from outside terminal
  'spotlights',      // Spotlights search text area, converge and expand
  'spray',           // Characters spawn at varying rates from single point
  'swarm',           // Characters grouped into swarms, move around before settling
  'sweep',           // Sweep across canvas to reveal uncolored text, reverse sweep to color
  'synthgrid',       // Grid fills with characters dissolving into final text
  'unstable',        // Spawn jumbled, explode to edge, reassemble correctly
  'vhstape',         // Lines glitch left/right, lose detail like old VHS tape
  'waves',           // Waves travel across terminal leaving behind characters
  'wipe',            // Wipes text across terminal to reveal characters
];

// Categorized effects for different moods and performance
const FAST_EFFECTS = [
  'slide', 'wipe', 'pour', 'sweep', 'slice', 'expand', 'print'
];

const DRAMATIC_EFFECTS = [
  'fireworks', 'blackhole', 'matrix', 'decrypt', 'unstable', 'vhstape', 'synthgrid'
];

const ELEGANT_EFFECTS = [
  'beams', 'waves', 'colorshift', 'highlight', 'spotlights', 'laseretch'
];

const PLAYFUL_EFFECTS = [
  'bouncyballs', 'bubbles', 'rain', 'spray', 'swarm', 'rings', 'orbittingvolley'
];

const TECHNICAL_EFFECTS = [
  'binarypath', 'errorcorrect', 'randomsequence', 'overflow', 'middleout'
];

const DISSOLVE_EFFECTS = ['crumble', 'scattered', 'spray', 'swarm', 'burn'];

// Check if tte command-line tool is available
function checkTTE() {
  try {
    execSync('which tte', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get terminal dimensions using system commands with dynamic detection
function getTerminalSize() {
  let columns = 120; // Default fallback for modern terminals
  let rows = 30;     // Default fallback for modern terminals
  
  // Prefer process.stdout over tput for more accurate detection
  if (process.stdout.columns && process.stdout.rows) {
    columns = process.stdout.columns;
    rows = process.stdout.rows;
    // console.log(`🔍 Terminal detection (process.stdout): columns=${columns}, rows=${rows}`);
  } else {
    try {
      // Fallback to tput if process.stdout is not available
      const tputCols = execSync('tput cols', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      columns = parseInt(tputCols.trim()) || 120;
      
      const tputRows = execSync('tput lines', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      rows = parseInt(tputRows.trim()) || 30;
      
      // console.log(`🔍 Terminal detection (tput): columns=${columns}, rows=${rows}`);
    } catch (error) {
      // console.log(`🔍 Terminal detection (default): columns=${columns}, rows=${rows}`);
    }
  }
  
  // Ensure minimum bounds for usability, support unlimited large displays
  columns = Math.max(60, columns); // Min 60 chars, no upper limit for ultra-wide monitors
  rows = Math.max(20, rows);        // Min 20 lines, no upper limit for tall displays
  
  return { columns, rows };
}

// Simple content centering for TTE command-line usage
function centerContentSimple(content) {
  const { columns } = getTerminalSize();
  const lines = content.split('\n');
  
  if (lines.length === 0) return content;
  
  // Calculate the maximum line width
  let maxWidth = 0;
  for (const line of lines) {
    const width = calculateVisualWidth(line);
    maxWidth = Math.max(maxWidth, width);
  }
  
  // Calculate padding for center alignment
  const padding = Math.max(0, Math.floor((columns - maxWidth) / 2));
  
  // Apply padding to each line
  const centeredLines = lines.map(line => {
    const lineWidth = calculateVisualWidth(line);
    const linePadding = Math.max(0, Math.floor((columns - lineWidth) / 2));
    return ' '.repeat(linePadding) + line;
  });
  
  return centeredLines.join('\n');
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
          // Try JSON format first (newer format)
          const parsed = JSON.parse(line);
          if (parsed.quote) {
            quotes.push(parsed.quote);
            if (quotes.length >= limit) return quotes;
          }
        } catch {
          // Try text format (legacy format)
          const textMatch = line.match(/^\[([^\]]+)\]\s+([^『]+)『([^』]+)』：「([^」]+)」/);
          if (textMatch) {
            const [, period, character, work, text] = textMatch;
            quotes.push([text, character, work, period]);
            if (quotes.length >= limit) return quotes;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load historical quotes:', err.message);
  }
  
  return quotes;
}

// Extract quotes and prepare text for display
function extractQuotesText(quotes) {
  const { columns } = getTerminalSize();
  const lines = [];
  
  for (const quote of quotes) {
    const [text, character, work, period] = quote;
    const year = period || '';
    const quoteText = text ? `「${text}」` : '';
    const author = character || '';
    const source = work || '';
    
    // Create formatted line for each quote
    const line = [year, quoteText, author, source]
      .filter(part => part.trim())
      .join('  ');
    
    if (line.trim()) {
      lines.push(line);
    }
  }
  
  return lines;
}

// Calculate optimal padding for content centering
function calculateOptimalPadding(content) {
  const { columns } = getTerminalSize();
  const lines = content.split('\n');
  
  // Find the longest line
  let maxWidth = 0;
  for (const line of lines) {
    const width = calculateVisualWidth(line);
    maxWidth = Math.max(maxWidth, width);
  }
  
  // Calculate padding for centering
  const padding = Math.max(0, Math.floor((columns - maxWidth) / 2));
  
  return {
    leftPadding: padding,
    contentWidth: maxWidth,
    totalWidth: columns
  };
}

// Apply padding to content for optimal display
function applyPaddingToContent(content) {
  const { leftPadding } = calculateOptimalPadding(content);
  const lines = content.split('\n');
  
  return lines
    .map(line => ' '.repeat(leftPadding) + line)
    .join('\n');
}

// Display quotes with TTE effect using command-line version
function displayWithTTE(content, effect) {
  return new Promise((resolve, reject) => {
    const { columns, rows } = getTerminalSize();
    
    // Apply optimal padding to content
    const paddedContent = applyPaddingToContent(content);
    
    console.log(`\n🎭 Effect: ${effect}\n`);
    
    // Use TTE command-line tool with optimized parameters
    const tte = spawn('tte', [
      '--canvas-width', String(columns),
      '--canvas-height', String(rows),
      '--wrap-text',
      '--frame-rate', '20', // Smooth animation
      '--anchor-canvas', 'c', // Center canvas
      '--anchor-text', 'c',   // Center text
      effect
    ], {
      stdio: ['pipe', 'inherit', 'inherit']
    });
    
    // Set timeout for animation completion
    const timeout = setTimeout(() => {
      tte.kill('SIGTERM');
      resolve();
    }, 30000); // 30 second timeout
    
    // Write content to TTE
    tte.stdin.write(paddedContent);
    tte.stdin.end();
    
    tte.on('close', (code) => {
      clearTimeout(timeout);
      resolve();
    });
    
    tte.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`TTE error: ${err.message}`);
      // Fallback to simple display
      console.log(paddedContent);
      resolve();
    });
  });
}

// Helper function to calculate visual width
function calculateVisualWidth(text) {
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
  let width = 0;
  for (const char of cleanText) {
    if (char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
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
    continuous = true,
    maxQuotes = 50
  } = options;
  
  // Check TTE availability
  if (!checkTTE()) {
    console.error('\n❌ Echoes mode requires Terminal Text Effects (tte)');
    console.error('\n📦 Install with: pipx install terminaltexteffects\n');
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
  
  // Main display loop with optimized text processing
  while (continuous) {
    console.clear();
    
    // Shuffle quotes and select optimal number for display
    const shuffledQuotes = [...quotePool].sort(() => Math.random() - 0.5);
    const { rows } = getTerminalSize();
    
    // Calculate optimal quote count based on terminal height
    let maxQuotesToShow = Math.min(Math.floor(rows * 0.6), quotePool.length);
    if (maxQuotesToShow < 5) maxQuotesToShow = 5;
    if (maxQuotesToShow > 40) maxQuotesToShow = 40;
    
    const selectedQuotes = shuffledQuotes.slice(0, maxQuotesToShow);
    
    // Extract quotes text in simple format
    const quotesText = extractQuotesText(selectedQuotes);
    const content = quotesText.join('\n');
    
    // Select random effect from all available effects
    const effect = TTE_EFFECTS[Math.floor(Math.random() * TTE_EFFECTS.length)];
    
    // Display all quotes with single TTE effect
    await displayWithTTE(content, effect);
    
    // Wait before next display
    await sleep(interval);
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
  extractQuotesText,
  calculateOptimalPadding,
  applyPaddingToContent,
  centerContentSimple,
  TTE_EFFECTS,
  FAST_EFFECTS,
  DRAMATIC_EFFECTS,
  ELEGANT_EFFECTS,
  PLAYFUL_EFFECTS,
  TECHNICAL_EFFECTS,
  DISSOLVE_EFFECTS
};