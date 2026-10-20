const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', e => logs.push({ type: 'error', text: e.message }));

  const filePath = 'file:///' + path.resolve('docs/index.html').replace(/\\/g, '/');
  console.log('Navigating to static docs/index.html:', filePath);
  await page.goto(filePath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  const cardCount = await page.$$eval('.anime-card', els => els.length);
  console.log('Static anime cards count:', cardCount);

  console.log('Clicking anime card in static mode...');
  await page.click('.anime-card');
  await new Promise(r => setTimeout(r, 1500));

  const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
  const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
  console.log('Static modal active:', isModalActive);
  console.log('Static iframe src:', iframeSrc);

  const errors = logs.filter(l => l.type === 'error');
  console.log('Static page errors count:', errors.length);
  errors.forEach(e => console.log('  [STATIC ERROR]', e.text));

  await browser.close();
})().catch(e => console.error(e));
