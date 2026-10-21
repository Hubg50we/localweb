const fs = require('fs');
const vm = require('vm');

const raw = fs.readFileSync('data/anime-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(raw + '; list = animeDatabase;', sandbox);
const animeList = sandbox.list;

console.log(`Processing ${animeList.length} anime entries to purge YouTube...`);

animeList.forEach(anime => {
  delete anime.youtubeId;
  const mal = String(anime.malId || anime.mal_id || '52299');
  anime.malId = mal;
  anime.mal_id = parseInt(mal, 10);

  const totalEps = anime.subEpisodes || (anime.episodes ? anime.episodes.length : 12);
  const episodes = [];

  for (let ep = 1; ep <= totalEps; ep++) {
    episodes.push({
      number: ep,
      title: `Episode ${ep}`,
      duration: '24:00',
      thumbnail: anime.banner || anime.poster,
      vidlinkSubUrl: `https://vidlink.pro/anime/${mal}/${ep}/sub?fallback=true`,
      vidlinkDubUrl: `https://vidlink.pro/anime/${mal}/${ep}/dub?fallback=true`,
      megaCloudUrl: `https://multiembed.mov/?video_id=${mal}&an=1&ep=${ep}`,
      twoEmbedUrl: `https://www.2embed.cc/embed/anime/${mal}/${ep}`,
      hlsStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      // backward-compat fields pointing strictly to full anime stream
      embedUrl: `https://vidlink.pro/anime/${mal}/${ep}/sub?fallback=true`,
      vidsrcClassicUrl: `https://vidlink.pro/anime/${mal}/${ep}/dub?fallback=true`
    });
  }

  anime.episodes = episodes;
});

const generatedCode = `const animeDatabase = ${JSON.stringify(animeList, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

fs.writeFileSync('data/anime-data.js', generatedCode, 'utf8');
fs.writeFileSync('public/data/anime-data.js', generatedCode, 'utf8');
fs.writeFileSync('docs/data/anime-data.js', generatedCode, 'utf8');

console.log('YouTube completely purged from all anime data files!');
