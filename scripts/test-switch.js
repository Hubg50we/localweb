const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.click('.anime-card');
  await new Promise(r => setTimeout(r, 1500));

  console.log('Before switch:');
  console.log('  Iframe src:', await page.$eval('#animeEmbedPlayer', el => el.src));
  console.log('  Notice:', await page.$eval('#streamActiveServerNotice', el => el.innerText));

  // Trigger click
  console.log('Clicking streamQuickSwitchBtn...');
  await page.evaluate(() => document.getElementById('streamQuickSwitchBtn').click());
  await new Promise(r => setTimeout(r, 1000));

  console.log('After switch 1:');
  console.log('  Iframe src:', await page.$eval('#animeEmbedPlayer', el => el.src));
  console.log('  Notice:', await page.$eval('#streamActiveServerNotice', el => el.innerText));

  // Trigger click 2
  console.log('Clicking streamQuickSwitchBtn second time...');
  await page.evaluate(() => document.getElementById('streamQuickSwitchBtn').click());
  await new Promise(r => setTimeout(r, 1000));

  console.log('After switch 2:');
  console.log('  Iframe src:', await page.$eval('#animeEmbedPlayer', el => el.src));
  console.log('  Notice:', await page.$eval('#streamActiveServerNotice', el => el.innerText));

  await browser.close();
})().catch(e => console.error(e));
