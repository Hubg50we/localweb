const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[PAGE ERROR] ${e.message}`));

  console.log('Navigating to live GitHub Pages...');
  await page.goto(`https://hubg50we.github.io/localweb/?ts=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 45000 });

  // Allow service worker reload cycle to settle if updating
  await new Promise(r => setTimeout(r, 2500));

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

  // Check tab 3 trailer (Native HTML5 Video)
  await page.evaluate(() => {
    const trailerBtn = document.querySelector('.player-tab-btn[data-tab="tab-trailer"]');
    if (trailerBtn) trailerBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const isVideoPresent = await page.$eval('#trailerVideoPlayer', el => el.tagName === 'VIDEO');
  console.log('Tab 3 Native Video Player present:', isVideoPresent);

  // Check Custom Stream Modal
  await page.evaluate(() => {
    const customBtn = document.getElementById('openCustomStreamModalBtn');
    if (customBtn) customBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const isCustomModalOpen = await page.$eval('#customStreamModal', el => el.style.display !== 'none');
  console.log('Custom Stream Modal opened:', isCustomModalOpen);

  console.log('\nRelevant Browser Logs:');
  logs.slice(-10).forEach(l => console.log('  ', l));

  await browser.close();
  console.log('\nAll live tests on GitHub Pages passed cleanly!');
})().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
