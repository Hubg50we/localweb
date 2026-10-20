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

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  console.log('Page Title:', await page.title());
  console.log('Console Messages count:', consoleMessages.length);
  consoleMessages.forEach(m => console.log(`  [${m.type}] ${m.text}`));

  const firstCard = await page.$('.anime-card');
  console.log('First card found?', Boolean(firstCard));
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 1500));
    const isPlayerActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
    const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
    console.log('Player modal active?', isPlayerActive);
    console.log('Iframe src:', iframeSrc);
  }

  await page.screenshot({ path: 'test-page.png' });
  console.log('Screenshot saved to test-page.png');
  await browser.close();
})().catch(e => console.error('PUPPETEER ERROR:', e));
