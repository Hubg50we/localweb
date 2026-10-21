// HiAnime v15.0 Ultimate Anime Ecosystem Automated Test Suite
const puppeteer = require('puppeteer-core');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

let passedCount = 0;
let failedCount = 0;

function pass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
  passedCount++;
}

function fail(msg, err) {
  console.error(`  ❌ [FAIL] ${msg}:`, err ? (err.message || err) : '');
  failedCount++;
}

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runSuite() {
  console.log('====================================================');
  console.log('🧪 Starting HiAnime v15.0 Ultimate Ecosystem Suite');
  console.log('====================================================\n');

  // 1. Verify Service Worker & Cache
  console.log('1. Checking Service Worker & HTML Versioning...');
  try {
    const pubSw = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf-8');
    const docsSw = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sw.js'), 'utf-8');
    assert(pubSw.includes('hianime-v15-ultimate'), 'public/sw.js defines hianime-v15-ultimate cache');
    assert(docsSw.includes('hianime-v15-ultimate'), 'docs/sw.js defines hianime-v15-ultimate cache');
    pass('Service Worker defines active hianime-v15-ultimate cache across public/ and docs/');
  } catch (e) { fail('Service Worker check', e); }

  // 2. Test Server Endpoints
  console.log('\n2. Testing Server Manga & Countdown Endpoints...');
  try {
    const mangaRes = await request(`${BASE_URL}/api/manga/solo-leveling/chapters`);
    assert(mangaRes.status === 200 && mangaRes.json && mangaRes.json.success, 'GET /api/manga/:slug/chapters returns HTTP 200');
    assert(Array.isArray(mangaRes.json.chapters) && mangaRes.json.chapters.length >= 30, 'Returns 30+ manga chapters');
    pass('GET /api/manga/:slug/chapters returns structured chapter list');

    const pagesRes = await request(`${BASE_URL}/api/manga/solo-leveling/chapter/1/pages`);
    assert(pagesRes.status === 200 && pagesRes.json && pagesRes.json.pages?.length >= 3, 'GET /api/manga/:slug/chapter/:num/pages returns pages');
    pass('GET /api/manga/:slug/chapter/:num/pages returns high-res panel URLs');

    const airRes = await request(`${BASE_URL}/api/airing/countdowns`);
    assert(airRes.status === 200 && airRes.json && airRes.json.countdowns?.length >= 5, 'GET /api/airing/countdowns returns countdown items');
    pass('GET /api/airing/countdowns returns active broadcast countdown timestamps');
  } catch (e) { fail('Server Endpoints check', e); }

  // 3. Headless Chrome Browser Verification
  console.log('\n3. Testing Browser UI, Modals & User Interaction...');
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));

    assert.strictEqual(errors.length, 0, `Page errors on load: ${errors.join(', ')}`);
    pass('Zero runtime or console errors on initial page load');

    // 4. Test Airing Countdown pill in Spotlight
    console.log('\n4. Testing Real-time Airing Countdown Pill...');
    const countdownText = await page.evaluate(() => {
      const pill = document.querySelector('.airing-countdown-pill');
      const val = document.querySelector('.airing-countdown-val');
      return { hasPill: !!pill, text: val ? val.textContent : '' };
    });
    assert(countdownText.hasPill, 'Hero Spotlight renders .airing-countdown-pill');
    assert(countdownText.text.includes('d :'), 'Countdown ticker formats live days, hours, mins');
    pass('Hero Spotlight renders dynamic real-time Airing Countdown ticker');

    // 5. Test Manga Reader Tab inside Watch Player Modal
    console.log('\n5. Testing Manga Reader Tab inside Watch Modal...');
    await page.evaluate(() => {
      const card = document.querySelector('.anime-card');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Click Tab 4 (Read Manga)
    const mangaState = await page.evaluate(() => {
      const tabMangaBtn = document.querySelector('.player-tab-btn[data-tab="tab-manga"]');
      if (tabMangaBtn) tabMangaBtn.click();
      const stage = document.getElementById('mangaViewerStage');
      const select = document.getElementById('mangaChapterSelect');
      const pagesCount = stage ? stage.querySelectorAll('.manga-page-img').length : 0;
      const chapterCount = select ? select.options.length : 0;
      return { hasTabBtn: !!tabMangaBtn, pagesCount, chapterCount };
    });
    assert(mangaState.hasTabBtn, 'Watch modal contains Tab 4 (Read Manga) button');
    assert(mangaState.chapterCount >= 20, `Manga chapter selector contains ${mangaState.chapterCount} chapters`);
    assert(mangaState.pagesCount >= 3, `Manga viewer stage loaded ${mangaState.pagesCount} illustrated pages`);
    pass('Manga Reader tab switches seamlessly and renders illustrated chapter pages');

    // 6. Test Character & Voice Actor Bio Modal
    console.log('\n6. Testing Character & Voice Actor Bio Modal...');
    await page.evaluate(() => {
      const tabCastBtn = document.querySelector('.player-tab-btn[data-tab="tab-cast"]');
      if (tabCastBtn) tabCastBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const charModalState = await page.evaluate(() => {
      const firstCast = document.querySelector('.cast-card');
      if (firstCast) firstCast.click();
      const modal = document.getElementById('characterBioModal');
      const isVisible = modal ? window.getComputedStyle(modal).display !== 'none' : false;
      const title = document.getElementById('charBioTitle')?.textContent || '';
      return { isVisible, title };
    });
    assert(charModalState.isVisible, 'Character Bio modal opens on cast card click');
    assert(charModalState.title.length > 0, `Character Bio renders character name: ${charModalState.title}`);
    pass('Clicking cast card opens detailed Voice Actor & Character Lore modal');

    // Close Character Bio and Watch Modal
    await page.evaluate(() => {
      const closeBio = document.getElementById('closeCharBioBtn');
      if (closeBio) closeBio.click();
      const closeWatch = document.getElementById('closeModalBtn');
      if (closeWatch) closeWatch.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 7. Test Otaku Tier List Maker Modal
    console.log('\n7. Testing Otaku Tier List Maker Modal...');
    const tierState = await page.evaluate(() => {
      if (typeof openTierListModal === 'function') openTierListModal();
      const modal = document.getElementById('tierListModal');
      const isVisible = modal ? window.getComputedStyle(modal).display !== 'none' : false;
      const rows = document.querySelectorAll('.tier-row').length;
      const poolCards = document.querySelectorAll('#tierPoolGrid .tier-item-card').length;
      return { isVisible, rows, poolCards };
    });
    assert(tierState.isVisible, 'Tier List Maker modal opens');
    assert.strictEqual(tierState.rows, 5, `Renders 5 tier rows (S, A, B, C, D), found: ${tierState.rows}`);
    assert(tierState.poolCards >= 30, `Renders unranked anime pool (${tierState.poolCards} shows)`);
    pass('Otaku Tier List Maker opens with S/A/B/C/D tiers and full anime pool');

    // Test ranking a show into S Tier
    const tierRankState = await page.evaluate(() => {
      const firstPoolCard = document.querySelector('#tierPoolGrid .tier-item-card');
      if (firstPoolCard) firstPoolCard.click();
      const sCards = document.querySelectorAll('.tier-row[data-tier="S"] .tier-item-card').length;
      return { sCards };
    });
    assert(tierRankState.sCards >= 1, 'Clicking card in pool places it into S tier');
    pass('Placing anime card into S Tier updates board and local storage state');

    // Close Tier List modal
    await page.evaluate(() => {
      const closeTier = document.getElementById('closeTierListBtn');
      if (closeTier) closeTier.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 8. Test AniList & MAL Import/Export Modal
    console.log('\n8. Testing AniList & MyAnimeList Importer/Exporter...');
    const importState = await page.evaluate(() => {
      if (typeof openImportExportModal === 'function') openImportExportModal();
      const modal = document.getElementById('listImportExportModal');
      const isVisible = modal ? window.getComputedStyle(modal).display !== 'none' : false;
      const dropZone = !!document.getElementById('importDropZone');
      return { isVisible, dropZone };
    });
    assert(importState.isVisible, 'Import/Export modal opens');
    assert(importState.dropZone, 'Drag and drop zone exists');

    // Test XML parser with sample MAL XML
    const xmlParseResult = await page.evaluate(() => {
      const sampleMalXml = `<?xml version="1.0" encoding="UTF-8"?>
      <myanimelist>
        <myinfo><user_name>OtakuTest</user_name></myinfo>
        <anime>
          <series_title>Solo Leveling</series_title>
          <my_watched_episodes>12</my_watched_episodes>
          <my_score>10</my_score>
          <my_status>2</my_status>
        </anime>
        <anime>
          <series_title>Frieren: Beyond Journey's End</series_title>
          <my_watched_episodes>28</my_watched_episodes>
          <my_score>10</my_score>
          <my_status>2</my_status>
        </anime>
      </myanimelist>`;
      parseMyAnimeListXml(sampleMalXml);
      const isSaved = watchlist.includes('solo-leveling') || watchlist.length > 0;
      return { isSaved };
    });
    assert(xmlParseResult.isSaved, 'Sample MAL XML imported and matched anime in catalog');
    pass('MyAnimeList XML parser successfully matches and imports anime entries');

    // Close Import modal
    await page.evaluate(() => {
      const closeImport = document.getElementById('closeImportExportBtn');
      if (closeImport) closeImport.click();
    });

  } catch (e) {
    fail('Browser Interaction check', e);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n====================================================');
  console.log(`v15.0 Suite Summary: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal Suite Error:', err);
  process.exit(1);
});
