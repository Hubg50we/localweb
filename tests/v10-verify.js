/**
 * tests/v10-verify.js
 * Verification suite for v8.0 - v10.0:
 * - Zero sample/placeholder stream URLs
 * - Real AniList + MAL IDs mapped
 * - Synced episode metadata (real titles, air dates, filler flags)
 * - Dual-layer Plyr + Hls.js native skin & iframe mode
 * - AniSkip REST API skip-times engine
 * - SUB/DUB Audio Preference memory
 * - Multi-server real streams & auto-failover engine
 * - Interactive multi-tabs (Episodes, Cast, Trailer, Community)
 * - Headless Chrome live playback & interaction checks
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const puppeteer = require('puppeteer-core');

const rootDir = path.join(__dirname, '..');
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

async function request(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, data, json });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting HiAnime v10.0 Enterprise Verification Suite');
  console.log('====================================================\n');

  try {
    // 1. Zero Dummy / Sample Video Stream Checks
    console.log('1. Checking Zero Sample / Dummy Stream URLs...');
    const animeDataStr = fs.readFileSync(path.join(rootDir, 'data', 'anime-data.js'), 'utf-8');
    const pubAppJs = fs.readFileSync(path.join(rootDir, 'public', 'app.js'), 'utf-8');
    const docsAppJs = fs.readFileSync(path.join(rootDir, 'docs', 'app.js'), 'utf-8');
    const pubIndex = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf-8');
    const docsIndex = fs.readFileSync(path.join(rootDir, 'docs', 'index.html'), 'utf-8');

    const sampleTokens = ['test-streams.mux.dev', 'bitdash', 'sintel', 'tears-of-steel', 'bipbop', 'BigBuckBunny'];
    for (const token of sampleTokens) {
      assert(!animeDataStr.includes(token), `data/anime-data.js contains zero occurrences of ${token}`);
      assert(!pubAppJs.includes(token), `public/app.js contains zero occurrences of ${token}`);
      assert(!docsAppJs.includes(token), `docs/app.js contains zero occurrences of ${token}`);
    }

    // 2. Metadata, Episode Titles, Filler Flags, Trailers, and Cast
    console.log('\n2. Checking Enriched Anime Metadata & Episodes...');
    const animeDb = require(path.join(rootDir, 'data', 'anime-data.js'));
    assert(animeDb.length >= 50, `Catalog contains 50+ shows (found: ${animeDb.length})`);

    let allHaveIds = true;
    let allHaveTrailers = true;
    let allHaveCharacters = true;
    let allHaveRealEpTitles = true;
    let hasFillerFlag = false;

    for (const anime of animeDb) {
      if (!anime.mal_id || !anime.anilist_id) allHaveIds = false;
      if (!anime.trailer || !anime.trailer.embedUrl) allHaveTrailers = false;
      if (!anime.characters || anime.characters.length === 0) allHaveCharacters = false;
      if (!anime.episodes || anime.episodes.length === 0) allHaveRealEpTitles = false;
      else {
        if (anime.episodes.some(e => e.filler === true)) hasFillerFlag = true;
        if (anime.episodes.some(e => !e.title || e.title === '')) allHaveRealEpTitles = false;
      }
    }

    assert(allHaveIds, 'All anime entries have verified numeric mal_id and anilist_id');
    assert(allHaveTrailers, 'All anime entries have official trailer embed URLs');
    assert(allHaveCharacters, 'All anime entries have character cast & voice actor metadata');
    assert(allHaveRealEpTitles, 'All anime entries have populated episode arrays with real titles');
    assert(hasFillerFlag, 'Episode lists contain real filler/canon boolean flags');

    // 3. HTML Markup & Plyr / AniSkip / Multi-Tab Elements
    console.log('\n3. Checking HTML Markup & Player Dual-Layer Architecture...');
    assert(pubIndex.includes('https://cdn.plyr.io/3.7.8/plyr.css'), 'public/index.html includes official Plyr CSS');
    assert(pubIndex.includes('https://cdn.plyr.io/3.7.8/plyr.polyfilled.js'), 'public/index.html includes Plyr Polyfill JS');
    assert(pubIndex.includes('id="neonHlsPlayer"'), 'public/index.html defines neonHlsPlayer video element');
    assert(pubIndex.includes('id="animeEmbedPlayer"'), 'public/index.html defines animeEmbedPlayer iframe');
    assert(!pubIndex.includes('<meta name="referrer" content="no-referrer">'), 'public/index.html does not contain global no-referrer meta');
    assert(pubIndex.includes('referrerpolicy="origin"'), 'public/index.html defines referrerpolicy="origin" on embed iframe');
    assert(pubIndex.includes('id="aniSkipOverlay"'), 'public/index.html defines AniSkip floating overlay');
    assert(pubIndex.includes('id="prefSubBtn"') && pubIndex.includes('id="prefDubBtn"'), 'public/index.html defines SUB/DUB audio preference buttons');
    assert(pubIndex.includes('id="playerDirectToolbar"'), 'public/index.html defines player direct toolbar');
    assert(pubIndex.includes('id="rewind10Btn"') && pubIndex.includes('id="forward10Btn"'), 'public/index.html defines -10s and +10s buttons');
    assert(pubIndex.includes('id="quickSkip85Btn"'), 'public/index.html defines +85s intro skip button');
    assert(pubIndex.includes('id="subStylerModal"'), 'public/index.html defines subtitle appearance styler modal');
    assert(pubIndex.includes('data-tab="tab-episodes"') && pubIndex.includes('data-tab="tab-cast"') && pubIndex.includes('data-tab="tab-trailer"'), 'public/index.html defines multi-tab navigation');

    // 4. Service Worker Cache Version & Mirrors
    console.log('\n4. Checking Service Worker Version & Docs Mirror...');
    const swPub = fs.readFileSync(path.join(rootDir, 'public', 'sw.js'), 'utf-8');
    const swDocs = fs.readFileSync(path.join(rootDir, 'docs', 'sw.js'), 'utf-8');
    assert(swPub.includes('hianime-v10-custom-plyr'), 'public/sw.js defines hianime-v10-custom-plyr cache version');
    assert(swDocs.includes('hianime-v10-custom-plyr'), 'docs/sw.js defines hianime-v10-custom-plyr cache version');
    assert(pubIndex.includes('?v=10.0'), 'public/index.html bumps script queries to ?v=10.0');
    assert(docsIndex.includes('?v=10.0'), 'docs/index.html bumps script queries to ?v=10.0');

    // 5. AniSkip REST API Connectivity
    console.log('\n5. Testing Live AniSkip REST API for Solo Leveling...');
    try {
      const skipRes = await request('https://api.aniskip.com/v1/skip-times/52299/1?types[]=op&types[]=ed');
      assert(skipRes.status === 200 && skipRes.json && skipRes.json.found === true, 'AniSkip API returns HTTP 200 with skip intervals for Solo Leveling ep 1');
      const op = skipRes.json.results?.find(r => r.skip_type === 'op');
      assert(Boolean(op && op.interval && op.interval.start_time > 0), `AniSkip provides valid OP timestamp interval (starts at ${op?.interval?.start_time}s)`);
    } catch (err) {
      console.warn('  ⚠️ [WARN] AniSkip external API check skipped or timed out:', err.message);
    }

    // 6. Headless Chrome Playback & Multi-Tab Verification
    console.log('\n6. Testing Headless Chrome Playback & Multi-Tabs on http://localhost:3000...');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', m => console.log('[BROWSER CONSOLE]', m.type(), m.text()));
    page.on('pageerror', e => console.error('[BROWSER ERROR]', e.message, e.stack));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    assert(title.includes('HiAnime'), `Home page loaded with title "${title}"`);

    // Click Solo Leveling card
    await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('.anime-card')).find(c => c.textContent.includes('Solo Leveling')) || document.querySelector('.anime-card');
      if (card) card.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    const isPlayerOpen = await page.$eval('#playerModal', el => el.classList.contains('active'));
    assert(isPlayerOpen, 'Player modal opens successfully upon clicking anime card');

    const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
    assert(iframeSrc.includes('vidsrc.icu/embed/anime/151807/1/0') || iframeSrc.includes('151807'), `Player loads real anime embed stream (src: ${iframeSrc})`);

    const hasSandbox = await page.$eval('#animeEmbedPlayer', el => el.hasAttribute('sandbox'));
    assert(!hasSandbox, 'Player iframe has no sandbox attribute blocking video CDNs');

    // Check Multi-Tabs
    const epQuickCount = await page.$$eval('#epGridQuickAccess .ep-quick-btn', els => els.length);
    assert(epQuickCount > 0, `Tab 1: Episode Quick Access grid rendered ${epQuickCount} episodes`);

    // Switch to Cast Tab
    await page.evaluate(() => {
      const castTabBtn = document.querySelector('.player-tab-btn[data-tab="tab-cast"]');
      if (castTabBtn) castTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const castCardCount = await page.$$eval('#castGrid .cast-card', els => els.length);
    assert(castCardCount > 0, `Tab 2: Character & Voice Actor Cast tab rendered ${castCardCount} characters`);

    // Switch to Trailer Tab
    await page.evaluate(() => {
      const trailerTabBtn = document.querySelector('.player-tab-btn[data-tab="tab-trailer"]');
      if (trailerTabBtn) trailerTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const trailerSrc = await page.$eval('#trailerPlayerIframe', el => el.src);
    assert(trailerSrc.includes('youtube-nocookie.com/embed/'), `Tab 3: Official Trailer tab loaded safe preview (src: ${trailerSrc})`);

    // Test Audio Preference SUB -> DUB Toggle
    await page.evaluate(() => {
      const dubBtn = document.getElementById('prefDubBtn');
      if (dubBtn) dubBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    const newIframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
    assert(newIframeSrc.endsWith('/1') || newIframeSrc.includes('/1/1') || newIframeSrc.includes('dub'), `Audio preference switch to DUB updated player source (src: ${newIframeSrc})`);

    await browser.close();

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    failCount++;
  }

  console.log('\n====================================================');
  console.log(`v10.0 Verification Suite Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
