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

async function fetchAniListWithRetry(malId, title) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: queryByMal, variables: { idMal: parseInt(malId, 10) } })
      });
      if (res.status === 429) {
        console.log(`[Rate Limited 429] Waiting 5 seconds before retry for "${title}"...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      const data = await res.json();
      if (data && data.data && data.data.Media) {
        return data.data.Media;
      }
    } catch (e) {
      console.warn('Fetch error:', e.message);
    }
    break;
  }

  // Fallback by title search
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cleanTitle = title.replace(/\s*(Season|Arc|Part|\d+).*$/i, '').trim() || title;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: queryByTitle, variables: { search: cleanTitle } })
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      const data = await res.json();
      if (data && data.data && data.data.Media) {
        return data.data.Media;
      }
    } catch (_) {}
    break;
  }

  return null;
}

(async () => {
  console.log('Mapping remaining unmapped anime...');
  let updatedCount = 0;

  for (let i = 0; i < animeDatabase.length; i++) {
    const anime = animeDatabase[i];
    // Check if AniList ID is not set or matches MAL ID
    if (!anime.anilist_id || anime.anilist_id === anime.mal_id) {
      const malId = anime.mal_id || anime.malId;
      console.log(`Resolving AniList ID for [${i + 1}/${animeDatabase.length}]: "${anime.title}" (MAL: ${malId})...`);
      const media = await fetchAniListWithRetry(malId, anime.title);
      if (media) {
        anime.anilist_id = media.id;
        if (media.idMal) anime.mal_id = media.idMal;
        anime.malId = String(anime.mal_id);
        console.log(`  -> Mapped "${anime.title}" to AniList ID: ${anime.anilist_id}, MAL ID: ${anime.mal_id}`);
        updatedCount++;
      } else {
        console.warn(`  -> Could not resolve AniList ID for "${anime.title}".`);
      }
      await new Promise(r => setTimeout(r, 800));
    }

    anime.slug = anime.id;

    // Ensure all episode stream URLs use real AniList & MAL IDs and have 0 dummy HLS links
    if (anime.episodes && anime.episodes.length > 0) {
      anime.episodes.forEach(ep => {
        const epNum = ep.number || 1;
        ep.vidsrcSubUrl = `https://vidsrc.icu/embed/anime/${anime.anilist_id}/${epNum}/0`;
        ep.vidsrcDubUrl = `https://vidsrc.icu/embed/anime/${anime.anilist_id}/${epNum}/1`;
        ep.vidlinkSubUrl = `https://vidlink.pro/anime/${anime.mal_id}/${epNum}/sub`;
        ep.vidlinkDubUrl = `https://vidlink.pro/anime/${anime.mal_id}/${epNum}/dub`;
        ep.megaCloudUrl = `https://multiembed.mov/?video_id=${anime.mal_id}&mal=1&s=1&e=${epNum}`;
        ep.twoEmbedUrl = `https://2anime.xyz/embed/${anime.slug}-episode-${epNum}`;
        delete ep.hlsStreamUrl;
        delete ep.embedUrl;
        delete ep.vidsrcClassicUrl;
      });
    }
  }

  console.log(`\nUpdated ${updatedCount} remaining shows! Total anime: ${animeDatabase.length}`);

  let verifiedAniListCount = 0;
  animeDatabase.forEach(a => {
    if (a.anilist_id && a.mal_id) verifiedAniListCount++;
  });
  console.log(`Verified both anilist_id and mal_id present on: ${verifiedAniListCount}/${animeDatabase.length} shows!`);

  const fileContent = `const animeDatabase = ${JSON.stringify(animeDatabase, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

  fs.writeFileSync(dataFile, fileContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'anime-data.js'), fileContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'data', 'anime-data.js'), fileContent, 'utf-8');

  console.log('Saved to data/, public/data/, and docs/data/ successfully.');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
