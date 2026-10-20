const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to GitHub Pages https://hubg50we.github.io/localweb/...');
  await page.goto('https://hubg50we.github.io/localweb/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.anime-card', { timeout: 10000 });

  console.log('Clicking first anime card...');
  await page.click('.anime-card');
  await new Promise(r => setTimeout(r, 2500));

  const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
  const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
  const videoStyle = await page.$eval('#animeEmbedPlayer', el => window.getComputedStyle(el).display);
  const notice = await page.$eval('#streamActiveServerNotice', el => el.innerText);

  console.log('Player modal active:', isModalActive);
  console.log('Iframe src:', iframeSrc);
  console.log('Iframe display style:', videoStyle);
  console.log('Notice:', notice);

  console.log('\nAll Console logs during player open:');
  consoleMessages.forEach(m => console.log(`  [${m.type}] ${m.text}`));

  await browser.close();
})().catch(e => console.error(e));
