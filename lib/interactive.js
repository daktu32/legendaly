const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { addRating } = require('./ratings');

const favoritesFile = path.join(__dirname, '..', 'favorites.json');

function loadFavorites() {
  try {
    return JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  fs.writeFileSync(favoritesFile, JSON.stringify(favs, null, 2));
}

function addFavorite(quoteLines) {
  const favs = loadFavorites();
  const text = Array.isArray(quoteLines) ? quoteLines.join('\n') : String(quoteLines);
  favs.push(text);
  saveFavorites(favs);
}

async function promptForActions(quoteLines) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('[Enter] next, [f] favorite, 1-5 rate: ', (ans) => {
      const trimmed = ans.trim().toLowerCase();
      if (trimmed === 'f') {
        addFavorite(quoteLines);
      }
      const rating = parseInt(trimmed, 10);
      if (rating >= 1 && rating <= 5) {
        addRating(quoteLines, rating);
      }
      rl.close();
      resolve();
    });
  });
}

module.exports = { addFavorite, promptForActions };
