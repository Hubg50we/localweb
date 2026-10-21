const https = require('https');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raw = fs.readFileSync('data/anime-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(raw + '; list = animeDatabase;', sandbox);
const animeList = sandbox.list;

function queryAnilist(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { english romaji }
        coverImage { extraLarge large }
        bannerImage
      }
    }
  `;
  const postData = JSON.stringify({ query, variables: { search: title } });

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
      timeout: 8000
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
  console.log(`Starting image sync for ${animeList.length} anime...`);
  let updatedCount = 0;

  for (let i = 0; i < animeList.length; i++) {
    const anime = animeList[i];
    // Clean search title (remove seasons or brackets for better match)
    const searchTitle = anime.title.replace(/Season \d+/i, '').replace(/Arc/i, '').trim();
    const media = await queryAnilist(searchTitle) || await queryAnilist(anime.title);

    if (media) {
      const coverUrl = (media.coverImage && (media.coverImage.extraLarge || media.coverImage.large));
      const bannerUrl = media.bannerImage || coverUrl;

      if (coverUrl) {
        anime.poster = coverUrl;
        anime.cover = coverUrl;
      }
      if (bannerUrl) {
        anime.banner = bannerUrl;
      }
      updatedCount++;
      console.log(`[${i + 1}/${animeList.length}] Updated: ${anime.title}`);
    } else {
      console.log(`[${i + 1}/${animeList.length}] Keep existing: ${anime.title}`);
    }

    // Small delay to respect rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nSuccessfully updated ${updatedCount} anime images with verified AniList CDN assets.`);

  const generatedCode = `const animeDatabase = ${JSON.stringify(animeList, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

  fs.writeFileSync('data/anime-data.js', generatedCode, 'utf8');
  fs.writeFileSync('public/data/anime-data.js', generatedCode, 'utf8');
  fs.writeFileSync('docs/data/anime-data.js', generatedCode, 'utf8');
  console.log('Synchronized to data/, public/data/, and docs/data/');
})();
