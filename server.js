const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { META, ANIME } = require('@consumet/extensions');
const animeDatabase = require('./data/anime-data');
const aniCli = require('./ani-cli-bridge');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Consumet providers
const anilist = new META.Anilist();

app.use(cors());
app.use(express.json());

// Serve PWA Manifest with application/manifest+json
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Helper to normalize Consumet anime to HiAnime frontend schema
function formatConsumetAnime(item) {
  const title = (item.title && (item.title.english || item.title.userPreferred || item.title.romaji)) || item.name || 'Unknown Title';
  const romaji = (item.title && item.title.romaji) || '';
  const score = item.rating ? (item.rating / 10).toFixed(1) : (item.score || '8.8');
  
  return {
    id: String(item.id),
    title: title,
    romajiTitle: romaji,
    banner: item.cover || item.image || 'https://images.alphacoders.com/134/1347318.png',
    poster: item.image || item.poster || 'https://cdn.myanimelist.net/images/anime/1838/141442.jpg',
    rating: String(score),
    quality: 'HD',
    type: item.type || 'TV Series',
    duration: item.duration ? `${item.duration}m` : '24m',
    subEpisodes: item.totalEpisodes || 12,
    dubEpisodes: Math.max(1, (item.totalEpisodes || 12) - 1),
    status: item.status || 'Completed',
    season: item.releaseDate ? String(item.releaseDate) : '2024',
    studio: (item.studios && item.studios[0]) || 'Studio',
    genres: item.genres || ['Action', 'Fantasy'],
    synopsis: (item.description || 'No description available.').replace(/<[^>]*>/g, ''),
    episodes: item.episodes && item.episodes.length > 0 ? item.episodes.map((ep, i) => {
      const epNum = ep.number || (i + 1);
      const mal = item.malId || item.id || '52299';
      return {
        number: epNum,
        title: ep.title || `Episode ${epNum}`,
        duration: '24:00',
        thumbnail: item.cover || item.image,
        embedUrl: `https://vidsrc.pm/embed/anime/${mal}/${epNum}`,
        megaCloudUrl: `https://multiembed.mov/?video_id=${mal}&ep=${epNum}&an=1`,
        twoEmbedUrl: `https://www.2embed.cc/embed/anime/${mal}/${epNum}`,
        vidsrcClassicUrl: `https://vidsrc.me/embed/anime?mal=${mal}&ep=${epNum}`
      };
    }) : Array.from({ length: Math.min(item.totalEpisodes || 12, 24) }, (_, i) => {
      const epNum = i + 1;
      const mal = item.malId || item.id || '52299';
      return {
        number: epNum,
        title: `Episode ${epNum}`,
        duration: '24:00',
        thumbnail: item.cover || item.image,
        embedUrl: `https://vidsrc.pm/embed/anime/${mal}/${epNum}`,
        megaCloudUrl: `https://multiembed.mov/?video_id=${mal}&ep=${epNum}&an=1`,
        twoEmbedUrl: `https://www.2embed.cc/embed/anime/${mal}/${epNum}`,
        vidsrcClassicUrl: `https://vidsrc.me/embed/anime?mal=${mal}&ep=${epNum}`
      };
    })
  };
}

// 1. GET /api/anime - Catalog with Consumet Trending + Local
app.get('/api/anime', async (req, res) => {
  const { genre, search, tab } = req.query;

  // Live search via Consumet Anilist
  if (search) {
    try {
      const searchRes = await anilist.search(search, 1, 15);
      if (searchRes && searchRes.results && searchRes.results.length > 0) {
        const formatted = searchRes.results.map(formatConsumetAnime);
        return res.json({ success: true, count: formatted.length, source: 'consumet', data: formatted });
      }
    } catch (err) {
      console.warn('Consumet search error, falling back to local dataset:', err.message);
    }
  }

  // Filter local dataset
  let results = [...animeDatabase];
  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.romajiTitle.toLowerCase().includes(q) ||
      a.genres.some(g => g.toLowerCase().includes(q))
    );
  }

  if (genre && genre !== 'All') {
    results = results.filter(a => a.genres.includes(genre));
  }

  if (tab === 'popular') {
    results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  } else if (tab === 'airing') {
    results = results.filter(a => a.status === 'Currently Airing');
    if (results.length === 0) results = animeDatabase.slice(0, 6);
  } else if (tab === 'completed') {
    results = results.filter(a => a.status === 'Completed');
  }

  res.json({ success: true, count: results.length, source: 'local', data: results });
});

// 2. GET /api/anime/spotlight
app.get('/api/anime/spotlight', (req, res) => {
  const spotlights = animeDatabase.filter(a => a.spotlight);
  res.json({ success: true, data: spotlights.length > 0 ? spotlights : animeDatabase.slice(0, 4) });
});

// 3. GET /api/anime/top10 - Powered by Consumet Trending Anime
app.get('/api/anime/top10', async (req, res) => {
  try {
    const trending = await anilist.fetchTrendingAnime(1, 10);
    if (trending && trending.results && trending.results.length > 0) {
      const formatted = trending.results.map(formatConsumetAnime);
      return res.json({ success: true, source: 'consumet', data: formatted });
    }
  } catch (err) {
    console.warn('Consumet trending fetch failed, fallback to local top10:', err.message);
  }
  const top10 = [...animeDatabase].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 10);
  res.json({ success: true, source: 'local', data: top10 });
});

// 4. GET /api/anime/:id
app.get('/api/anime/:id', async (req, res) => {
  const local = animeDatabase.find(a => a.id === req.params.id);
  if (local) return res.json({ success: true, data: local });

  // Query Consumet
  try {
    const info = await anilist.fetchAnimeInfo(req.params.id);
    if (info) {
      return res.json({ success: true, source: 'consumet', data: formatConsumetAnime(info) });
    }
  } catch (err) {
    console.warn(`Consumet fetchAnimeInfo(${req.params.id}) error:`, err.message);
  }

  res.status(404).json({ success: false, message: 'Anime not found' });
});

// 5. GET /api/anime/:id/episode/:epNumber/servers
app.get('/api/anime/:id/episode/:epNumber/servers', (req, res) => {
  const anime = animeDatabase.find(a => a.id === req.params.id);
  const epNum = parseInt(req.params.epNumber) || 1;
  const mal = (anime && anime.malId) || '52299';
  const ep = (anime && anime.episodes && anime.episodes.find(e => e.number === epNum)) || {
    number: epNum,
    title: `Episode ${epNum}`,
    embedUrl: `https://vidsrc.pm/embed/anime/${mal}/${epNum}`,
    megaCloudUrl: `https://multiembed.mov/?video_id=${mal}&ep=${epNum}&an=1`,
    twoEmbedUrl: `https://www.2embed.cc/embed/anime/${mal}/${epNum}`,
    vidsrcClassicUrl: `https://vidsrc.me/embed/anime?mal=${mal}&ep=${epNum}`
  };

  const servers = [
    { id: 'vidsrc', name: 'VidSrc HD (1080p)', type: 'Sub', embedUrl: ep.embedUrl, quality: '1080p' },
    { id: 'multiembed', name: 'MultiEmbed (Auto)', type: 'Sub', embedUrl: ep.megaCloudUrl, quality: '4K' },
    { id: 'twoembed', name: '2Embed (Fast)', type: 'Sub', embedUrl: ep.twoEmbedUrl, quality: '1080p' },
    { id: 'vidsrc-classic', name: 'VidSrc Dub', type: 'Dub', embedUrl: ep.vidsrcClassicUrl, quality: '1080p' },
    { id: 'streamwish', name: 'StreamWish (Dub)', type: 'Dub', embedUrl: ep.megaCloudUrl, quality: '720p' }
  ];

  res.json({ success: true, animeTitle: (anime && anime.title) || 'Anime', episode: ep, servers });
});

// PWA Manifest Route
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// In-memory schedule cache (30-minute TTL)
const scheduleCache = new Map();
const SCHEDULE_CACHE_TTL = 30 * 60 * 1000;

// Helper to generate schedule fallback from local database
function getLocalScheduleFallback(day) {
  const dayIndexMap = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
  };
  const targetDay = (day || 'monday').toLowerCase();
  const dayIdx = dayIndexMap[targetDay] !== undefined ? dayIndexMap[targetDay] : 0;
  
  const times = ['18:00', '19:30', '21:00', '22:30', '23:00', '23:30'];
  const shifted = [...animeDatabase.slice(dayIdx % animeDatabase.length), ...animeDatabase.slice(0, dayIdx % animeDatabase.length)];
  const selected = shifted.slice(0, Math.min(6, animeDatabase.length));

  return selected.map((anime, i) => ({
    malId: anime.malId || '52299',
    id: anime.id,
    title: anime.title,
    romaji: anime.romajiTitle || anime.title,
    image: anime.poster,
    banner: anime.banner,
    broadcastTime: times[i % times.length] + ' (JST)',
    episodes: anime.subEpisodes || 12,
    currentEp: Math.min((i + 1) * 2, anime.subEpisodes || 12),
    score: anime.rating || '8.8',
    type: anime.type || 'TV Series',
    genres: anime.genres || ['Action', 'Fantasy'],
    synopsis: anime.synopsis
  }));
}

// 6. GET /api/live/schedule?day=<day> (Jikan v4 with fallback & 30-min cache)
app.get('/api/live/schedule', async (req, res) => {
  const day = (req.query.day || 'monday').toLowerCase();
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const targetDay = validDays.includes(day) ? day : 'monday';

  // Check in-memory cache
  const cached = scheduleCache.get(targetDay);
  if (cached && (Date.now() - cached.timestamp < SCHEDULE_CACHE_TTL)) {
    return res.json({ success: true, day: targetDay, source: 'cache', data: cached.data });
  }

  // Attempt Jikan v4 with strict 4s timeout
  try {
    const jikanData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.jikan.moe',
        path: `/v4/schedules?filter=${targetDay}&limit=15`,
        method: 'GET',
        headers: { 'User-Agent': 'HiAnimeLocal/3.0' },
        timeout: 4000
      };

      const request = https.get(options, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`Jikan status ${response.statusCode}`));
        }
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.data || []);
          } catch (err) {
            reject(err);
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Jikan request timeout'));
      });
    });

    if (jikanData && jikanData.length > 0) {
      const formatted = jikanData.map(item => {
        const localMatch = animeDatabase.find(a => String(a.malId) === String(item.mal_id));
        return {
          malId: item.mal_id,
          id: localMatch ? localMatch.id : `mal-${item.mal_id}`,
          title: item.title_english || item.title || item.title_japanese || 'Unknown Anime',
          romaji: item.title || '',
          image: (item.images && item.images.webp && item.images.webp.large_image_url) || (item.images && item.images.jpg && item.images.jpg.image_url) || 'https://cdn.myanimelist.net/images/anime/1838/141442.jpg',
          banner: (item.images && item.images.jpg && item.images.jpg.large_image_url) || '',
          broadcastTime: (item.broadcast && item.broadcast.time ? `${item.broadcast.time} (JST)` : (item.broadcast && item.broadcast.string ? item.broadcast.string : '23:00 (JST)')),
          episodes: item.episodes || 12,
          currentEp: (item.episodes ? Math.max(1, Math.floor(item.episodes / 2)) : 1),
          score: item.score ? String(item.score) : '8.5',
          type: item.type || 'TV Series',
          genres: (item.genres || []).map(g => g.name),
          synopsis: item.synopsis || ''
        };
      });

      scheduleCache.set(targetDay, { timestamp: Date.now(), data: formatted });
      return res.json({ success: true, day: targetDay, source: 'jikan', data: formatted });
    }
  } catch (err) {
    console.warn(`Jikan API live schedule fallback for ${targetDay}:`, err.message);
  }

  // Graceful fallback to local schedule
  const fallbackData = getLocalScheduleFallback(targetDay);
  scheduleCache.set(targetDay, { timestamp: Date.now(), data: fallbackData });
  res.json({ success: true, day: targetDay, source: 'local_fallback', data: fallbackData });
});

// ani-cli Integration Routes
app.get('/api/ani-cli/info', async (req, res) => {
  const versionCheck = await aniCli.runAniCliShell('-V');
  res.json({
    success: true,
    engine: 'ani-cli v5.1.5 + Consumet',
    repo: 'https://github.com/pystardust/ani-cli',
    status: 'online',
    version: versionCheck.output || '5.1.5'
  });
});

app.get('/api/ani-cli/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query) return res.json({ success: true, data: [] });
  const results = await aniCli.searchAnime(query);
  res.json({ success: true, count: results.length, data: results });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`HiAnime Streaming Platform (Powered by Consumet & ani-cli)`);
  console.log(`Local URL: http://0.0.0.0:${PORT} (http://localhost:${PORT})`);
  console.log(`API Docs:  http://localhost:${PORT}/api/anime`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.log(`Port ${PORT} in use, trying ${nextPort}...`);
    app.listen(nextPort, () => {
      console.log(`HiAnime running at http://localhost:${nextPort}`);
    });
  } else {
    console.error(err);
  }
});
