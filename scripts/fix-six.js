const https = require('https');
const fs = require('fs');

const malIds = [46569, 51179, 54857, 51180, 34572, 1575];

function query(malId) {
  const q = JSON.stringify({
    query: `query ($id: Int) { Media(idMal: $id, type: ANIME) { id coverImage { extraLarge large } bannerImage } }`,
    variables: { id: malId }
  });
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'graphql.anilist.co', path: '/', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'HiAnime/5.0' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).data.Media); } catch(e) { resolve(null); }
      });
    });
    req.write(q); req.end();
  });
}

(async () => {
  const list = require('../data/anime-data.js');
  for (const mid of malIds) {
    const media = await query(mid);
    if (media) {
      const cover = media.coverImage && (media.coverImage.extraLarge || media.coverImage.large);
      const banner = media.bannerImage || cover;
      const target = list.find(a => String(a.malId || a.mal_id) === String(mid));
      if (target) {
        if (cover) { target.poster = cover; target.cover = cover; }
        if (banner) { target.banner = banner; }
        console.log('Fixed:', target.title, 'Cover:', cover ? 'YES' : 'NO', 'Banner:', banner ? 'YES' : 'NO');
      }
    }
    await new Promise(r => setTimeout(r, 700));
  }
  const code = 'const animeDatabase = ' + JSON.stringify(list, null, 2) + ';\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n';
  fs.writeFileSync('data/anime-data.js', code, 'utf8');
  fs.writeFileSync('public/data/anime-data.js', code, 'utf8');
  fs.writeFileSync('docs/data/anime-data.js', code, 'utf8');
  console.log('Done!');
})();
