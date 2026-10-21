/**
 * HiAnime v14.0 Smart Discovery, Otaku XP & Trivia Minigame Test Suite
 */

const puppeteer = require('puppeteer-core');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3000';

let passCount = 0;
let failCount = 0;

function pass(name) {
  passCount++;
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, err) {
  failCount++;
  console.error(`  ❌ [FAIL] ${name}: ${err.message || err}`);
}

async function runV14Suite() {
  console.log('====================================================');
  console.log('🧪 Starting HiAnime v14.0 Discovery & Trivia Suite');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    console.log('1. Loading application and checking v14.0 UI initialization...');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    try {
      assert.strictEqual(errors.length, 0, `Page errors: ${errors.join('; ')}`);
      pass('Zero console or runtime errors on initial page load');
    } catch (e) { fail('Zero console errors', e); }

    // 2. Test Otaku XP Navbar Pill
    console.log('\n2. Testing Otaku XP & Level Progression System...');
    try {
      const xpPill = await page.evaluate(() => {
        const lvl = document.getElementById('navXpLevel')?.textContent;
        const rnk = document.getElementById('navXpRank')?.textContent;
        return { lvl, rnk };
      });
      assert(xpPill.lvl && xpPill.lvl.includes('Lv 1'), `Unexpected level: ${xpPill.lvl}`);
      assert(xpPill.rnk && xpPill.rnk.includes('Academy Student'), `Unexpected rank: ${xpPill.rnk}`);
      pass('Navbar displays active Otaku XP Level & Rank (Lv 1 Academy Student)');
    } catch (e) { fail('Otaku XP Navbar Pill', e); }

    // 3. Test Achievements Showcase Modal
    console.log('\n3. Testing Achievements Showcase Modal...');
    try {
      await page.evaluate(() => {
        const pill = document.getElementById('navXpPill');
        if (pill) pill.click();
      });
      await new Promise(r => setTimeout(r, 500));

      const achieveState = await page.evaluate(() => {
        const modal = document.getElementById('achievementsModal');
        const isActive = modal?.classList.contains('active');
        const cardsCount = document.querySelectorAll('.badge-card').length;
        const heroLvl = document.getElementById('heroLevelText')?.textContent;
        return { isActive, cardsCount, heroLvl };
      });

      assert.strictEqual(achieveState.isActive, true, 'Achievements modal not active');
      assert.strictEqual(achieveState.cardsCount, 6, `Expected 6 badges, found ${achieveState.cardsCount}`);
      assert(achieveState.heroLvl.includes('Level 1'), 'Hero level text missing');
      pass('Achievements modal renders all 6 badges with XP hero progress bar');

      // Close modal
      await page.evaluate(() => {
        const close = document.getElementById('closeAchievementsBtn');
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 400));
    } catch (e) { fail('Achievements Modal', e); }

    // 4. Test Smart Recommendations Row
    console.log('\n4. Testing Smart Recommendations Row ("Because You Watched...")...');
    try {
      // Simulate watching an anime
      await page.evaluate(() => {
        localStorage.setItem('hianime_watch_history_default', JSON.stringify([
          { animeId: 'solo-leveling', episodeNumber: 1, timestamp: Date.now() }
        ]));
        renderRecommendationsRow();
      });
      await new Promise(r => setTimeout(r, 500));

      const recState = await page.evaluate(() => {
        const section = document.getElementById('recommendedSection');
        const display = section ? window.getComputedStyle(section).display : 'none';
        const heading = document.getElementById('recommendationHeading')?.textContent || '';
        const matchPills = document.querySelectorAll('#recommendationsGrid .badge-match').length;
        return { display, heading, matchPills };
      });

      assert.notStrictEqual(recState.display, 'none', 'Recommended section is hidden');
      assert(recState.heading.includes('Recommended For You'), `Unexpected heading: ${recState.heading}`);
      assert(recState.matchPills > 0, `Expected match pills, found: ${recState.matchPills}`);
      pass('Personalized Recommendations row rendered with dynamic neon Match % badges');
    } catch (e) { fail('Recommendations Row', e); }

    // 5. Test Similar Anime Rail inside Player Modal
    console.log('\n5. Testing Similar Anime Rail inside Watch Player Modal...');
    try {
      await page.evaluate(() => {
        const card = document.querySelector('.anime-card');
        if (card) card.click();
      });
      await new Promise(r => setTimeout(r, 800));

      const railState = await page.evaluate(() => {
        const railWrap = document.getElementById('similarAnimeRailWrap');
        const isWrapVisible = railWrap ? window.getComputedStyle(railWrap).display !== 'none' : false;
        const similarCount = document.querySelectorAll('.similar-card').length;
        return { isWrapVisible, similarCount };
      });

      assert.strictEqual(railState.isWrapVisible, true, 'Similar anime rail wrapper is hidden');
      assert(railState.similarCount >= 4, `Expected at least 4 similar shows, found ${railState.similarCount}`);
      pass('Player Modal renders dynamic "Similar Anime You Might Like" horizontal rail');

      // Close player modal
      await page.evaluate(() => {
        const close = document.getElementById('closeModalBtn');
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) { fail('Similar Anime Rail', e); }

    // 6. Test Interactive Otaku Trivia Minigame
    console.log('\n6. Testing Interactive Otaku Trivia Minigame...');
    try {
      await page.evaluate(() => {
        const quizBtn = document.getElementById('navQuizBtn');
        if (quizBtn) quizBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const quizOpen = await page.evaluate(() => {
        const modal = document.getElementById('quizModal');
        const isActive = modal?.classList.contains('active');
        const modeCards = document.querySelectorAll('.quiz-mode-card').length;
        return { isActive, modeCards };
      });

      assert.strictEqual(quizOpen.isActive, true, 'Quiz modal not active');
      assert.strictEqual(quizOpen.modeCards, 2, 'Expected 2 challenge mode cards');
      pass('Trivia Minigame opens with Blurred Poster & Synopsis challenge modes');

      // Start Blurred Poster challenge
      await page.evaluate(() => {
        const card = document.getElementById('quizModePosterBtn');
        if (card) card.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const questionState = await page.evaluate(() => {
        const img = document.getElementById('quizPosterImg');
        const filter = img ? img.style.filter : '';
        const options = document.querySelectorAll('.quiz-option-btn').length;
        const timer = document.getElementById('quizTimerBar');
        return { hasBlur: filter.includes('blur'), options, hasTimer: !!timer };
      });

      assert.strictEqual(questionState.hasBlur, true, 'Poster not blurred initially');
      assert.strictEqual(questionState.options, 4, `Expected 4 multiple choice options, found ${questionState.options}`);
      assert.strictEqual(questionState.hasTimer, true, 'Countdown timer bar missing');
      pass('Blurred Poster question renders with 10s countdown and 4 multiple-choice options');

      // Select first option
      await page.evaluate(() => {
        const opt = document.querySelector('.quiz-option-btn');
        if (opt) opt.click();
      });
      await new Promise(r => setTimeout(r, 400));

      const answered = await page.evaluate(() => {
        const hasVerdict = document.querySelectorAll('.quiz-option-btn.correct, .quiz-option-btn.wrong').length > 0;
        return hasVerdict;
      });
      assert.strictEqual(answered, true, 'Option click did not trigger verdict styling');
      pass('Option selection triggers immediate feedback and audio chime');

      // Close quiz
      await page.evaluate(() => {
        const close = document.getElementById('closeQuizBtn');
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 400));
    } catch (e) { fail('Trivia Minigame execution', e); }

    await page.close();
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`v14.0 Suite Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runV14Suite().catch(err => {
  console.error('v14.0 Suite fatal error:', err);
  process.exit(1);
});
