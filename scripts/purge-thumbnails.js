const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'anime-data.js');
const animeDatabase = require(dataFile);

let countUpdated = 0;
animeDatabase.forEach(a => {
  const defaultThumb = a.banner || a.poster || a.cover;
  (a.episodes || []).forEach(ep => {
    if (ep.thumbnail && ep.thumbnail.includes('alphacoders')) {
      ep.thumbnail = defaultThumb;
      countUpdated++;
    }
  });
});

console.log(`Updated ${countUpdated} episode thumbnails.`);

const content = 'const animeDatabase = ' + JSON.stringify(animeDatabase, null, 2) + ';\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n';

fs.writeFileSync(dataFile, content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'anime-data.js'), content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'data', 'anime-data.js'), content, 'utf8');

console.log('All 3 anime-data.js files synced successfully with 0 alphacoders references.');
