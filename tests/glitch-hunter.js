/**
 * HiAnime Automated Headless Browser Glitch, Stress & Invariant Crawler
 * Multi-Viewport: Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
 */

const puppeteer = require('puppeteer-core');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 812 }
];

let totalPassed = 0;
let totalFailed = 0;

function pass(name) {
  totalPassed++;
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, err) {
  totalFailed++;
  console.error(`  ❌ [FAIL] ${name}: ${err.message || err}`);
}

async function runGlitchHunter() {
  console.log('====================================================');
  console.log('🕷️ HiAnime Glitch Hunter & UI Stress Crawler Suite');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      const runtimeErrors = [];
      const networkFailures = [];

      page.on('pageerror', err => runtimeErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') runtimeErrors.push(msg.text());
      });
      page.on('requestfailed', req => {
        // Ignore external ads/trackers or aborted requests if any
        if (req.url().includes('localhost:3000')) {
          networkFailures.push(`${req.url()} (${req.failure()?.errorText})`);
        }
      });

      await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1200));

      // 1. Runtime & Network error traps
      try {
        assert.strictEqual(runtimeErrors.length, 0, `Runtime errors detected: ${runtimeErrors.join('; ')}`);
        pass(`${vp.name}: Zero runtime or console errors on load`);
      } catch (e) { fail(`${vp.name}: Runtime error check`, e); }

      try {
        assert.strictEqual(networkFailures.length, 0, `Local network failures: ${networkFailures.join('; ')}`);
        pass(`${vp.name}: Zero failed local network requests`);
      } catch (e) { fail(`${vp.name}: Network failure check`, e); }

      // 2. Visual & CSS Layout: Horizontal Overflow Check
      try {
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        assert.strictEqual(overflow, false, `Page horizontally overflows viewport (${vp.width}px)`);
        pass(`${vp.name}: Zero horizontal overflow (scrollWidth <= innerWidth)`);
      } catch (e) { fail(`${vp.name}: Horizontal overflow check`, e); }

      // 3. Broken image check
      try {
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.filter(img => img.complete && img.naturalWidth === 0 && !img.src.includes('data:image')).length;
        });
        assert.strictEqual(brokenImages, 0, `${brokenImages} broken images detected`);
        pass(`${vp.name}: Zero broken zero-dimension images`);
      } catch (e) { fail(`${vp.name}: Broken image check`, e); }

      // 4. Modal z-index hierarchy and scroll lock
      try {
        await page.evaluate(() => {
          const card = document.querySelector('.anime-card');
          if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 800));

        const modalState = await page.evaluate(() => {
          const modal = document.getElementById('playerModal');
          const isModalActive = modal?.classList.contains('active');
          const isBodyLocked = document.body.classList.contains('modal-open') || window.getComputedStyle(document.body).overflow === 'hidden';
          return { isModalActive, isBodyLocked };
        });

        assert.strictEqual(modalState.isModalActive, true, 'Player modal did not open');
        assert.strictEqual(modalState.isBodyLocked, true, 'Body scroll was not locked when modal opened');
        pass(`${vp.name}: Player modal opens with body scroll lock`);

        // Close modal
        await page.evaluate(() => {
          const closeBtn = document.getElementById('closeModalBtn');
          if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 600));

        const scrollRestored = await page.evaluate(() => {
          return !document.body.classList.contains('modal-open') || window.getComputedStyle(document.body).overflow !== 'hidden';
        });
        assert.strictEqual(scrollRestored, true, 'Body scroll not restored after closing modal');
        pass(`${vp.name}: Body scroll cleanly restored on modal close`);
      } catch (e) { fail(`${vp.name}: Modal open/close scroll lock`, e); }

      await page.close();
    }

    // Stress & Race Condition Fuzzing Section (Desktop Viewport)
    console.log('\n--- UI Stress & Race Condition Fuzzing ---');
    const stressPage = await browser.newPage();
    await stressPage.setViewport({ width: 1920, height: 1080 });
    await stressPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // Stress 1: 10x Rapid Modal Open/Close & Ghost Audio Check
    try {
      console.log('  Testing 10x Rapid Player Modal Open & Close...');
      for (let i = 0; i < 10; i++) {
        await stressPage.evaluate(() => {
          const card = document.querySelector('.anime-card');
          if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 100));
        await stressPage.evaluate(() => {
          const closeBtn = document.getElementById('closeModalBtn');
          if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 100));
      }

      const ghostAudioCheck = await stressPage.evaluate(() => {
        const iframe = document.getElementById('animeEmbedPlayer');
        const video = document.getElementById('neonHlsPlayer');
        const modal = document.getElementById('playerModal');
        const iframeSrc = iframe ? iframe.src : '';
        const videoPaused = video ? video.paused : true;
        const modalActive = modal?.classList.contains('active');
        return {
          modalActive,
          iframeEmpty: iframeSrc === '' || iframeSrc === 'about:blank',
          videoPaused
        };
      });

      assert.strictEqual(ghostAudioCheck.modalActive, false, 'Modal left open after stress test');
      assert.strictEqual(ghostAudioCheck.iframeEmpty, true, `Ghost audio iframe still active: ${ghostAudioCheck.iframeEmpty}`);
      assert.strictEqual(ghostAudioCheck.videoPaused, true, 'Native video player still running');
      pass('10x Rapid Modal Open/Close stops all playback immediately (Zero Ghost Audio)');
    } catch (e) { fail('10x Rapid Modal Open/Close ghost audio', e); }

    // Stress 2: Rapid Clicking across Server Pills & Episode Buttons
    try {
      console.log('  Testing Rapid Episode & Server Pill Switches...');
      await stressPage.evaluate(() => {
        const card = document.querySelector('.anime-card');
        if (card) card.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Click servers rapidly
      await stressPage.evaluate(() => {
        const pills = document.querySelectorAll('.server-pill');
        pills.forEach(p => p.click());
      });
      await new Promise(r => setTimeout(r, 500));

      // Click episodes rapidly
      await stressPage.evaluate(() => {
        const next = document.getElementById('nextEpBtn');
        const prev = document.getElementById('prevEpBtn');
        if (next) { next.click(); next.click(); }
        if (prev) prev.click();
      });
      await new Promise(r => setTimeout(r, 600));

      const serverState = await stressPage.evaluate(() => {
        const activePills = document.querySelectorAll('.server-pill.active').length;
        const crumb = document.getElementById('modalEpCrumb')?.textContent || '';
        return { activePills, crumb };
      });

      assert(serverState.activePills <= 2, `Conflicting active server pills: ${serverState.activePills}`);
      assert(serverState.crumb.includes('Episode'), 'Episode crumb lost or corrupted');
      pass('Rapid Server & Episode switching handles async state transitions cleanly');

      // Close player
      await stressPage.evaluate(() => {
        const close = document.getElementById('closeModalBtn');
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) { fail('Rapid Episode/Server switches', e); }

    // Stress 3: Full Player to PiP Mini-Player transitions
    try {
      console.log('  Testing Full Player to PiP Mini-Player Transitions...');
      await stressPage.evaluate(() => {
        const card = document.querySelector('.anime-card');
        if (card) card.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Trigger minimize
      await stressPage.evaluate(() => {
        const minBtn = document.getElementById('miniPlayerBtn');
        if (minBtn) minBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));

      const miniState = await stressPage.evaluate(() => {
        const mini = document.getElementById('floatingMiniPlayer');
        const modal = document.getElementById('playerModal');
        return {
          miniDisplay: mini ? window.getComputedStyle(mini).display : 'none',
          modalActive: modal?.classList.contains('active')
        };
      });

      assert.strictEqual(miniState.modalActive, false, 'Modal remained active after minimize');
      assert.notStrictEqual(miniState.miniDisplay, 'none', 'Mini player failed to display');
      pass('Seamless transition from Full Modal to Floating PiP Mini-Player');

      // Expand back
      await stressPage.evaluate(() => {
        const expBtn = document.getElementById('miniExpandBtn');
        if (expBtn) expBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));

      // Close modal
      await stressPage.evaluate(() => {
        const close = document.getElementById('closeModalBtn');
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) { fail('Full Player to PiP Mini-Player', e); }

    // Stress 4: Corrupted LocalStorage Recovery
    try {
      console.log('  Testing Corrupted LocalStorage Recovery & Startup...');
      await stressPage.evaluate(() => {
        localStorage.setItem('hianime_watchlist', '{bad_json_123');
        localStorage.setItem('hianime_history', 'undefined');
        localStorage.setItem('hianime_profiles', 'null[invalid');
        localStorage.setItem('hianime_bookmarks', '{not_real:true');
      });

      await stressPage.reload({ waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 1200));

      const recovered = await stressPage.evaluate(() => {
        const title = document.title;
        const cardsCount = document.querySelectorAll('.anime-card').length;
        return { title, cardsCount };
      });

      assert(recovered.cardsCount > 0, 'Catalog failed to load after localStorage corruption');
      pass('App recovers gracefully from corrupted localStorage without crashes');
    } catch (e) { fail('Corrupted localStorage recovery', e); }

    await stressPage.close();
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`Crawler Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('====================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runGlitchHunter().catch(err => {
  console.error('Crawler fatal error:', err);
  process.exit(1);
});
