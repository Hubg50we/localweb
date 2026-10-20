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

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });

  await page.waitForSelector('.anime-card', { timeout: 5000 });
  const cardCount = await page.$$eval('.anime-card', els => els.length);
  console.log('Found anime cards count:', cardCount);

  console.log('Clicking first anime card...');
  await page.click('.anime-card');
  await new Promise(r => setTimeout(r, 2000));

  const isModalActive = await page.$eval('#playerModal', el => el.classList.contains('active'));
  const iframeSrc = await page.$eval('#animeEmbedPlayer', el => el.src);
  const noticeText = await page.$eval('#streamActiveServerNotice', el => el.innerText);
  console.log('Modal active:', isModalActive);
  console.log('Iframe src (Initial):', iframeSrc);
  console.log('Notice text (Initial):', noticeText);

  // Test Quick Switch Button
  console.log('\nClicking Quick Switch Server button...');
  await page.click('#streamQuickSwitchBtn');
  await new Promise(r => setTimeout(r, 1000));

  const iframeSrcAfter = await page.$eval('#animeEmbedPlayer', el => el.src);
  const noticeTextAfter = await page.$eval('#streamActiveServerNotice', el => el.innerText);
  console.log('Iframe src (After Switch):', iframeSrcAfter);
  console.log('Notice text (After Switch):', noticeTextAfter);

  // Take screenshot of open player
  await page.screenshot({ path: 'player-working-test.png' });
  console.log('Screenshot saved to player-working-test.png');

  // Test Mini Player Button
  console.log('\nTesting Mini-Player button...');
  await page.click('#miniPlayerBtn');
  await new Promise(r => setTimeout(r, 1000));
  const isMiniPlayerActive = await page.$eval('#floatingMiniPlayer', el => el.classList.contains('active'));
  console.log('Mini Player active:', isMiniPlayerActive);

  const errorLogs = logs.filter(l => l.type === 'error');
  console.log('\nError logs count:', errorLogs.length);
  errorLogs.forEach(l => console.log('  [ERROR]', l.text));

  await browser.close();
})().catch(e => console.error(e));
