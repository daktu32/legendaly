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

// Check if tte is available
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

// Center content with golden ratio layout and appropriate margins
function centerContent(lines) {
  const { columns } = getTerminalSize();
  
  if (lines.length === 0) return lines;
  
  // Calculate the actual maximum content width
  let maxContentWidth = 0;
  for (const line of lines) {
    const width = calculateVisualWidth(line);
    maxContentWidth = Math.max(maxContentWidth, width);
  }
  
  // Force golden ratio layout regardless of content width
  const goldenRatio = 1.618;
  const idealContentWidth = Math.floor(columns / goldenRatio);
  
  // Always apply golden ratio margins
  const totalMargin = columns - idealContentWidth;
  const leftMargin = Math.floor(totalMargin / 2);
  const rightMargin = totalMargin - leftMargin;
  
  console.log(`🔍 Forced golden ratio: terminal=${columns}, ideal=${idealContentWidth}, content=${maxContentWidth}, margins=${leftMargin}/${rightMargin}`);
  
  return lines.map(line => {
    const lineWidth = calculateVisualWidth(line);
    
    // Truncate line to fit within ideal content width if necessary
    let adjustedLine = line;
    let adjustedLineWidth = lineWidth;
    
    if (lineWidth > idealContentWidth) {
      let trimmedLine = '';
      let currentWidth = 0;
      for (const char of line) {
        const charWidth = char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 2 : 1;
        if (currentWidth + charWidth <= idealContentWidth) {
          trimmedLine += char;
          currentWidth += charWidth;
        } else {
          break;
        }
      }
      adjustedLine = trimmedLine;
      adjustedLineWidth = calculateVisualWidth(adjustedLine);
    }
    
    // Center the line within the ideal content area
    const contentPadding = idealContentWidth - adjustedLineWidth;
    const contentLeftPad = Math.floor(contentPadding / 2);
    const contentRightPad = contentPadding - contentLeftPad;
    
    // Apply golden ratio margins
    return ' '.repeat(leftMargin) + 
           ' '.repeat(contentLeftPad) + 
           adjustedLine + 
           ' '.repeat(contentRightPad) + 
           ' '.repeat(rightMargin);
  });
}

// Justify a single line by distributing spaces evenly
function justifyLine(line, targetWidth) {
  const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
  
  // Calculate current visual width
  let currentWidth = 0;
  for (const char of cleanLine) {
    if (char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)) {
      currentWidth += 2;
    } else {
      currentWidth += 1;
    }
  }
  
  // If already at target width, return as-is
  if (currentWidth >= targetWidth) {
    return line;
  }
  
  // Split into columns by finding column boundaries (2+ spaces)
  const parts = line.split(/(\s{2,})/);
  const contentParts = parts.filter((part, i) => i % 2 === 0); // Odd indices are separators
  const separators = parts.filter((part, i) => i % 2 === 1);
  
  if (contentParts.length <= 1) {
    return line; // Can't justify single column
  }
  
  // Calculate extra spaces needed
  const extraSpaces = targetWidth - currentWidth;
  const gaps = separators.length;
  
  if (gaps === 0) {
    return line;
  }
  
  // Distribute extra spaces evenly across gaps
  const baseExtraSpaces = Math.floor(extraSpaces / gaps);
  const remainderSpaces = extraSpaces % gaps;
  
  // Rebuild line with justified spacing
  let result = contentParts[0];
  for (let i = 0; i < separators.length; i++) {
    const extraForThisGap = baseExtraSpaces + (i < remainderSpaces ? 1 : 0);
    result += separators[i] + ' '.repeat(extraForThisGap);
    if (i + 1 < contentParts.length) {
      result += contentParts[i + 1];
    }
  }
  
  return result;
}

// Format quote for display (column format)
function formatQuoteForEchoes(quote) {
  if (!quote || !Array.isArray(quote)) return [];
  
  const [text, character, work, period] = quote;
  
  // Format with separators for column alignment
  const quoteText = text ? `「${text}」` : '';
  const author = character || '';
  const source = work || '';
  const year = period || '';
  
  // Use | as separator for column formatting
  return [`${quoteText}|${author}|${source}|${year}`];
}

// Format all quotes with column alignment that fits terminal width
function formatQuotesWithColumns(quotes) {
  const { columns } = getTerminalSize();
  const formattedLines = [];
  
  for (const quote of quotes) {
    const [text, character, work, period] = quote;
    const year = period || '';
    const quoteText = text ? `「${text}」` : '';
    const author = character || '';
    const source = work || '';
    
    formattedLines.push([year, quoteText, author, source]);
  }
  
  // Calculate column widths (considering Japanese characters)
  const maxWidths = [0, 0, 0, 0];
  for (const line of formattedLines) {
    for (let i = 0; i < line.length; i++) {
      const cleanText = line[i].replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI codes
      // Calculate display width considering Japanese characters
      let displayWidth = 0;
      for (const char of cleanText) {
        // Japanese characters are typically wider
        if (char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)) {
          displayWidth += 2;
        } else {
          displayWidth += 1;
        }
      }
      maxWidths[i] = Math.max(maxWidths[i], displayWidth);
    }
  }
  
  // Adjust column widths to fit terminal width EXACTLY
  const availableWidth = columns; // Use full terminal width
  const spacingWidth = (maxWidths.length - 1) * 2; // 2 spaces between columns
  
  // Calculate column widths as percentages of terminal width
  const yearPercent = 0.08;    // 8% for year (e.g., "2999年")
  const quotePercent = 0.50;   // 50% for quote text
  const authorPercent = 0.22;  // 22% for author
  const sourcePercent = 0.20;  // 20% for source
  
  // Calculate actual widths based on terminal width
  const yearWidth = Math.floor(availableWidth * yearPercent);
  const quoteWidth = Math.floor(availableWidth * quotePercent);
  const authorWidth = Math.floor(availableWidth * authorPercent);
  const sourceWidth = availableWidth - yearWidth - quoteWidth - authorWidth - spacingWidth; // Use remaining space
  
  maxWidths[0] = yearWidth;
  maxWidths[1] = quoteWidth;
  maxWidths[2] = authorWidth;
  maxWidths[3] = sourceWidth;
  
  
  
  
  // Format with proper spacing, ensuring EXACT terminal width
  const alignedLines = [];
  for (const line of formattedLines) {
    const paddedLine = line.map((col, i) => {
      let text = col;
      const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Truncate if too long (especially quote text)
      if (i === 1 && cleanText.length > 0) { // Quote text column
        let currentWidth = 0;
        let truncatedText = '';
        const maxAllowedWidth = maxWidths[i];
        
        // Calculate exact width first
        let totalWidth = 0;
        for (const char of cleanText) {
          const charWidth = char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 2 : 1;
          totalWidth += charWidth;
        }
        
        if (totalWidth <= maxAllowedWidth) {
          text = cleanText; // No truncation needed
        } else {
          // Need to truncate - leave exactly 2 chars for ellipsis
          for (const char of cleanText) {
            const charWidth = char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 2 : 1;
            if (currentWidth + charWidth + 2 <= maxAllowedWidth) { // +2 for ellipsis
              truncatedText += char;
              currentWidth += charWidth;
            } else {
              break;
            }
          }
          text = truncatedText + '…';
        }
      }
      
      // Calculate current display width
      let currentWidth = 0;
      for (const char of text) {
        if (char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)) {
          currentWidth += 2;
        } else {
          currentWidth += 1;
        }
      }
      
      // Padding calculation for exact terminal width usage
      let padding = 0;
      if (i < line.length - 1) {
        // For non-last columns: pad to column width + 2 spaces
        padding = maxWidths[i] - currentWidth + 2;
      } else {
        // Last column: fill exactly to terminal edge (no overflow)
        padding = maxWidths[i] - currentWidth;
      }
      
      return text + ' '.repeat(Math.max(0, padding));
    });
    
    // Join columns and ensure exact terminal width
    let fullLine = paddedLine.join('');
    
    // Check and fix line length to match terminal width exactly
    const lineWidth = calculateVisualWidth(fullLine);
    if (lineWidth > availableWidth) {
      // Too long: trim from the end
      let trimmedLine = '';
      let currentLineWidth = 0;
      for (const char of fullLine) {
        const charWidth = char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 2 : 1;
        if (currentLineWidth + charWidth <= availableWidth) {
          trimmedLine += char;
          currentLineWidth += charWidth;
        } else {
          break;
        }
      }
      fullLine = trimmedLine;
    } else if (lineWidth < availableWidth) {
      // Too short: pad to exact width
      fullLine += ' '.repeat(availableWidth - lineWidth);
    }
    
    alignedLines.push(fullLine);
  }
  
  return alignedLines;
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

// Display quote with TTE effect
function displayWithTTE(content, effect) {
  return new Promise((resolve, reject) => {
    const { columns } = getTerminalSize();
    console.log(`\n🎭 Effect: ${effect}\n`);
    
    const tte = spawn('tte', [
      '--canvas-width', String(columns),
      '--canvas-height', '0', 
      '--wrap-text',
      '--frame-rate', '15', // Lower frame rate for performance
      effect
    ]);
    
    // Capture output to ensure process completion
    let output = '';
    tte.stdout.on('data', (data) => {
      output += data;
      process.stdout.write(data);
    });
    
    tte.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    // Set longer timeout for complete animations
    const timeout = setTimeout(() => {
      tte.kill();
      resolve(); // Don't reject on timeout, just continue
    }, 30000); // 30 second timeout for full animations
    
    tte.stdin.write(content);
    tte.stdin.end();
    
    tte.on('close', code => {
      clearTimeout(timeout);
      resolve();
    });
    
    tte.on('error', (err) => {
      clearTimeout(timeout);
      resolve(); // Don't reject on error, fallback to next quote
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
  while (continuous) {
    console.clear();
    
    // Shuffle quotes and take fewer quotes for testing
    const shuffledQuotes = [...quotePool].sort(() => Math.random() - 0.5);
    // Adjust number of quotes based on terminal height
    const { rows } = getTerminalSize();
    let maxQuotesToShow = 20; // Default
    
    if (rows >= 80) {
      maxQuotesToShow = Math.min(50, quotePool.length); // Up to 50 quotes for ultra-tall displays
    } else if (rows >= 60) {
      maxQuotesToShow = Math.min(45, quotePool.length); // Up to 45 quotes for very tall terminals
    } else if (rows >= 50) {
      maxQuotesToShow = Math.min(35, quotePool.length); // Up to 35 quotes for tall terminals
    } else if (rows >= 40) {
      maxQuotesToShow = Math.min(30, quotePool.length); // Up to 30 quotes for medium-tall terminals
    } else if (rows >= 30) {
      maxQuotesToShow = Math.min(25, quotePool.length); // Up to 25 quotes for medium terminals
    }
    
    const selectedQuotes = shuffledQuotes.slice(0, maxQuotesToShow);
    
    // Format all quotes with column alignment
    const allLines = formatQuotesWithColumns(selectedQuotes);
    
    // Apply centering with golden ratio margins
    const centeredLines = centerContent(allLines);
    
    const content = centeredLines.join('\n');
    
    // Select random effect from all available effects
    const effect = TTE_EFFECTS[Math.floor(Math.random() * TTE_EFFECTS.length)];
    
    // Display all quotes with single effect
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
  TTE_EFFECTS,
  FAST_EFFECTS,
  DRAMATIC_EFFECTS,
  ELEGANT_EFFECTS,
  PLAYFUL_EFFECTS,
  TECHNICAL_EFFECTS,
  DISSOLVE_EFFECTS
};