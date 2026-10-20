// HiAnime v5.0 Enterprise Automated Test & Verification Suite
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('🧪 Starting HiAnime v5.0 Enterprise Verification Suite');
console.log('====================================================\n');

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

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
    }
    req.end();
  });
}

async function runTests() {
  const TEST_PORT = 3199;
  process.env.PORT = TEST_PORT;

  // 1. Static File Integrity
  console.log('1. Checking File Existence & HTML Structure...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');
  assert(indexHtml.includes('id="commandPaletteModal"'), 'index.html contains Command Palette modal');
  assert(indexHtml.includes('id="adminStudioModal"'), 'index.html contains Admin Studio modal');
  assert(indexHtml.includes('id="otakuWrappedModal"'), 'index.html contains Otaku Wrapped modal');
  assert(indexHtml.includes('id="themePresetsPicker"'), 'index.html contains Theme Presets picker');
  assert(indexHtml.includes('sw.js') || fs.existsSync(path.join(__dirname, '..', 'public', 'sw.js')), 'sw.js exists in public root');

  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf-8');
  assert(css.includes('--accent-primary') && css.includes('body[data-theme="crimson"]'), 'style.css defines dynamic theme variables and presets');

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf-8');
  assert(appJs.includes('openCommandPalette') && appJs.includes('Ctrl+K'), 'app.js implements Command Palette logic');
  assert(appJs.includes('applyTheme') && appJs.includes('hianime_theme'), 'app.js implements Theme Switcher engine');
  assert(appJs.includes('handleAdminFormSubmit'), 'app.js implements Admin CMS Studio logic');
  assert(appJs.includes('openOtakuStats'), 'app.js implements Otaku Wrapped analytics');

  // 2. Start Server
  console.log('\n2. Booting Server for End-to-End API Checks...');
  let serverInstance;
  await new Promise((resolve) => {
    // Require server after setting PORT
    delete require.cache[require.resolve('../server.js')];
    const serverModule = require('../server.js');
    setTimeout(resolve, 800);
  });

  const base = `http://127.0.0.1:${TEST_PORT}`;

  try {
    // 3. Test Static Routes
    console.log('\n3. Testing Core Static Routes & Service Worker...');
    const homeRes = await request(`${base}/`);
    assert(homeRes.status === 200, 'GET / returns HTTP 200');

    const manifestRes = await request(`${base}/manifest.json`);
    assert(manifestRes.status === 200 && (manifestRes.headers['content-type'] || '').includes('manifest+json'), 'GET /manifest.json returns 200 with application/manifest+json');

    const swRes = await request(`${base}/sw.js`);
    assert(swRes.status === 200 && (swRes.headers['content-type'] || '').includes('javascript'), 'GET /sw.js returns 200 with application/javascript');

    // 4. Test Catalog APIs
    console.log('\n4. Testing Anime Catalog & Airing Schedule APIs...');
    const animeRes = await request(`${base}/api/anime`);
    assert(animeRes.status === 200 && animeRes.json && animeRes.json.count >= 50, `GET /api/anime returns 50+ shows (found: ${animeRes.json ? animeRes.json.count : 0})`);

    const spotlightRes = await request(`${base}/api/anime/spotlight`);
    assert(spotlightRes.status === 200 && Array.isArray(spotlightRes.json.data) && spotlightRes.json.data.length > 0, 'GET /api/anime/spotlight returns active featured shows');

    const schedRes = await request(`${base}/api/live/schedule?day=monday`);
    assert(schedRes.status === 200 && Array.isArray(schedRes.json.data) && schedRes.json.data.length > 0, 'GET /api/live/schedule returns airing schedule items');

    // 5. Test Watch Party
    console.log('\n5. Testing Watch Party Synchronization APIs...');
    const partyGet = await request(`${base}/api/party/V5TEST/messages?anime=solo-leveling&ep=1`);
    assert(partyGet.status === 200 && partyGet.json && partyGet.json.roomId === 'V5TEST', 'GET /api/party/:roomId/messages initializes room');

    const partyPost = await request(`${base}/api/party/V5TEST/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { user: 'TestUser', text: 'Hello v5', animeId: 'solo-leveling', episodeNum: 2, type: 'chat' }
    });
    assert(partyPost.status === 200 && partyPost.json && partyPost.json.success, 'POST /api/party/:roomId/messages sends message and syncs episode');

    // 6. Test Admin CMS Studio CRUD Endpoints
    console.log('\n6. Testing Admin CMS Studio CRUD Endpoints...');
    const testShowTitle = `v5-Automated-Test-${Date.now()}`;
    const createRes = await request(`${base}/api/admin/anime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: testShowTitle,
        type: 'TV Series',
        subEpisodes: 12,
        status: 'Currently Airing',
        genres: ['Action', 'Sci-Fi'],
        synopsis: 'Automated test anime creation verification.',
        spotlight: true
      }
    });
    assert(createRes.status === 201 && createRes.json && createRes.json.success, 'POST /api/admin/anime creates new show');
    const createdId = createRes.json && createRes.json.data && createRes.json.data.id;

    if (createdId) {
      const updateRes = await request(`${base}/api/admin/anime/${encodeURIComponent(createdId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: {
          title: `${testShowTitle}-Updated`,
          spotlight: false
        }
      });
      assert(updateRes.status === 200 && updateRes.json && updateRes.json.success && updateRes.json.data.title.includes('Updated'), 'PUT /api/admin/anime/:id updates existing show');

      const deleteRes = await request(`${base}/api/admin/anime/${encodeURIComponent(createdId)}`, {
        method: 'DELETE'
      });
      assert(deleteRes.status === 200 && deleteRes.json && deleteRes.json.success, 'DELETE /api/admin/anime/:id removes test show cleanly');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failCount++;
  }

  console.log('\n====================================================');
  console.log(`Suite Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
