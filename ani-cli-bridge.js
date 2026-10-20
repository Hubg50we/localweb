/**
 * ani-cli Bridge & Scraper Engine
 * Based on pystardust/ani-cli (https://github.com/pystardust/ani-cli)
 * Implements ani-cli v5.1.5 HiAnime scraping, decoding, and bash execution.
 */

const { exec } = require('child_process');
const path = require('path');
const https = require('https');

const ANI_CLI_PATH = path.resolve(__dirname, '..', 'ani-cli', 'ani-cli');
const SH_PATH = 'C:\\Program Files\\Git\\usr\\bin\\sh.exe';

const BASE_API = 'https://hianime.at';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Helper for https requests matching ani-cli headers
function fetchUrl(url, referer = '') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': '*/*',
        ...(referer ? { 'Referer': referer } : {})
      },
      timeout: 10000
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

// ani-cli otaku-embed-v1 deobfuscator
function deobfuscateBlob(b64String) {
  try {
    const bytes = Buffer.from(b64String, 'base64');
    const key = Buffer.from('otaku-embed-v1');
    const output = Buffer.alloc(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      output[i] = bytes[i] ^ key[i % key.length];
    }
    return JSON.parse(output.toString('utf8'));
  } catch (err) {
    return null;
  }
}

// 1. Search anime using ani-cli logic
async function searchAnime(query) {
  try {
    const searchUrl = `${BASE_API}/search?keyword=${encodeURIComponent(query)}`;
    const html = await fetchUrl(searchUrl);

    const results = [];
    const itemRegex = /<h3 class="film-name">\s*<a href="[^"]*\/([^"\/]*)"\s*title="([^"]*)"/g;
    let match;

    while ((match = itemRegex.exec(html)) !== null) {
      const id = match[1];
      const title = match[2].replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      results.push({ id, title });
    }

    return results;
  } catch (error) {
    return [];
  }
}

// 2. Fetch episodes list using ani-cli logic
async function getEpisodes(animeSlug) {
  try {
    const parts = animeSlug.split('-');
    const numericId = parts[parts.length - 1];
    const epUrl = `${BASE_API}/api/theme/episode/list/${numericId}`;
    const jsonStr = await fetchUrl(epUrl);
    const data = JSON.parse(jsonStr);

    if (!data.html) return [];

    const episodes = [];
    const epRegex = /data-number="([^"]*)".*?data-id="([0-9]+)"/g;
    let match;

    while ((match = epRegex.exec(data.html)) !== null) {
      episodes.push({
        episodeNumber: parseInt(match[1]) || 1,
        episodeId: match[2],
        title: `Episode ${match[1]}`
      });
    }

    return episodes;
  } catch (err) {
    return [];
  }
}

// 3. Resolve m3u8 stream using ani-cli deobfuscation
async function resolveStream(episodeId, mode = 'sub') {
  try {
    const serversUrl = `${BASE_API}/api/theme/episode/servers?episodeId=${episodeId}`;
    const serversJson = await fetchUrl(serversUrl);
    const data = JSON.parse(serversJson);

    if (!data.html) return null;

    // Search for ZokoAnime server hash
    const serverRegex = new RegExp(`data-type="${mode}".*?data-server-name="ZokoAnime".*?data-hash="([^"]*)"`, 'i');
    const hashMatch = data.html.match(serverRegex);

    if (!hashMatch) return null;

    const embedUrl = Buffer.from(hashMatch[1], 'base64').toString('utf8');
    const referer = new URL(embedUrl).origin + '/';

    const embedHtml = await fetchUrl(embedUrl);
    const blobMatch = embedHtml.match(/window\.__P="([^"]*)"/);

    if (!blobMatch) return null;

    const decoded = deobfuscateBlob(blobMatch[1]);
    if (!decoded || !decoded.src) return null;

    return {
      masterM3u8: decoded.src,
      referer: referer,
      subtitles: decoded.subtitles || []
    };
  } catch (err) {
    return null;
  }
}

// 4. Direct shell runner for pystardust/ani-cli
function runAniCliShell(args = '') {
  return new Promise((resolve) => {
    const cmd = `"${SH_PATH}" "${ANI_CLI_PATH}" ${args}`;
    exec(cmd, { env: { ...process.env, ANI_CLI_PLAYER: 'echo' }, timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        output: (stdout || '').trim(),
        error: (stderr || '').trim()
      });
    });
  });
}

module.exports = {
  ANI_CLI_PATH,
  searchAnime,
  getEpisodes,
  resolveStream,
  runAniCliShell
};
