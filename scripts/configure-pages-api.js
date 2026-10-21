const { execSync } = require('child_process');

// 1. Extract GitHub Token from git credential fill
function getGitToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8'
    });
    const match = creds.match(/password=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (err) {
    console.warn('Failed to extract token from git credential fill:', err.message);
  }
  return null;
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || getGitToken();

if (!token) {
  console.error('No GitHub token found in environment or git credential helper.');
  process.exit(1);
}

console.log('GitHub Token found successfully.');

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.github.com/${endpoint.replace(/^\//, '')}`;
  const options = {
    method,
    headers: {
      'User-Agent': 'HiAnime-Pages-Automator',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

(async () => {
  console.log('\n--- Checking Current GitHub Pages Configuration ---');
  let current = await apiRequest('repos/Hubg50we/localweb/pages');
  console.log('Current status:', current.status, current.data?.status || current.data?.message);

  if (current.status === 404) {
    console.log('\n--- GitHub Pages not enabled. Enabling via POST ---');
    const enableRes = await apiRequest('repos/Hubg50we/localweb/pages', 'POST', {
      source: {
        branch: 'main',
        path: '/docs'
      }
    });
    console.log('POST Response:', enableRes.status, enableRes.data);
  } else {
    console.log('\n--- GitHub Pages already exists. Updating via PUT to main /docs ---');
    const updateRes = await apiRequest('repos/Hubg50we/localweb/pages', 'PUT', {
      source: {
        branch: 'main',
        path: '/docs'
      },
      build_type: 'legacy'
    });
    console.log('PUT Response:', updateRes.status, updateRes.data?.status || updateRes.data?.message || updateRes.data);
  }

  console.log('\n--- Polling GitHub Pages Deployment Status ---');
  let attempts = 0;
  const maxAttempts = 20;
  let verifiedUrl = null;

  while (attempts < maxAttempts) {
    attempts++;
    const check = await apiRequest('repos/Hubg50we/localweb/pages');
    const pageUrl = check.data?.html_url || 'https://hubg50we.github.io/localweb/';
    const buildStatus = check.data?.status;

    let httpStatus = 0;
    try {
      const pageRes = await fetch(pageUrl, { method: 'HEAD' });
      httpStatus = pageRes.status;
    } catch (_) {}

    console.log(`[Attempt ${attempts}/${maxAttempts}] Pages Build Status: ${buildStatus} | HTTP Status: ${httpStatus} | URL: ${pageUrl}`);

    if (httpStatus === 200) {
      verifiedUrl = pageUrl;
      console.log(`\n🎉 SUCCESS! GitHub Pages is live and returning HTTP 200.`);
      console.log(`Verified Live URL: ${verifiedUrl}`);
      break;
    }

    await new Promise(r => setTimeout(r, 4000));
  }

  if (!verifiedUrl) {
    console.log('Finished polling. Final check:');
    const finalRes = await fetch('https://hubg50we.github.io/localweb/');
    console.log('Direct fetch status:', finalRes.status);
    console.log('Live URL: https://hubg50we.github.io/localweb/');
  }
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
