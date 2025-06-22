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
// Fast effects for high-speed animations (recommended for quick transitions)
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

// Get terminal dimensions with improved detection
function getTerminalSize() {
  let columns = 80; // Conservative default
  let rows = 24;    // Conservative default
  
  // Try multiple detection methods
  if (process.stdout.isTTY && process.stdout.columns && process.stdout.rows) {
    columns = process.stdout.columns;
    rows = process.stdout.rows;
  } else {
    try {
      // Fallback to tput
      const tputCols = execSync('tput cols', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const tputRows = execSync('tput lines', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      
      const detectedCols = parseInt(tputCols.trim());
      const detectedRows = parseInt(tputRows.trim());
      
      if (detectedCols && detectedRows) {
        columns = detectedCols;
        rows = detectedRows;
      }
    } catch (error) {
      // Use defaults
    }
  }
  
  // Reasonable bounds
  columns = Math.max(40, Math.min(200, columns));
  rows = Math.max(15, Math.min(50, rows));
  
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

// Determine optimal layout mode based on terminal dimensions
function getLayoutMode(columns) {
  if (columns < 70) return 'minimal';      // Very narrow: quote + author only
  if (columns < 100) return 'compact';    // Narrow: optimized 4-column
  if (columns > 140) return 'spacious';   // Wide: fixed max width + centering
  return 'standard';                      // Standard: balanced 4-column
}

// Calculate minimum required widths for Japanese content
function getMinimumWidths() {
  return {
    year: 8,    // "1990年代"
    author: 6,  // "夏目漱石" 
    source: 8,  // "坊っちゃん"
    quote: 30   // Minimum readable quote
  };
}

// Extract quotes and prepare text for display with adaptive layout
function extractQuotesText(quotes) {
  const { columns } = getTerminalSize();
  const lines = [];
  const layoutMode = getLayoutMode(columns);
  const minWidths = getMinimumWidths();
  
  console.log(`🎨 Layout mode: ${layoutMode} (${columns} columns)`);
  
  // Handle different layout modes
  switch (layoutMode) {
    case 'minimal':
      return extractMinimalLayout(quotes, columns);
    case 'compact':
      return extractCompactLayout(quotes, columns, minWidths);
    case 'spacious':
      return extractSpaciousLayout(quotes, columns, minWidths);
    default:
      return extractStandardLayout(quotes, columns, minWidths);
  }
}

// Minimal layout: Quote + Author only
function extractMinimalLayout(quotes, columns) {
  const lines = [];
  const separatorSpace = 1;
  const availableWidth = columns - separatorSpace;
  
  // 70% for quote, 30% for author
  const quoteWidth = Math.floor(availableWidth * 0.7);
  const authorWidth = availableWidth - quoteWidth;
  
  for (const quote of quotes) {
    const [text, character] = quote;
    const quoteText = text ? `「${text}」` : '';
    const author = character || '';
    
    const formattedQuote = truncateToVisualWidth(quoteText, quoteWidth);
    const formattedAuthor = truncateToVisualWidth(author, authorWidth);
    
    const paddedQuote = padToVisualWidth(formattedQuote, quoteWidth);
    const line = `${paddedQuote} ${formattedAuthor}`;
    
    if (line.trim()) lines.push(line);
  }
  
  return { lines, width: quoteWidth + authorWidth + separatorSpace };
}

// Compact layout: Optimized 4-column with minimum widths
function extractCompactLayout(quotes, columns, minWidths) {
  const separatorSpace = 3;
  const availableWidth = columns - separatorSpace;
  
  // Ensure minimum widths are met
  const totalMinWidth = minWidths.year + minWidths.author + minWidths.source + minWidths.quote;
  
  if (availableWidth < totalMinWidth) {
    // Fall back to minimal layout if too narrow
    return extractMinimalLayout(quotes, columns);
  }
  
  // Distribute extra space proportionally
  const extraSpace = availableWidth - totalMinWidth;
  const quoteWidth = minWidths.quote + Math.floor(extraSpace * 0.6);
  const yearWidth = minWidths.year + Math.floor(extraSpace * 0.1);
  const authorWidth = minWidths.author + Math.floor(extraSpace * 0.15);
  const sourceWidth = minWidths.source + Math.floor(extraSpace * 0.15);
  
  const lines = formatQuotesWithWidths(quotes, yearWidth, quoteWidth, authorWidth, sourceWidth);
  return { lines, width: availableWidth };
}

// Standard layout: Balanced 4-column with golden ratio influence
function extractStandardLayout(quotes, columns, minWidths) {
  const separatorSpace = 3;
  const availableWidth = columns - separatorSpace;
  
  // Golden ratio influence but with minimum constraints
  const goldenRatio = 1.618;
  let quoteWidth = Math.floor(availableWidth / (1 + 1/goldenRatio));
  const metaWidth = availableWidth - quoteWidth;
  
  // Ensure quote width is reasonable
  quoteWidth = Math.max(minWidths.quote, Math.min(quoteWidth, 80));
  const actualMetaWidth = availableWidth - quoteWidth;
  
  const yearWidth = Math.max(minWidths.year, Math.floor(actualMetaWidth * 0.25));
  const authorWidth = Math.max(minWidths.author, Math.floor(actualMetaWidth * 0.35));
  const sourceWidth = actualMetaWidth - yearWidth - authorWidth;
  
  const lines = formatQuotesWithWidths(quotes, yearWidth, quoteWidth, authorWidth, sourceWidth);
  const totalWidth = yearWidth + quoteWidth + authorWidth + sourceWidth + separatorSpace;
  
  return { lines, width: totalWidth };
}

// Spacious layout: Fixed maximum width with centering
function extractSpaciousLayout(quotes, columns, minWidths) {
  // Use a maximum effective width and center the result
  const maxEffectiveWidth = 120;
  const { lines, width } = extractStandardLayout(quotes, maxEffectiveWidth + 3, minWidths);
  
  // Centering is handled by TTE (--anchor-canvas c), so no padding is needed here.
  return { lines, width };
}

// Helper function to format quotes with given widths
function formatQuotesWithWidths(quotes, yearWidth, quoteWidth, authorWidth, sourceWidth) {
  const lines = [];
  
  for (const quote of quotes) {
    const [text, character, work, period] = quote;
    
    // Format each field with Japanese-aware width handling
    const year = truncateToVisualWidth(period || '', yearWidth);
    const quoteText = text ? `「${text}」` : '';
    const formattedQuote = truncateToVisualWidth(quoteText, quoteWidth);
    const author = truncateToVisualWidth(character || '', authorWidth);
    const source = truncateToVisualWidth(work || '', sourceWidth);
    
    // Apply visual width padding
    const paddedYear = padToVisualWidth(year, yearWidth);
    const paddedQuote = padToVisualWidth(formattedQuote, quoteWidth);
    const paddedAuthor = padToVisualWidth(author, authorWidth);
    const finalSource = padToVisualWidth(source, sourceWidth); // Pad last column for consistent width
    
    // Combine with single space separators
    const line = `${paddedYear} ${paddedQuote} ${paddedAuthor} ${finalSource}`;
    
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

// Get high-speed parameters for specific effects
// Returns empty array if parameters are not supported to avoid errors
function getSpeedParameters(effect) {
  const speedParams = [];
  
  try {
  
  switch (effect) {
    case 'fireworks':
      speedParams.push('--launch-delay', '15'); // Faster launches (default: 60)
      speedParams.push('--final-gradient-steps', '6'); // Fewer steps (default: 12)
      break;
    case 'matrix':
      speedParams.push('--rain-time', '5'); // Shorter rain time (default: 15)
      speedParams.push('--resolve-delay', '2'); // Faster resolve (default: 5)
      speedParams.push('--rain-fall-delay-range', '1-8'); // Faster fall (default: 3-25)
      speedParams.push('--final-gradient-frames', '2'); // Fewer frames (default: 5)
      break;
    case 'waves':
      speedParams.push('--wave-length', '1'); // Faster waves (default: 2)
      speedParams.push('--wave-count', '5'); // Fewer waves (default: 7)
      speedParams.push('--final-gradient-steps', '6'); // Fewer steps (default: 12)
      break;
    case 'decrypt':
      speedParams.push('--typing-speed', '4'); // Faster typing (default: 2)
      break;
    case 'beams':
      speedParams.push('--beam-delay', '5'); // Faster beam progression (default: 10)
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps (default: 12)
      speedParams.push('--final-gradient-frames', '2'); // Faster gradient (default: 5)
      break;
    case 'blackhole':
      // blackhole doesn't have easily adjustable speed parameters
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps
      break;
    case 'unstable':
      speedParams.push('--explosion-speed', '1.5'); // Faster explosion (default: 0.75)
      speedParams.push('--reassembly-speed', '1.5'); // Faster reassembly (default: 0.75)
      break;
    case 'vhstape':
      // vhstape doesn't have easily adjustable speed parameters
      speedParams.push('--final-gradient-steps', '6'); // Fewer steps
      break;
    case 'synthgrid':
      // synthgrid doesn't have easily adjustable speed parameters  
      speedParams.push('--final-gradient-steps', '6'); // Fewer steps
      break;
    case 'crumble':
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps
      break;
    case 'rings':
      speedParams.push('--ring-gap', '0.1'); // Faster ring formation (default: 0.5)
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps
      break;
    case 'swarm':
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps
      break;
    case 'spotlights':
      speedParams.push('--spotlight-count', '3'); // Fewer spotlights for speed (default: 5)
      speedParams.push('--final-gradient-steps', '6'); // Fewer gradient steps
      break;
    // Most fast effects don't need additional parameters as they're already optimized
    case 'slide':
    case 'wipe':
    case 'pour':
    case 'sweep':
    case 'slice':
    case 'expand':
    case 'print':
      // These are already fast, no additional params needed
      break;
    default:
      // For unknown effects, just add common gradient optimization
      speedParams.push('--final-gradient-steps', '6');
      break;
  }
  
  } catch (error) {
    // If any error occurs, return empty array to use default parameters
    console.warn(`Warning: Could not optimize parameters for effect ${effect}:`, error.message);
    return [];
  }
  
  return speedParams;
}

// Display quotes with TTE effect using command-line version
function displayWithTTE(content, effect, width) {
  return new Promise((resolve, reject) => {
    const { columns, rows } = getTerminalSize();
    
    // Use content as-is without additional padding (TTE will handle centering)
    const paddedContent = content;
    
    console.log(`\n🎭 Effect: ${effect}\n`);
    
    // Use TTE command-line tool with minimal centering
    const baseParams = [
      '--frame-rate', '0', // No frame rate limit for maximum speed
      '--canvas-width', width ? String(width) : '-1',  // Match input text width
      '--canvas-height', '-1', // Match input text height
      '--anchor-canvas', 'c',  // Center canvas in terminal
      effect
    ];
    
    const allParams = baseParams;
    
    const tte = spawn('tte', allParams, {
      stdio: ['pipe', 'inherit', 'ignore'] // Ignore stderr to suppress usage messages
    });
    
    // Set shorter timeout for faster transitions
    const timeout = setTimeout(() => {
      tte.kill('SIGTERM');
      resolve();
    }, 10000); // 10 second timeout for faster cycles
    
    // Write content to TTE
    tte.stdin.write(paddedContent);
    tte.stdin.end();
    
    tte.on('close', (code) => {
      clearTimeout(timeout);
      resolve();
    });
    
    tte.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`TTE error with effect '${effect}': ${err.message}`);
      // Fallback to simple display without TTE
      console.clear();
      console.log(paddedContent);
      setTimeout(resolve, 2000); // Show for 2 seconds
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

// Japanese-aware padding function
function padToVisualWidth(text, targetWidth, align = 'left') {
  const currentWidth = calculateVisualWidth(text);
  const padding = Math.max(0, targetWidth - currentWidth);
  
  if (align === 'right') {
    return ' '.repeat(padding) + text;
  } else if (align === 'center') {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  } else {
    return text + ' '.repeat(padding);
  }
}

// Truncate text to visual width
function truncateToVisualWidth(text, maxWidth) {
  let width = 0;
  let result = '';
  
  for (const char of text) {
    const charWidth = char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 2 : 1;
    if (width + charWidth > maxWidth) {
      break;
    }
    result += char;
    width += charWidth;
  }
  
  return result;
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main echoes mode function
async function runEchoesMode(quotes, options = {}, ui = {}) {
  const { hideCursor, showCursor } = ui;
  const { continuous = false, interval = 5000, randomOrder = false, preferFastEffects = false } = options;
  let historicalQuotes = quotes;
  
  if (hideCursor) hideCursor();
  const cleanup = () => {
    if (showCursor) showCursor();
    console.clear();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  process.stdout.on('resize', () => {
    console.log(`🔄 Terminal resized to: ${process.stdout.columns}x${process.stdout.rows}`);
  });
  
  while (continuous) {
    console.clear();
    
    const { rows } = getTerminalSize();
    const maxQuotes = Math.max(5, Math.min(quotes.length, rows - 2));

    const shuffledQuotes = [...quotes].sort(() => Math.random() - 0.5);
    const selectedQuotes = shuffledQuotes.slice(0, maxQuotes);
    
    const { lines: quotesText, width: contentWidth } = extractQuotesText(selectedQuotes);
    const content = quotesText.join('\n');
    
    const effect = TTE_EFFECTS[Math.floor(Math.random() * TTE_EFFECTS.length)];
    
    await displayWithTTE(content, effect, contentWidth);
    
    await sleep(interval);
  }
  
  cleanup();
}

// Echoes mode with existing quotes in memory
async function echoesModeWithQuotes(quotes, options = {}) {
  console.log('\n🔮  Entering Echoes Mode...\n');
  await sleep(1000);
  await runEchoesMode(quotes, options);
}

// Standalone echoes mode (loads historical quotes only)
async function standaloneEchoesMode(options = {}, ui = {}) {
  console.log('\n🔮  Echoes Mode: Loading historical quotes...\n');
  const quotes = await loadHistoricalQuotes(200);
  
  if (quotes.length === 0) {
    console.error('No historical quotes found. Generate some quotes first!');
    return;
  }
  
  console.log(`Found ${quotes.length} quotes. Starting echoes...\n`);
  await sleep(1000);
  
  await runEchoesMode(quotes, { ...options, includeHistory: false }, ui);
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