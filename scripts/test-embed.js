const puppeteer = require('puppeteer-core');
const fs = require('fs');

fs.writeFileSync('public/test-vidlink-iframe.html', `<!DOCTYPE html>
<html>
<body style="margin:0;background:#000;">
  <iframe id="testFrame" src="https://vidlink.pro/anime/52299/1/sub?fallback=true" style="width:100vw;height:100vh;border:none;" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
</body>
</html>`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.text()));
  page.on('pageerror', e => logs.push('PAGE ERR: ' + e.message));

  console.log('Navigating to http://localhost:3000/test-vidlink-iframe.html ...');
  await page.goto('http://localhost:3000/test-vidlink-iframe.html', { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Goto err:', e.message));
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'vidlink-iframe-render.png' });
  console.log('Screenshot saved to vidlink-iframe-render.png');

  const frames = page.frames();
  console.log('Total frames:', frames.length);
  for (let i = 0; i < frames.length; i++) {
    console.log(`Frame ${i} URL:`, frames[i].url());
  }

  console.log('Logs:', logs);
  await browser.close();
  try { fs.unlinkSync('public/test-vidlink-iframe.html'); } catch(_) {}
})().catch(e => console.error(e));
