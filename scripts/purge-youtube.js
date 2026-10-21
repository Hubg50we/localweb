const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'data', 'anime-data.js'),
  path.join(__dirname, '..', 'public', 'data', 'anime-data.js'),
  path.join(__dirname, '..', 'docs', 'data', 'anime-data.js')
];

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract variable name and JSON
  const match = content.match(/^(?:const|let|var)\s+animeData\s*=\s*(\[\s*\{[\s\S]*\}\s*\]);?\s*$/m) ||
                content.match(/(\[\s*\{[\s\S]*\}\s*\])/);
  if (!match) {
    console.error('Failed to parse animeData from', filePath);
    continue;
  }

  const list = JSON.parse(match[1]);
  for (const anime of list) {
    // Purge any youtube references or trailers
    if (anime.trailer) {
      anime.trailer = {
        title: `${anime.title} - Official Preview`,
        site: 'native',
        thumbnail: anime.bannerImage || anime.posterImage || ''
      };
    }
    delete anime.youtubeId;
    // Check episodes for any youtube references
    if (Array.isArray(anime.episodes)) {
      for (const ep of anime.episodes) {
        delete ep.youtubeId;
        if (ep.ultraHdUrl && ep.ultraHdUrl.includes('youtube')) delete ep.ultraHdUrl;
        if (ep.embedUrl && ep.embedUrl.includes('youtube')) delete ep.embedUrl;
      }
    }
  }

  const newContent = `const animeData = ${JSON.stringify(list, null, 2)};\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = animeData;\n}\n`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Successfully purged YouTube from ${filePath} (${list.length} anime entries updated)`);
}
