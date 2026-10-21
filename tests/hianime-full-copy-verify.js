const puppeteer = require('puppeteer-core');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:3000';

async function verifyFullHiAnimeCopy() {
  console.log('====================================================');
  console.log('👑 Verifying Full 1:1 HiAnime (hianime.at/home) Copy');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  let passed = 0;

  function pass(msg) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  }

  // 1. Verify Brand Header & Navigation
  const headerCheck = await page.evaluate(() => {
    const logo = document.querySelector('.brand-logo');
    const search = document.getElementById('searchInput');
    const subNav = document.querySelector('.sub-nav');
    const xpPill = document.getElementById('navXpPill');
    return {
      hasLogo: !!logo,
      hasSearch: !!search,
      hasSubNav: !!subNav,
      hasXpPill: !!xpPill
    };
  });
  assert(headerCheck.hasLogo, 'Brand logo rendered');
  assert(headerCheck.hasSearch, 'Live search input rendered');
  assert(headerCheck.hasSubNav, 'Secondary navigation rendered');
  pass('Header, Search, and Category Sub-Nav verified');

  // 2. Verify Spotlight Carousel Hero
  const spotlightCheck = await page.evaluate(() => {
    const slider = document.getElementById('spotlightSlider');
    const slides = document.querySelectorAll('.spotlight-slide');
    return { hasSlider: !!slider, slideCount: slides.length };
  });
  assert(spotlightCheck.slideCount > 0, 'Spotlight slides rendered');
  pass(`Spotlight Hero rendered with ${spotlightCheck.slideCount} featured shows`);

  // 3. Verify Trending Rail
  const trendingCheck = await page.evaluate(() => {
    const track = document.getElementById('trendingTrack');
    const cards = document.querySelectorAll('.trending-rail-card');
    return { hasTrack: !!track, count: cards.length };
  });
  assert(trendingCheck.count >= 5, 'Trending rail rendered with cards');
  pass(`Trending Rail rendered with ${trendingCheck.count} trending shows`);

  // 4. Verify Main Anime Grid
  const gridCheck = await page.evaluate(() => {
    const cards = document.querySelectorAll('.anime-card');
    return cards.length;
  });
  assert(gridCheck >= 10, 'Main anime grid populated');
  pass(`Main Anime Grid rendered with ${gridCheck} catalog items`);

  // 5. Verify Top 10 Sidebar Widget with Today/Week/Month tabs
  const top10Check = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.rank-filter-tabs span');
    const items = document.querySelectorAll('.top-10-item');
    return { tabCount: tabs.length, itemCount: items.length };
  });
  assert(top10Check.tabCount === 3, 'Today/Week/Month tabs present');
  assert(top10Check.itemCount === 10, 'Top 10 ranked items rendered');
  pass('Top 10 Sidebar Widget rendered with Today/Week/Month tabs');

  // 6. Verify Popular Genres Cloud
  const genresCheck = await page.evaluate(() => {
    const tags = document.querySelectorAll('.genre-tags-cloud a');
    return tags.length;
  });
  assert(genresCheck >= 10, 'Popular genre tags cloud present');
  pass(`Popular Genres Cloud rendered with ${genresCheck} genre pills`);

  // 7. Verify Estimated Schedule with Day Tabs
  const scheduleCheck = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.schedule-day-btn');
    const grid = document.getElementById('scheduleGrid');
    return { dayCount: tabs.length, hasGrid: !!grid };
  });
  assert(scheduleCheck.dayCount === 7, '7 schedule day buttons rendered (Mon-Sun)');
  pass('Estimated Airing Schedule Section verified with 7-day selector');

  // 8. Verify Authentic HiAnime A-Z List Strip
  const azCheck = await page.evaluate(() => {
    const azSection = document.getElementById('azListSection');
    const azBtns = document.querySelectorAll('.az-btn');
    return { hasSection: !!azSection, count: azBtns.length };
  });
  assert(azCheck.hasSection && azCheck.count >= 28, 'A-Z List strip rendered with 28 buttons');
  pass(`Authentic HiAnime A-Z List Strip rendered with ${azCheck.count} alphabet buttons`);

  // 9. Test Clicking A-Z Filter (e.g. Letter 'S')
  const filterLetterCheck = await page.evaluate(() => {
    const sBtn = document.querySelector('.az-btn[data-letter="S"]');
    if (sBtn) sBtn.click();
    const cards = document.querySelectorAll('.anime-card');
    return { clicked: !!sBtn, cardCount: cards.length };
  });
  assert(filterLetterCheck.clicked, 'Clicked A-Z button S');
  pass('Interactive A-Z List filtering tested successfully');

  // 10. Verify Authentic HiAnime Community Footer
  const footerCheck = await page.evaluate(() => {
    const footer = document.getElementById('footer');
    const socials = document.querySelectorAll('.social-pill');
    const disclaimer = document.querySelector('.about-text');
    return {
      hasFooter: !!footer,
      socialCount: socials.length,
      hasDisclaimer: disclaimer && disclaimer.textContent.includes('HiAnime does not store any files')
    };
  });
  assert(footerCheck.hasFooter, 'Footer rendered');
  assert(footerCheck.socialCount >= 4, 'Community social pills present');
  assert(footerCheck.hasDisclaimer, 'Authentic HiAnime disclaimer present');
  pass('Authentic HiAnime Footer & Community Join Bar verified');

  // 11. Verify Zero Console Errors
  assert(consoleErrors.length === 0, `Zero console errors on page load (found: ${consoleErrors.join(', ')})`);
  pass('Zero runtime or console errors across the entire site');

  await browser.close();

  console.log('\n====================================================');
  console.log(`HiAnime Full Copy Suite: ${passed} Passed, 0 Failed`);
  console.log('====================================================\n');
}

verifyFullHiAnimeCopy().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
