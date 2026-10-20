const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to GitHub Pages https://hubg50we.github.io/localweb/...');
  const res = await page.goto('https://hubg50we.github.io/localweb/', { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => ({ status: () => e.message }));

  console.log('HTTP Status:', res && typeof res.status === 'function' ? res.status() : 'unknown');
  console.log('Page Title:', await page.title());
  console.log('Console Messages count:', consoleMessages.length);
  consoleMessages.forEach(m => console.log(`  [${m.type}] ${m.text}`));

  const cardCount = await page.$$eval('.anime-card', cards => cards.length).catch(() => 0);
  console.log('Rendered anime cards count:', cardCount);

  await page.screenshot({ path: 'github-pages-test.png' });
  console.log('Screenshot saved to github-pages-test.png');
  await browser.close();
})().catch(e => console.error('PUPPETEER ERROR:', e));
