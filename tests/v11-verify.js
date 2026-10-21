const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

(async () => {
  console.log('====================================================');
  console.log('🧪 Starting HiAnime v11.0 Zero-YouTube & Multi-Source Suite');
  console.log('====================================================\n');

  console.log('1. Verifying 100% Zero-YouTube Across All Production Directories...');
  const checkFolders = ['public', 'docs', 'data'];
  for (const dir of checkFolders) {
    const fullDir = path.join(__dirname, '..', dir);
    function scanDir(d) {
      for (const item of fs.readdirSync(d)) {
        const p = path.join(d, item);
        if (fs.statSync(p).isDirectory()) {
          scanDir(p);
        } else if (p.endsWith('.js') || p.endsWith('.html') || p.endsWith('.json') || p.endsWith('.css')) {
          const content = fs.readFileSync(p, 'utf-8');
          test(`Zero YouTube references in ${path.relative(path.join(__dirname, '..'), p)}`, () => {
            assert(!content.toLowerCase().includes('youtube.com'), 'Contains youtube.com');
            assert(!content.toLowerCase().includes('youtu.be'), 'Contains youtu.be');
            assert(!content.toLowerCase().includes('youtube-nocookie.com'), 'Contains youtube-nocookie.com');
            assert(!content.toLowerCase().includes('ytimg.com'), 'Contains ytimg.com');
          });
        }
      }
    }
    scanDir(fullDir);
  }

  test('server.js contains zero YouTube references', () => {
    const serverContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
    assert(!serverContent.toLowerCase().includes('youtube.com'), 'Contains youtube.com');
    assert(!serverContent.toLowerCase().includes('youtu.be'), 'Contains youtu.be');
    assert(!serverContent.toLowerCase().includes('youtube-nocookie.com'), 'Contains youtube-nocookie.com');
  });

  console.log('\n2. Verifying Universal Providers Registry (data/providers.json)...');
  const provPath = path.join(__dirname, '..', 'data', 'providers.json');
  test('data/providers.json exists and contains 10 stream providers', () => {
    assert(fs.existsSync(provPath), 'providers.json missing');
    const providers = JSON.parse(fs.readFileSync(provPath, 'utf-8'));
    assert(Array.isArray(providers) && providers.length >= 10, 'Expected at least 10 providers');
    const hasTemplates = providers.every(p => p.urlTemplate && (p.urlTemplate.includes('{anilist_id}') || p.urlTemplate.includes('{mal_id}') || p.urlTemplate.includes('{slug}') || p.urlTemplate.includes('{title}')));
    assert(hasTemplates, 'All providers must contain template placeholders');
  });

  console.log('\n3. Verifying HTML Markup for Native Trailer & Custom Stream Tools...');
  const pubIndex = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');
  test('public/index.html defines native trailer video player', () => {
    assert(pubIndex.includes('id="trailerVideoPlayer"'), 'trailerVideoPlayer missing');
    assert(!pubIndex.includes('trailerPlayerIframe'), 'Old trailerPlayerIframe still present');
  });

  test('public/index.html defines Custom Stream / Local File modal & button', () => {
    assert(pubIndex.includes('id="openCustomStreamModalBtn"'), 'openCustomStreamModalBtn missing');
    assert(pubIndex.includes('id="customStreamModal"'), 'customStreamModal missing');
    assert(pubIndex.includes('id="tabCustomUrlBtn"'), 'tabCustomUrlBtn missing');
    assert(pubIndex.includes('id="tabCustomLocalBtn"'), 'tabCustomLocalBtn missing');
    assert(pubIndex.includes('id="customLocalVideoInput"'), 'customLocalVideoInput missing');
  });

  test('public/index.html defines Stream Providers Registry tab in Admin Studio', () => {
    assert(pubIndex.includes('data-tab="providers"'), 'providers tab button missing');
    assert(pubIndex.includes('id="adminTabProviders"'), 'adminTabProviders missing');
    assert(pubIndex.includes('id="adminProvidersJsonTextarea"'), 'adminProvidersJsonTextarea missing');
  });

  console.log('\n4. Verifying Service Worker & Docs Mirror Synchronization...');
  const pubSw = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf-8');
  const docsSw = fs.readFileSync(path.join(__dirname, '..', 'docs', 'sw.js'), 'utf-8');
  test('public/sw.js and docs/sw.js define valid service worker cache', () => {
    assert(pubSw.includes('hianime-v11-multisource') || pubSw.includes('hianime-v13-sfx-gamepad'), 'public/sw.js cache name');
    assert(docsSw.includes('hianime-v11-multisource') || docsSw.includes('hianime-v13-sfx-gamepad'), 'docs/sw.js cache name');
  });

  test('public/index.html and docs/index.html bump script versions', () => {
    assert(pubIndex.includes('?v=11.0') || pubIndex.includes('?v=13.0'), 'public/index.html missing script version');
    const docsIndex = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf-8');
    assert(docsIndex.includes('?v=11.0') || docsIndex.includes('?v=13.0'), 'docs/index.html missing script version');
  });

  console.log('\n5. Testing Server Endpoints on http://localhost:3000...');
  await testAsync('GET /api/providers returns HTTP 200 with registered providers', async () => {
    const res = await fetch('http://localhost:3000/api/providers');
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.success && Array.isArray(json.providers) && json.providers.length >= 10);
  });

  await testAsync('GET /api/sources/archive returns HTTP 200 with streamUrl', async () => {
    const res = await fetch('http://localhost:3000/api/sources/archive?title=Sita%20Sings%20the%20Blues&ep=1');
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.success && json.streamUrl && json.streamUrl.startsWith('https://archive.org/download/'));
  });

  await testAsync('GET /api/stream/proxy proxies content with CORS headers', async () => {
    const res = await fetch('http://localhost:3000/api/stream/proxy?url=https://httpbin.org/get');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
  });

  console.log('\n6. Testing Headless Chrome Playback, Multi-Source Switching & Modals...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  await testAsync('Home page loads with title', async () => {
    const title = await page.title();
    assert(title.includes('HiAnime.to'), `Unexpected page title: ${title}`);
  });

  await testAsync('Clicking anime card opens player modal with real embed', async () => {
    await page.evaluate(() => document.querySelector('.anime-card').click());
    await new Promise(r => setTimeout(r, 1500));
    const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
    assert(isModalActive, 'Player modal did not open');
    const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
    assert(iframeSrc.includes('vidlink.pro') || iframeSrc.includes('vidsrc') || iframeSrc.includes('multiembed'), `Unexpected player src: ${iframeSrc}`);
  });

  await testAsync('Tab 3: Official Promo Preview renders native video player (Zero YouTube)', async () => {
    await page.evaluate(() => {
      const trailerTabBtn = document.querySelector('.player-tab-btn[data-tab="tab-trailer"]');
      if (trailerTabBtn) trailerTabBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const isNativeVideoPresent = await page.$eval('#trailerVideoPlayer', el => el.tagName === 'VIDEO');
    assert(isNativeVideoPresent, 'Native trailer video player is not present');
  });

  await testAsync('Custom Stream / Local File Modal opens and switches tabs cleanly', async () => {
    await page.evaluate(() => {
      const btn = document.getElementById('openCustomStreamModalBtn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const isModalVisible = await page.$eval('#customStreamModal', el => el.style.display !== 'none');
    assert(isModalVisible, 'Custom stream modal did not open');

    // Switch to local tab
    await page.evaluate(() => {
      const localTab = document.getElementById('tabCustomLocalBtn');
      if (localTab) localTab.click();
    });
    await new Promise(r => setTimeout(r, 300));
    const isLocalContentVisible = await page.$eval('#customLocalTabContent', el => el.style.display !== 'none');
    assert(isLocalContentVisible, 'Local tab content is not visible');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.getElementById('closeCustomStreamBtn');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    const isModalClosed = await page.$eval('#customStreamModal', el => el.style.display === 'none');
    assert(isModalClosed, 'Custom stream modal did not close');
  });

  await testAsync('Switching server to Archive.org triggers resolver', async () => {
    await page.evaluate(() => {
      const arcPill = document.querySelector('.server-pill[data-server="archive-stream"]');
      if (arcPill) arcPill.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    const activeServer = await page.$eval('.server-pill.active', el => el.dataset.server);
    assert.strictEqual(activeServer, 'archive-stream');
  });

  await browser.close();

  console.log('\n====================================================');
  console.log(`v11.0 Verification Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
})().catch(e => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
