const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[PAGE ERROR] ${e.message}`));

  console.log('Navigating to live GitHub Pages...');
  await page.goto(`https://hubg50we.github.io/localweb/?ts=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 45000 });

  // Unregister old service worker and clean cache
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const r of registrations) {
        await r.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    localStorage.clear();
  });

  // Reload fresh
  await page.goto(`https://hubg50we.github.io/localweb/?ts=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 45000 });

  console.log('Title:', await page.title());
  const cardCount = await page.$$eval('.anime-card', els => els.length);
  console.log('Cards count:', cardCount);

  // Click on the first anime card
  await page.evaluate(() => {
    const card = document.querySelector('.anime-card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
  const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
  console.log('Modal active:', isModalActive);
  console.log('Player iframe src:', iframeSrc);

  // Check tab 2 cast
  await page.evaluate(() => {
    const castBtn = document.querySelector('.player-tab-btn[data-tab="tab-cast"]');
    if (castBtn) castBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const castCardsCount = await page.$$eval('.cast-card', els => els.length);
  console.log('Cast cards count in Tab 2:', castCardsCount);

  // Check tab 3 trailer
  await page.evaluate(() => {
    const trailerBtn = document.querySelector('.player-tab-btn[data-tab="tab-trailer"]');
    if (trailerBtn) trailerBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const trailerIframeSrc = await page.$eval('#trailerPlayerIframe', el => el.src);
  console.log('Trailer iframe src in Tab 3:', trailerIframeSrc);

  console.log('\nRelevant Browser Logs:');
  logs.slice(-15).forEach(l => console.log('  ', l));

  await browser.close();
  console.log('\nAll live tests finished cleanly!');
})().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
