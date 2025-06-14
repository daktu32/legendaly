const fs = require('fs');
const path = require('path');

function exportAsText(quoteLines, filePath) {
  if (!quoteLines) return;
  const out = Array.isArray(quoteLines) ? quoteLines.join('\n') : String(quoteLines);
  fs.writeFileSync(filePath, out, 'utf8');
}

function exportAsImage(quoteLines, filePath) {
  // Placeholder: simply write text. Real image generation would require extra deps.
  exportAsText(quoteLines, filePath);
}

module.exports = { exportAsText, exportAsImage };
