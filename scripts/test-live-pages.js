const puppeteer = require('puppeteer-core');

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

  console.log('Navigating to https://hubg50we.github.io/localweb/ ...');
  await page.goto('https://hubg50we.github.io/localweb/', { waitUntil: 'networkidle2', timeout: 40000 });

  const cardCount = await page.$$eval('.anime-card', els => els.length);
  console.log('Online anime cards count:', cardCount);

  const spotlightBanner = await page.$eval('.spotlight-slide.active', el => el.style.backgroundImage);
  console.log('Active Spotlight Banner style:', spotlightBanner);

  console.log('Clicking first anime card...');
  await page.click('.anime-card');
  await new Promise(r => setTimeout(r, 2000));

  const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
  const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
  console.log('Modal active:', isModalActive);
  console.log('Player iframe src:', iframeSrc);

  const errors = logs.filter(l => l.type === 'error');
  console.log('Page errors count:', errors.length);
  errors.forEach(e => console.log('  [ERROR]', e.text));

  await browser.close();
  console.log('Done test successfully.');
})().catch(e => {
  console.error('Test failure:', e);
  process.exit(1);
});
