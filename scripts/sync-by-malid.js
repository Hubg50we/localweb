const https = require('https');
const fs = require('fs');
const vm = require('vm');

const raw = fs.readFileSync('data/anime-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(raw + '; list = animeDatabase;', sandbox);
const animeList = sandbox.list;

function queryAnilistByMal(malId) {
  const query = `
    query ($malId: Int) {
      Media(idMal: $malId, type: ANIME) {
        id
        coverImage { extraLarge large }
        bannerImage
      }
    }
  `;
  const postData = JSON.stringify({ query, variables: { malId: parseInt(malId, 10) } });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'graphql.anilist.co',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'HiAnime/5.0'
      },
      timeout: 10000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data && json.data.Media);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log(`Syncing all ${animeList.length} anime images via exact MAL IDs...`);
  let count = 0;

  for (let i = 0; i < animeList.length; i++) {
    const anime = animeList[i];
    const mal = anime.malId || anime.mal_id;
    const media = await queryAnilistByMal(mal);

    if (media) {
      const cover = media.coverImage && (media.coverImage.extraLarge || media.coverImage.large);
      const banner = media.bannerImage || cover;
      if (cover) {
        anime.poster = cover;
        anime.cover = cover;
      }
      if (banner) {
        anime.banner = banner;
      }
      count++;
      console.log(`[${i + 1}/${animeList.length}] Matched MAL ${mal}: ${anime.title}`);
    } else {
      console.log(`[${i + 1}/${animeList.length}] Missed MAL ${mal}: ${anime.title}`);
    }

    // Rate limit delay: 600ms per request (approx 90 req/min)
    await new Promise(r => setTimeout(r, 650));
  }

  console.log(`\nMatched ${count}/${animeList.length} anime.`);

  const generatedCode = `const animeDatabase = ${JSON.stringify(animeList, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

  fs.writeFileSync('data/anime-data.js', generatedCode, 'utf8');
  fs.writeFileSync('public/data/anime-data.js', generatedCode, 'utf8');
  fs.writeFileSync('docs/data/anime-data.js', generatedCode, 'utf8');
  console.log('Saved to data/anime-data.js, public/data/anime-data.js, docs/data/anime-data.js');
})();
