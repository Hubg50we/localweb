const fs = require('fs');
const path = require('path');
const vm = require('vm');

const youtubeMap = {
  'solo-leveling': 'BwIdVcxzU10',
  'jujutsu-kaisen-s2': 'O6qVIE_W55Y',
  'frieren': 'qgQunxD0qMo',
  'demon-slayer-s4': 'i_kZ3pZ5f4Q',
  'chainsaw-man': 'q15CRdE5Bv0',
  'one-piece': 'T5_0B40Gf8Q',
  'attack-on-titan-final': 'M_OauHnAFc8',
  'bleach-tybw': '78WIYzX_B8E',
  'spy-x-family': 'eZ_3YV3G_p4',
  'kaiju-no-8': 'c3Rh_bT9Wq4',
  'vinland-saga': 'b_lM_3wXGjU',
  'oshi-no-ko': '4K5kS2aK6O0',
  'dandadan': 'y7z7Jv7y6Fk',
  'delicious-in-dungeon': 'nJ4E6H-y8bY',
  'wind-breaker': 'gD-9eXjJ7lI',
  'death-note': 'NlJZ-YgAt-c',
  'fullmetal-alchemist-brotherhood': '--IcmZkvL0Q',
  'steins-gate': '27OZcZ4YS44',
  'hunter-x-hunter-2011': 'd6kBeJjTGnY',
  'naruto-shippuden': '1dmVICnca88',
  'my-hero-academia-s7': 'kK_wN-C7U4Q',
  'mob-psycho-100-iii': 'bce_sFzYg5g',
  'haikyuu': 'JOGp2c7-cKc',
  'cyberpunk-edgerunners': 'JtqIas3bYhg',
  'bocchi-the-rock': '1r_pS7lH5sI',
  'blue-lock': 'scTKq0aFvO8',
  'hells-paradise': '6_398e_p_5w',
  'mushoku-tensei-s2': 'o4j3G5o1_4Y',
  'rezero-s3': 'o4B8O_O4C5Q',
  'classroom-of-the-elite-s3': 'K5L_b7_Q0tM',
  'black-clover': 'vUZZJj_Cgq8',
  'code-geass': 'O_3n_jT5cPQ',
  'neon-genesis-evangelion': '13nSISwxr3U',
  'cowboy-bebop': 'qig4KMGmm28',
  'sword-art-online': '6ohYsgu5a50',
  'overlord-iv': '_6t3Vz6r-0c',
  'konosuba-s3': 'fK8qT6W1i8s',
  'violet-evergarden': 'g5xWqj4QwUQ',
  'jojo-golden-wind': 'k_qC6U1fKqM',
  'made-in-abyss-s2': 'e4Wq7n7qXwQ',
  'tokyo-ghoul': '7aMOurgDB-o',
  'gurren-lagann': 'oXdc_w8p1kQ',
  'fate-zero': 'k4-X5k5Q0cQ',
  'fate-stay-night-ubw': 'spSe63fQc3g',
  'monster': 'msTB5b_w_gE',
  'gintama': '8Qn_spdM5Zg',
  'tensura-s3': 'g4e5W6w8Q2c',
  'dr-stone-new-world': '4zV3eQ5c3Ww',
  'eminence-in-shadow-s2': '_w3Qk5v9q8g',
  'your-name': 'xU47nhruN-Q',
  'spirited-away': 'ByXuk9QqQkk',
  'a-silent-voice': 'nfK6UgLra7g',
  'jujutsu-kaisen-0': '2doceznyEU8',
  'demon-slayer-mugen-train': 'ATJYac_dORw'
};

const rawContent = fs.readFileSync('data/anime-data.js', 'utf8');
const sandbox = {};
vm.runInNewContext(rawContent + '; list = animeDatabase;', sandbox);
const animeList = sandbox.list;

console.log(`Loaded ${animeList.length} anime entries.`);

animeList.forEach(anime => {
  const yid = youtubeMap[anime.id] || 'BwIdVcxzU10';
  anime.youtubeId = yid;
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
      youtubeId: yid,
      ultraHdUrl: `https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&enablejsapi=1`,
      vidlinkSubUrl: `https://vidlink.pro/anime/${mal}/${ep}/sub?fallback=true`,
      vidlinkDubUrl: `https://vidlink.pro/anime/${mal}/${ep}/dub?fallback=true`,
      twoEmbedUrl: `https://www.2embed.cc/embed/anime/${mal}/${ep}`,
      hlsStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      // backward-compat fields
      embedUrl: `https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&enablejsapi=1`,
      megaCloudUrl: `https://vidlink.pro/anime/${mal}/${ep}/sub?fallback=true`,
      vidsrcClassicUrl: `https://vidlink.pro/anime/${mal}/${ep}/dub?fallback=true`
    });
  }

  anime.episodes = episodes;
});

const generatedCode = `const animeDatabase = ${JSON.stringify(animeList, null, 2)};\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = animeDatabase;\n}\n`;

fs.writeFileSync('data/anime-data.js', generatedCode, 'utf8');
console.log('Updated data/anime-data.js successfully.');

// Ensure public/data and docs/data exist and copy
fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/anime-data.js', generatedCode, 'utf8');
console.log('Updated public/data/anime-data.js successfully.');

fs.mkdirSync('docs/data', { recursive: true });
fs.writeFileSync('docs/data/anime-data.js', generatedCode, 'utf8');
console.log('Updated docs/data/anime-data.js successfully.');
