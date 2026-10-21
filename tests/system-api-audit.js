const http = require('http');

const PORT = 3000;
const BASE = `http://localhost:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve) => {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message, body: null, json: null });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runSystemApiAudit() {
  console.log('====================================================');
  console.log('🔍 Comprehensive System API Health & Resilience Audit');
  console.log('====================================================\n');

  const tests = [
    { name: 'GET /api/health', path: '/api/health' },
    { name: 'GET /api/anime', path: '/api/anime' },
    { name: 'GET /api/anime?q=solo', path: '/api/anime?q=solo' },
    { name: 'GET /api/anime?genre=Action', path: '/api/anime?genre=Action' },
    { name: 'GET /api/anime?sort=score', path: '/api/anime?sort=score' },
    { name: 'GET /api/anime/spotlight', path: '/api/anime/spotlight' },
    { name: 'GET /api/anime/top10', path: '/api/anime/top10' },
    { name: 'GET /api/anime/solo-leveling', path: '/api/anime/solo-leveling' },
    { name: 'GET /api/anime/solo-leveling/episode/1/servers', path: '/api/anime/solo-leveling/episode/1/servers' },
    { name: 'GET /api/stream/solo-leveling/1', path: '/api/stream/solo-leveling/1' },
    { name: 'GET /api/sources/archive?title=Solo+Leveling&ep=1', path: '/api/sources/archive?title=Solo+Leveling&ep=1' },
    { name: 'GET /api/stream/proxy (cors check)', path: '/api/stream/proxy?url=' + encodeURIComponent('https://httpbin.org/get') },
    { name: 'GET /api/providers', path: '/api/providers' },
    { name: 'GET /api/live/schedule', path: '/api/live/schedule' },
    { name: 'GET /api/party/audit-room/messages', path: '/api/party/audit-room/messages' },
    { 
      name: 'POST /api/party/audit-room/messages', 
      path: '/api/party/audit-room/messages',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { user: 'SystemAuditBot', text: 'API Audit ping', ep: 1, time: 42 }
      }
    },
    { name: 'GET /api/ani-cli/info', path: '/api/ani-cli/info' },
    { name: 'GET /api/ani-cli/search?q=Naruto', path: '/api/ani-cli/search?q=Naruto' },
    { name: 'GET /api/manga/solo-leveling/chapters', path: '/api/manga/solo-leveling/chapters' },
    { name: 'GET /api/manga/solo-leveling/chapter/1/pages', path: '/api/manga/solo-leveling/chapter/1/pages' },
    { name: 'GET /api/airing/countdowns', path: '/api/airing/countdowns' },
    { name: 'GET /manifest.json', path: '/manifest.json' },
    { name: 'GET /sw.js', path: '/sw.js' }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const res = await request(t.path, t.options);
    const ok = res.status >= 200 && res.status < 400;
    if (ok) {
      console.log(`  ✅ [PASS] ${t.name} -> HTTP ${res.status}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${t.name} -> HTTP ${res.status}:`, res.body ? res.body.substring(0, 100) : res.error);
      failed++;
    }
  }

  // Also test Admin CRUD workflow
  console.log('\nTesting Admin CRUD System API:');
  const testId = `sys-audit-${Date.now()}`;
  const postRes = await request('/api/admin/anime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      title: 'System Audit Show',
      type: 'TV Series',
      subEpisodes: 12,
      status: 'Currently Airing',
      genres: ['Action', 'Sci-Fi'],
      synopsis: 'API test'
    }
  });

  if (postRes.status === 201 && postRes.json && postRes.json.success) {
    console.log('  ✅ [PASS] POST /api/admin/anime -> HTTP 201 (Created)');
    passed++;
    const createdId = postRes.json.data.id;

    const putRes = await request(`/api/admin/anime/${encodeURIComponent(createdId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'System Audit Show Updated' }
    });
    if (putRes.status === 200) {
      console.log('  ✅ [PASS] PUT /api/admin/anime/:id -> HTTP 200 (Updated)');
      passed++;
    } else {
      console.error('  ❌ [FAIL] PUT /api/admin/anime/:id -> HTTP ' + putRes.status);
      failed++;
    }

    const delRes = await request(`/api/admin/anime/${encodeURIComponent(createdId)}`, {
      method: 'DELETE'
    });
    if (delRes.status === 200) {
      console.log('  ✅ [PASS] DELETE /api/admin/anime/:id -> HTTP 200 (Deleted)');
      passed++;
    } else {
      console.error('  ❌ [FAIL] DELETE /api/admin/anime/:id -> HTTP ' + delRes.status);
      failed++;
    }
  } else {
    console.error('  ❌ [FAIL] POST /api/admin/anime -> HTTP ' + postRes.status);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`System API Audit Complete: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runSystemApiAudit();
