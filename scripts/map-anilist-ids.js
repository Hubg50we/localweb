const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'anime-data.js');
const animeDatabase = require(dataFile);

const queryByMal = `
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
    }
  }
}
`;

const queryByTitle = `
query ($search: String) {
  Media(search: $search, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
    }
  }
}
`;

async function fetchAniListInfo(malId, title) {
  if (malId) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: queryByMal, variables: { idMal: parseInt(malId, 10) } })
      });
      const data = await res.json();
      if (data && data.data && data.data.Media) {
        return data.data.Media;
      }
    } catch (_) {}
  }

  // Fallback by search title
  try {
    const cleanTitle = title.replace(/\s*(Season|Arc|Part|\d+).*$/i, '').trim() || title;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: queryByTitle, variables: { search: cleanTitle } })
    });
    const data = await res.json();
    if (data && data.data && data.data.Media) {
      return data.data.Media;
    }
  } catch (_) {}

  return null;
}

(async () => {
  console.log(`Starting AniList ID mapping for ${animeDatabase.length} anime...`);

  let mappedCount = 0;
  for (let i = 0; i < animeDatabase.length; i++) {
    const anime = animeDatabase[i];
    const malId = anime.mal_id || anime.malId;
    const title = anime.title;

    let media = await fetchAniListInfo(malId, title);
    if (!media) {
      // Try with full title
      media = await fetchAniListInfo(null, title);
    }

    if (media) {
      anime.anilist_id = media.id;
      if (media.idMal) anime.mal_id = media.idMal;
      anime.malId = String(anime.mal_id);
      mappedCount++;
      console.log(`[${i + 1}/${animeDatabase.length}] Mapped: "${anime.title}" => AniList ID: ${anime.anilist_id}, MAL ID: ${anime.mal_id}`);
    } else {
      console.warn(`[${i + 1}/${animeDatabase.length}] Could not map: "${anime.title}" (MAL: ${malId})`);
      anime.anilist_id = anime.anilist_id || (malId ? parseInt(malId, 10) : 151807);
    }

    anime.slug = anime.id;

    // Clean and rebuild episode stream links (PURGING ALL DUMMY HLS SAMPLE URLS)
    if (anime.episodes && anime.episodes.length > 0) {
      anime.episodes.forEach(ep => {
        const epNum = ep.number || 1;
        ep.vidsrcSubUrl = `https://vidsrc.icu/embed/anime/${anime.anilist_id}/${epNum}/0`;
        ep.vidsrcDubUrl = `https://vidsrc.icu/embed/anime/${anime.anilist_id}/${epNum}/1`;
        ep.vidlinkSubUrl = `https://vidlink.pro/anime/${anime.mal_id}/${epNum}/sub`;
        ep.vidlinkDubUrl = `https://vidlink.pro/anime/${anime.mal_id}/${epNum}/dub`;
        ep.megaCloudUrl = `https://multiembed.mov/?video_id=${anime.mal_id}&mal=1&s=1&e=${epNum}`;
        ep.twoEmbedUrl = `https://2anime.xyz/embed/${anime.slug}-episode-${epNum}`;
        
        // Remove old dummy HLS test stream completely
        delete ep.hlsStreamUrl;
        delete ep.embedUrl;
        delete ep.vidsrcClassicUrl;
      });
    }

    // Rate-limiting pause between AniList API calls
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nSuccessfully mapped ${mappedCount}/${animeDatabase.length} anime with both AniList ID and MAL ID!`);

  const fileContent = `const animeDatabase = ${JSON.stringify(animeDatabase, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

  fs.writeFileSync(dataFile, fileContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'anime-data.js'), fileContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'data', 'anime-data.js'), fileContent, 'utf-8');

  console.log('Saved updated anime-data.js across data/, public/data/, and docs/data/.');
})().catch(err => {
  console.error('Mapping error:', err);
  process.exit(1);
});
