const fs = require('fs');
const path = require('path');

const ratingFile = path.join(__dirname, '..', 'ratings.json');

function loadRatings() {
  try {
    const data = fs.readFileSync(ratingFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveRatings(ratings) {
  fs.writeFileSync(ratingFile, JSON.stringify(ratings, null, 2));
}

function addRating(quoteLines, rating) {
  const ratings = loadRatings();
  const text = Array.isArray(quoteLines) ? quoteLines.join('\n') : String(quoteLines);
  ratings.push({ quote: text, rating });
  saveRatings(ratings);
}

function filterByRating(quotes, min) {
  if (!min) return quotes;
  const ratings = loadRatings();
  const map = new Map(ratings.map(r => [r.quote, r.rating]));
  return quotes.filter(q => (map.get(q.join('\n')) || 0) >= min);
}

module.exports = { addRating, filterByRating, loadRatings };
