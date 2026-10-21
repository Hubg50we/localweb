// HiAnime Client Application State
let currentAnimeList = [];
let currentSpotlights = [];
let activeSpotlightIndex = 0;
let spotlightInterval = null;
let currentPlayingAnime = null;
let currentPlayingEpisode = 1;
let currentServer = 'vidsrc-sub';

// Netflix Multi-Profile Storage System
const DEFAULT_PROFILES = [
  { id: 'p_default', name: 'Otaku Explorer', avatar: 'otaku', isKid: false },
  { id: 'p_hashira', name: 'Anime Hashira', avatar: 'slayer', isKid: false },
  { id: 'p_chibi', name: 'Chibi Fan', avatar: 'chibi', isKid: true }
];

let profiles = JSON.parse(localStorage.getItem('hianime_profiles') || 'null');
if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
  profiles = DEFAULT_PROFILES;
  localStorage.setItem('hianime_profiles', JSON.stringify(profiles));
}

let activeProfileId = localStorage.getItem('hianime_active_profile') || 'p_default';
if (!profiles.some(p => p.id === activeProfileId)) {
  activeProfileId = profiles[0].id;
  localStorage.setItem('hianime_active_profile', activeProfileId);
}

function getActiveProfile() {
  return profiles.find(p => p.id === activeProfileId) || profiles[0];
}

function loadProfileWatchlist() {
  const key = `hianime_watchlist_${activeProfileId}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) return JSON.parse(saved);
  if (activeProfileId === 'p_default') {
    const legacy = localStorage.getItem('hianime_watchlist');
    if (legacy) return JSON.parse(legacy);
  }
  return [];
}

function saveProfileWatchlist(list) {
  watchlist = list;
  localStorage.setItem(`hianime_watchlist_${activeProfileId}`, JSON.stringify(list));
  if (activeProfileId === 'p_default') {
    localStorage.setItem('hianime_watchlist', JSON.stringify(list));
  }
}

function loadProfileWatchHistory() {
  const key = `hianime_watch_history_${activeProfileId}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) return JSON.parse(saved);
  if (activeProfileId === 'p_default') {
    const legacy = localStorage.getItem('hianime_watch_history');
    if (legacy) return JSON.parse(legacy);
  }
  return [];
}

function saveProfileWatchHistory(list) {
  watchHistory = list;
  localStorage.setItem(`hianime_watch_history_${activeProfileId}`, JSON.stringify(list));
  if (activeProfileId === 'p_default') {
    localStorage.setItem('hianime_watch_history', JSON.stringify(list));
  }
}

let watchlist = loadProfileWatchlist();
let watchHistory = loadProfileWatchHistory();

// DOM Elements
const spotlightSlider = document.getElementById('spotlightSlider');
const sliderDots = document.getElementById('sliderDots');
const sliderPrev = document.getElementById('sliderPrev');
const sliderNext = document.getElementById('sliderNext');
const trendingTrack = document.getElementById('trendingTrack');
const railPrev = document.getElementById('railPrev');
const railNext = document.getElementById('railNext');
const animeGrid = document.getElementById('animeGrid');
const top10List = document.getElementById('top10List');
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const randomAnimeBtn = document.getElementById('randomAnimeBtn');
const watchlistBtn = document.getElementById('watchlistBtn');
const watchlistCount = document.getElementById('watchlistCount');
const watchlistDrawer = document.getElementById('watchlistDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const watchlistItems = document.getElementById('watchlistItems');
const continueWatchingSection = document.getElementById('continueWatchingSection');
const continueWatchingTrack = document.getElementById('continueWatchingTrack');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Player Modal Elements
const playerModal = document.getElementById('playerModal');
const playerOverlay = document.getElementById('playerOverlay');
const lightsOffOverlay = document.getElementById('lightsOffOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalAnimeTitle = document.getElementById('modalAnimeTitle');
const modalEpCrumb = document.getElementById('modalEpCrumb');
const animeEmbedPlayer = document.getElementById('animeEmbedPlayer');
const animeVideoPlayer = document.getElementById('neonHlsPlayer') || document.getElementById('animeVideoPlayer');
const modalScore = document.getElementById('modalScore');
const modalType = document.getElementById('modalType');
const modalStudio = document.getElementById('modalStudio');
const modalSeason = document.getElementById('modalSeason');
const modalSynopsis = document.getElementById('modalSynopsis');
const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');
const episodesList = document.getElementById('episodesList');
const epSearchInput = document.getElementById('epSearchInput');
const autoNextCheck = document.getElementById('autoNextCheck');
const prevEpBtn = document.getElementById('prevEpBtn');
const nextEpBtn = document.getElementById('nextEpBtn');
const lightsOffBtn = document.getElementById('lightsOffBtn');
const theaterModeBtn = document.getElementById('theaterModeBtn');

// Schedule Elements
const scheduleGrid = document.getElementById('scheduleGrid');
const scheduleDaysTabs = document.getElementById('scheduleDaysTabs');

// Community & Interactive Tools Elements (v4.0)
const starRatingWidget = document.getElementById('starRatingWidget');
const userRatingText = document.getElementById('userRatingText');
const bookmarkSceneBtn = document.getElementById('bookmarkSceneBtn');
const bookmarksList = document.getElementById('bookmarksList');
const bookmarksCount = document.getElementById('bookmarksCount');
const commentsSection = document.getElementById('commentsSection');
const commentsList = document.getElementById('commentsList');
const commentsCount = document.getElementById('commentsCount');
const commentForm = document.getElementById('commentForm');
const commentUsername = document.getElementById('commentUsername');
const commentSpoilerCheck = document.getElementById('commentSpoilerCheck');
const commentText = document.getElementById('commentText');

// Watch Party Elements
const watchPartyBtn = document.getElementById('watchPartyBtn');
const watchPartyDrawer = document.getElementById('watchPartyDrawer');
const closePartyDrawerBtn = document.getElementById('closePartyDrawerBtn');
const copyPartyLinkBtn = document.getElementById('copyPartyLinkBtn');
const partyRoomCode = document.getElementById('partyRoomCode');
const partySyncBadge = document.getElementById('partySyncBadge');
const partyChatMessages = document.getElementById('partyChatMessages');
const partyChatForm = document.getElementById('partyChatForm');
const partyChatInput = document.getElementById('partyChatInput');

// Backup Elements
const exportBackupBtn = document.getElementById('exportBackupBtn');
const importBackupBtn = document.getElementById('importBackupBtn');
const importFileInput = document.getElementById('importFileInput');
const profileExportBackup = document.getElementById('profileExportBackup');
const profileImportBackup = document.getElementById('profileImportBackup');

// Command Palette Elements (v5.0)
const paletteTriggerBtn = document.getElementById('paletteTriggerBtn');
const commandPaletteModal = document.getElementById('commandPaletteModal');
const paletteOverlay = document.getElementById('paletteOverlay');
const paletteInput = document.getElementById('paletteInput');
const paletteResults = document.getElementById('paletteResults');

// Admin Studio Elements (v5.0)
const openAdminStudioBtn = document.getElementById('openAdminStudioBtn');
const adminStudioModal = document.getElementById('adminStudioModal');
const adminStudioOverlay = document.getElementById('adminStudioOverlay');
const closeAdminStudioBtn = document.getElementById('closeAdminStudioBtn');
const adminShowsCount = document.getElementById('adminShowsCount');
const adminCatalogSearch = document.getElementById('adminCatalogSearch');
const adminCatalogTbody = document.getElementById('adminCatalogTbody');
const adminAddNewBtn = document.getElementById('adminAddNewBtn');
const adminAnimeForm = document.getElementById('adminAnimeForm');
const adminEditId = document.getElementById('adminEditId');
const adminFormTitle = document.getElementById('adminFormTitle');
const adminFormType = document.getElementById('adminFormType');
const adminFormCover = document.getElementById('adminFormCover');
const adminFormBanner = document.getElementById('adminFormBanner');
const adminFormEpisodes = document.getElementById('adminFormEpisodes');
const adminFormStatus = document.getElementById('adminFormStatus');
const adminFormGenres = document.getElementById('adminFormGenres');
const adminFormSynopsis = document.getElementById('adminFormSynopsis');
const adminFormSpotlight = document.getElementById('adminFormSpotlight');
const adminResetBtn = document.getElementById('adminResetBtn');
const spotlightManagerGrid = document.getElementById('spotlightManagerGrid');

// Otaku Wrapped Elements (v5.0)
const openOtakuStatsBtn = document.getElementById('openOtakuStatsBtn');
const otakuWrappedModal = document.getElementById('otakuWrappedModal');
const otakuWrappedOverlay = document.getElementById('otakuWrappedOverlay');
const closeOtakuWrappedBtn = document.getElementById('closeOtakuWrappedBtn');
const otakuWrappedBody = document.getElementById('otakuWrappedBody');

// Floating Mini-Player Elements
const floatingMiniPlayer = document.getElementById('floatingMiniPlayer');
const miniPlayerDragHandle = document.getElementById('miniPlayerDragHandle');
const miniAnimeTitle = document.getElementById('miniAnimeTitle');
const miniEpCrumb = document.getElementById('miniEpCrumb');
const miniIframePlayer = document.getElementById('miniIframePlayer');
const miniExpandBtn = document.getElementById('miniExpandBtn');
const miniCloseBtn = document.getElementById('miniCloseBtn');
const miniPrevBtn = document.getElementById('miniPrevBtn');
const miniNextBtn = document.getElementById('miniNextBtn');
const miniServerBadge = document.getElementById('miniServerBadge');
const miniPlayerBtn = document.getElementById('miniPlayerBtn');

// Netflix-Style Who's Watching Elements
const whoIsWatchingModal = document.getElementById('whoIsWatchingModal');
const whoIsWatchingOverlay = document.getElementById('whoIsWatchingOverlay');
const profilesGrid = document.getElementById('profilesGrid');
const manageProfilesBtn = document.getElementById('manageProfilesBtn');
const addProfileBtn = document.getElementById('addProfileBtn');
const doneProfilesBtn = document.getElementById('doneProfilesBtn');
const openWhoWatchingBtn = document.getElementById('openWhoWatchingBtn');
const profileEditModal = document.getElementById('profileEditModal');
const profileEditOverlay = document.getElementById('profileEditOverlay');
const closeProfileEditBtn = document.getElementById('closeProfileEditBtn');
const profileForm = document.getElementById('profileForm');
const editProfileId = document.getElementById('editProfileId');
const profileNameInput = document.getElementById('profileNameInput');
const profilePreviewAvatar = document.getElementById('profilePreviewAvatar');
const deleteProfileBtn = document.getElementById('deleteProfileBtn');
const avatarChoices = document.getElementById('avatarChoices');
let isProfileManageMode = false;
let selectedAvatarSeed = 'otaku';

// Watch Party & State Management
let activePartyRoom = null;
let partyPollTimer = null;
let currentAnimeBookmarks = [];
let paletteSelectedIndex = 0;
let paletteItemsList = [];

// Dynamic API Base Configuration (Bridging GitHub Pages to Render Backend)
function getApiBase() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('onrender.com') || window.location.protocol === 'file:') {
    return '';
  }
  const configured = localStorage.getItem('hianime_render_api_url');
  if (configured && configured.trim()) {
    return configured.trim().replace(/\/+$/, '');
  }
  return 'https://hianime-localweb.onrender.com';
}

function apiUrl(endpoint) {
  const base = getApiBase();
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${clean}` : clean;
}

// Sandbox Ad-Lock Engine (Disabled by default so streaming embeds load without sandbox blocks)
let sandboxLockEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('hianime_sandbox_lock') === 'true' : false;

function applySandboxLock() {
  if (!animeEmbedPlayer) return;
  if (sandboxLockEnabled) {
    animeEmbedPlayer.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
  } else {
    animeEmbedPlayer.removeAttribute('sandbox');
  }
  updateSandboxLockBtnUI();
}

function updateSandboxLockBtnUI() {
  const btn = document.getElementById('sandboxLockBtn');
  const txt = document.getElementById('sandboxLockStateText');
  if (!btn) return;
  if (sandboxLockEnabled) {
    btn.classList.add('active');
    btn.classList.remove('inactive');
    if (txt) txt.textContent = 'ON';
    btn.title = 'Block Third-Party Popup Ads (Iframe Sandbox: ON)';
  } else {
    btn.classList.remove('active');
    btn.classList.add('inactive');
    if (txt) txt.textContent = 'OFF';
    btn.title = 'Relaxed Permissions (Iframe Sandbox: OFF)';
  }
}

function toggleSandboxLock() {
  sandboxLockEnabled = !sandboxLockEnabled;
  localStorage.setItem('hianime_sandbox_lock', String(sandboxLockEnabled));
  applySandboxLock();
  showToast(sandboxLockEnabled ? 'Sandbox Ad Lock: ON (Popup Ads Blocked)' : 'Sandbox Ad Lock: OFF (Relaxed Permissions)', sandboxLockEnabled ? 'success' : 'info');
}

// Register Offline Service Worker (v6.0 Final PWA) with auto-update & controllerchange refresh
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[PWA] Service Worker controller changed, refreshing to load newest assets...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[PWA] Service Worker v6.0 registered with scope:', reg.scope);
      // Immediately check for updates
      reg.update();
      window.addEventListener('focus', () => reg.update());
    }).catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  });
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initProfileSystem();
  initThemeEngine();
  updateWatchlistBadge();
  renderContinueWatching();
  setupEventListeners();
  setupPaletteListeners();
  setupAdminListeners();
  setupMiniPlayerListeners();
  setupProfileListeners();
  setupPlayerTabs();
  setupDirectToolbarListeners();
  setupAudioPrefListeners();
  setupSubtitleStylerListeners();
  setupCustomStreamListeners();
  setupKeyboardShortcuts();
  checkUrlPartyParams();
  updateSandboxLockBtnUI();
  if (window.lucide) lucide.createIcons();

  await loadData();
  await initSchedule();
});

// Fetch Data from Backend API (with fallback to local script dataset)
async function loadData() {
  const isStatic = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
  const localList = (typeof animeData !== 'undefined' && Array.isArray(animeData) && animeData.length > 0)
    ? animeData
    : (typeof animeDatabase !== 'undefined' && Array.isArray(animeDatabase) ? animeDatabase : []);
  
  // Render immediately with local dataset so there is zero initial delay
  if (localList.length > 0) {
    currentAnimeList = localList;
    currentSpotlights = localList.filter(a => a.spotlight);
    const top10Data = [...currentAnimeList].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)).slice(0, 10);
    renderSpotlight(currentSpotlights);
    renderTrendingRail(currentAnimeList);
    renderAnimeGrid(currentAnimeList);
    renderTop10(top10Data);
    if (window.lucide) lucide.createIcons();
    if (isStatic && !localStorage.getItem('hianime_render_api_url')) {
      return;
    }
  }

  try {
    const [animeRes, spotlightRes, top10Res] = await Promise.all([
      fetch(apiUrl('/api/anime')).then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null).catch(() => null),
      fetch(apiUrl('/api/anime/spotlight')).then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null).catch(() => null),
      fetch(apiUrl('/api/anime/top10')).then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null).catch(() => null)
    ]);

    if (animeRes && animeRes.success && animeRes.data) {
      currentAnimeList = animeRes.data;
    } else if (localList.length > 0) {
      currentAnimeList = localList;
    }

    if (spotlightRes && spotlightRes.success && spotlightRes.data) {
      currentSpotlights = spotlightRes.data;
    } else {
      currentSpotlights = currentAnimeList.filter(a => a.spotlight);
    }

    const top10Data = (top10Res && top10Res.success && top10Res.data) ? top10Res.data : [...currentAnimeList].sort((a, b) => b.rating - a.rating).slice(0, 10);

    renderSpotlight(currentSpotlights);
    renderTrendingRail(currentAnimeList);
    renderAnimeGrid(currentAnimeList);
    renderTop10(top10Data);
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.warn('API fetch error, using local fallback:', err);
    if (localList.length > 0) {
      currentAnimeList = localList;
      currentSpotlights = localList.filter(a => a.spotlight);
      renderSpotlight(currentSpotlights);
      renderTrendingRail(currentAnimeList);
      renderAnimeGrid(currentAnimeList);
      renderTop10(currentAnimeList.slice(0, 10));
      if (window.lucide) lucide.createIcons();
    }
  }
}

// Render Spotlight Hero Slider
function renderSpotlight(spotlights) {
  if (!spotlights || spotlights.length === 0) return;
  activeSpotlightIndex = 0;
  spotlightSlider.innerHTML = '';
  sliderDots.innerHTML = '';

  spotlights.forEach((anime, index) => {
    const slide = document.createElement('div');
    slide.className = `spotlight-slide ${index === 0 ? 'active' : ''}`;
    slide.style.backgroundImage = `url('${anime.banner || anime.poster}')`;

    slide.innerHTML = `
      <div class="slide-overlay">
        <div class="slide-content">
          <div class="spotlight-rank">#${index + 1} Spotlight</div>
          <h1 class="slide-title">${anime.title}</h1>
          <div class="slide-badges">
            <span class="badge-quality">${anime.quality || 'HD'}</span>
            <span class="badge-sub"><i data-lucide="captions"></i> SUB ${anime.subEpisodes || 12}</span>
            <span class="badge-dub"><i data-lucide="mic"></i> DUB ${anime.dubEpisodes || 12}</span>
            <span class="badge-meta">${anime.type || 'TV'}</span>
            <span class="badge-meta">${anime.duration || '24m'}</span>
            <span class="badge-meta">${anime.season || '2024'}</span>
          </div>
          <p class="slide-synopsis">${anime.synopsis}</p>
          <div class="slide-actions">
            <button class="btn-primary" onclick="openWatchModal('${anime.id}', 1)">
              <i data-lucide="play-circle"></i> Watch Now
            </button>
            <button class="btn-secondary" onclick="toggleWatchlist('${anime.id}')">
              <i data-lucide="${isInWatchlist(anime.id) ? 'check' : 'bookmark-plus'}"></i>
              ${isInWatchlist(anime.id) ? 'Saved' : 'Add to List'}
            </button>
          </div>
        </div>
      </div>
    `;
    spotlightSlider.appendChild(slide);

    // Slider Dot
    const dot = document.createElement('div');
    dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    sliderDots.appendChild(dot);
  });

  startSpotlightAutoPlay();
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.spotlight-slide');
  const dots = document.querySelectorAll('.slider-dot');
  if (!slides.length) return;

  if (slides[activeSpotlightIndex]) slides[activeSpotlightIndex].classList.remove('active');
  if (dots[activeSpotlightIndex]) dots[activeSpotlightIndex].classList.remove('active');

  activeSpotlightIndex = (index + slides.length) % slides.length;

  if (slides[activeSpotlightIndex]) slides[activeSpotlightIndex].classList.add('active');
  if (dots[activeSpotlightIndex]) dots[activeSpotlightIndex].classList.add('active');
}

function startSpotlightAutoPlay() {
  if (spotlightInterval) clearInterval(spotlightInterval);
  spotlightInterval = setInterval(() => {
    goToSlide(activeSpotlightIndex + 1);
  }, 6000);
}

// Render Trending Horizontal Rail
function renderTrendingRail(animeList) {
  trendingTrack.innerHTML = '';
  animeList.forEach((anime, index) => {
    const card = document.createElement('div');
    card.className = 'trending-rail-card';
    card.onclick = () => openWatchModal(anime.id, 1);

    card.innerHTML = `
      <div class="rail-poster">
        <img src="${anime.poster}" alt="${anime.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'">
        <div class="rail-badges">
          <span class="badge-sub">SUB</span>
          <span class="badge-dub">DUB</span>
        </div>
        <div class="rail-rank-number">${index + 1}</div>
      </div>
      <div class="rail-info">
        <h4 title="${anime.title}">${anime.title}</h4>
        <div class="rail-meta">
          <span>${anime.type || 'TV'}</span>
          <span>★ ${anime.rating || '9.0'}</span>
        </div>
      </div>
    `;
    trendingTrack.appendChild(card);
  });
}

// Render Main Anime Grid
function renderAnimeGrid(list) {
  animeGrid.innerHTML = '';
  if (!list || list.length === 0) {
    animeGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No anime found matching your criteria.</div>`;
    return;
  }

  list.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => openWatchModal(anime.id, 1);

    card.innerHTML = `
      <div class="card-poster">
        <img src="${anime.poster}" alt="${anime.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'">
        <div class="card-badges">
          <span class="badge-sub">SUB ${anime.subEpisodes || 12}</span>
          <span class="badge-dub">DUB ${anime.dubEpisodes || 12}</span>
        </div>
        <div class="card-score">★ ${anime.rating}</div>
        <div class="card-play-overlay">
          <div class="play-circle">
            <i data-lucide="play" style="fill: #fff;"></i>
          </div>
        </div>
      </div>
      <div class="card-info">
        <h4 class="card-title" title="${anime.title}">${anime.title}</h4>
        <div class="card-meta">
          <span>${anime.type || 'TV'} • ${anime.duration || '24m'}</span>
          <span>${anime.season || '2024'}</span>
        </div>
      </div>
    `;
    animeGrid.appendChild(card);
  });
}

// Render Top 10 Sidebar Leaderboard
function renderTop10(topList) {
  top10List.innerHTML = '';
  topList.forEach((anime, index) => {
    const item = document.createElement('div');
    item.className = 'top-10-item';
    item.onclick = () => openWatchModal(anime.id, 1);

    item.innerHTML = `
      <div class="top-10-rank">0${index + 1}</div>
      <img src="${anime.poster}" alt="${anime.title}" class="top-10-poster" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'">
      <div class="top-10-info">
        <h4 title="${anime.title}">${anime.title}</h4>
        <div class="top-10-meta">
          <span>★ ${anime.rating}</span>
          <span>${anime.type || 'TV'}</span>
          <span class="badge-sub" style="font-size:0.65rem;">SUB ${anime.subEpisodes || 12}</span>
        </div>
      </div>
    `;
    top10List.appendChild(item);
  });
}

let hlsPlayer = null;

function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('hianimeToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'hianimeToastContainer';
    toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `hianime-toast toast-${type}`;
  toast.style.cssText = 'background:rgba(22,22,34,0.95);border:1px solid var(--accent-pink);color:#fff;padding:10px 18px;border-radius:12px;font-size:0.85rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.6);backdrop-filter:blur(12px);pointer-events:auto;display:flex;align-items:center;gap:8px;';
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// --- AUDIO PREFERENCE, MULTI-SOURCE PROVIDERS & AUTO-FAILOVER ---
let userAudioPref = localStorage.getItem('hianime_audio_pref') || 'SUB';
let autoFailoverEnabled = localStorage.getItem('hianime_auto_failover') !== 'false';
let failoverTimer = null;
let currentSkipTimes = null;
let activeSkipTargetTime = 0;
let plyrInstance = null;

// Configurable Dynamic Providers Registry (editable in Admin Studio & localStorage)
const DEFAULT_STREAMING_PROVIDERS = [
  {
    id: "vidsrc-sub",
    name: "VidSrc (Sub)",
    type: "embed",
    audio: "sub",
    urlTemplate: "https://vidsrc.icu/embed/anime/{anilist_id}/{ep}/0",
    enabled: true
  },
  {
    id: "vidsrc-dub",
    name: "VidSrc (Dub)",
    type: "embed",
    audio: "dub",
    urlTemplate: "https://vidsrc.icu/embed/anime/{anilist_id}/{ep}/1",
    enabled: true
  },
  {
    id: "vidlink-sub",
    name: "VidLink (Sub)",
    type: "embed",
    audio: "sub",
    urlTemplate: "https://vidlink.pro/anime/{mal_id}/{ep}/sub",
    enabled: true
  },
  {
    id: "vidlink-dub",
    name: "VidLink (Dub)",
    type: "embed",
    audio: "dub",
    urlTemplate: "https://vidlink.pro/anime/{mal_id}/{ep}/dub",
    enabled: true
  },
  {
    id: "vidsrc-cc-sub",
    name: "VidSrc CC (Sub)",
    type: "embed",
    audio: "sub",
    urlTemplate: "https://vidsrc.cc/v2/embed/anime/{anilist_id}/{ep}/sub",
    enabled: true
  },
  {
    id: "vidsrc-cc-dub",
    name: "VidSrc CC (Dub)",
    type: "embed",
    audio: "dub",
    urlTemplate: "https://vidsrc.cc/v2/embed/anime/{anilist_id}/{ep}/dub",
    enabled: true
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    type: "embed",
    audio: "sub",
    urlTemplate: "https://multiembed.mov/?video_id={mal_id}&mal=1&s=1&e={ep}",
    enabled: true
  },
  {
    id: "twoembed",
    name: "2Anime XYZ",
    type: "embed",
    audio: "sub",
    urlTemplate: "https://2anime.xyz/embed/{slug}-episode-{ep}",
    enabled: true
  },
  {
    id: "archive-stream",
    name: "Archive.org Stream",
    type: "archive",
    audio: "sub",
    urlTemplate: "/api/sources/archive?title={title}&ep={ep}",
    enabled: true
  },
  {
    id: "direct-hls",
    name: "Direct HLS / Consumet",
    type: "hls",
    audio: "sub",
    urlTemplate: "/api/stream/{slug}/{ep}",
    enabled: true
  }
];

let streamingProviders = DEFAULT_STREAMING_PROVIDERS;

function loadStreamingProviders() {
  const custom = localStorage.getItem('hianime_custom_providers');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        streamingProviders = parsed;
        return;
      }
    } catch (_) {}
  }
  streamingProviders = DEFAULT_STREAMING_PROVIDERS;
}

// Universal Stream Resolver: Resolves 5 distinct source types
function resolveEpisodeSources(anime, episodeNumber, audioPref = 'SUB') {
  if (!anime) return [];
  loadStreamingProviders();

  const mal = String(anime.mal_id || anime.malId || '52299');
  const anilistId = String(anime.anilist_id || anime.idMal || mal);
  const slug = anime.slug || anime.id || 'anime';
  const title = anime.title || 'Anime';
  const epNum = episodeNumber || 1;
  const audio = (audioPref || 'SUB').toLowerCase();

  return streamingProviders
    .filter(p => p.enabled)
    .map(p => {
      let resolvedUrl = p.urlTemplate
        .replace(/{anilist_id}/g, anilistId)
        .replace(/{mal_id}/g, mal)
        .replace(/{slug}/g, slug)
        .replace(/{title}/g, encodeURIComponent(title))
        .replace(/{ep}/g, String(epNum))
        .replace(/{audio}/g, audio);

      if (resolvedUrl.startsWith('/api/')) {
        resolvedUrl = apiUrl(resolvedUrl);
      }

      const isHls = p.type === 'hls' || resolvedUrl.includes('.m3u8');
      const isMp4 = p.type === 'mp4' || resolvedUrl.includes('.mp4');
      const isArchive = p.type === 'archive';
      const isEmbed = p.type === 'embed' || (!isHls && !isMp4 && !isArchive);

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        audio: p.audio,
        url: resolvedUrl,
        isEmbed,
        isHls,
        isMp4,
        isArchive,
        fallbackEmbed: `https://vidsrc.icu/embed/anime/${anilistId}/${epNum}/${audio === 'dub' ? 1 : 0}`
      };
    });
}

function getActiveRotation() {
  loadStreamingProviders();
  const active = streamingProviders.filter(p => p.enabled);
  if (userAudioPref === 'DUB') {
    const dubs = active.filter(p => p.audio === 'dub').map(p => p.id);
    const others = active.filter(p => p.audio !== 'dub').map(p => p.id);
    return [...dubs, ...others];
  } else {
    const subs = active.filter(p => p.audio !== 'dub').map(p => p.id);
    const dubs = active.filter(p => p.audio === 'dub').map(p => p.id);
    return [...subs, ...dubs];
  }
}

function updateServerNotice(serverKey) {
  const noticeEl = document.getElementById('streamActiveServerNotice');
  if (!noticeEl) return;
  const labels = {
    'vidsrc-sub': 'Playing via <strong>VidSrc Anime (SUB)</strong> — Full Anime Episodes',
    'vidlink-sub': 'Playing via <strong>VidLink Stream (SUB)</strong> — Fast High-Bitrate HD',
    'vidsrc-cc-sub': 'Playing via <strong>VidSrc CC (SUB)</strong> — Alternative Anime Mirror',
    'multiembed': 'Playing via <strong>MultiEmbed Anime</strong> — Fast Multi-Source Gateway',
    'twoembed': 'Playing via <strong>2Anime XYZ</strong> — Mirror Embed Stream',
    'vidsrc-dub': 'Playing via <strong>VidSrc Anime (DUB)</strong> — English Dubbed Audio',
    'vidlink-dub': 'Playing via <strong>VidLink Stream (DUB)</strong> — English Dubbed Audio',
    'vidsrc-cc-dub': 'Playing via <strong>VidSrc CC (DUB)</strong> — English Dubbed Mirror',
    'consumet-hls': 'Playing via <strong>Direct HLS (Plyr Skin)</strong> — Native Master Playlist',
    'archive-stream': 'Playing via <strong>Internet Archive (Archive.org)</strong> — Open Stream',
    'direct-hls': 'Playing via <strong>Direct HLS / Consumet</strong> — Native Master Playlist'
  };
  noticeEl.innerHTML = labels[serverKey] || `Playing via <strong>${escapeHtml(serverKey)}</strong> Stream Provider.`;
}

function cycleNextServer(isAuto = false) {
  if (failoverTimer) {
    clearTimeout(failoverTimer);
    failoverTimer = null;
  }
  const rotation = getActiveRotation();
  if (!rotation || rotation.length === 0) return;
  const currentIndex = rotation.indexOf(currentServer);
  const nextIndex = (currentIndex + 1) % rotation.length;
  currentServer = rotation[nextIndex];
  
  // Update server pills UI
  document.querySelectorAll('.server-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.server === currentServer);
  });

  if (currentPlayingAnime) {
    const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
    loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed, streamInfo.isArchive);
    showToast(isAuto ? `Switched to backup stream source (${currentServer.toUpperCase()})` : `Switched server to ${currentServer.toUpperCase()}`, isAuto ? 'warning' : 'info');
  }
}

function getServerStreamUrl(serverName, anime, epNumber) {
  if (!anime) return { url: '', isEmbed: true };
  const sources = resolveEpisodeSources(anime, epNumber, userAudioPref);
  const matched = sources.find(s => s.id === serverName) || sources[0];

  updateServerNotice(serverName);

  if (matched) {
    if (matched.isArchive) {
      return {
        url: matched.url,
        isEmbed: false,
        isArchive: true,
        fallbackEmbed: matched.fallbackEmbed
      };
    }
    if (matched.isHls) {
      return {
        url: matched.url,
        isEmbed: false,
        isDynamic: true,
        fallbackEmbed: matched.fallbackEmbed
      };
    }
    return {
      url: matched.url,
      isEmbed: matched.isEmbed,
      fallbackEmbed: matched.fallbackEmbed
    };
  }

  const mal = String(anime.mal_id || anime.malId || '52299');
  const anilistId = String(anime.anilist_id || anime.idMal || mal);
  return { 
    url: `https://vidsrc.icu/embed/anime/${anilistId}/${epNumber}/${userAudioPref === 'DUB' ? 1 : 0}`, 
    isEmbed: true 
  };
}

async function loadActivePlayer(sourceUrl, isEmbed = true, isDynamic = false, fallbackEmbed = '', isArchive = false) {
  if (failoverTimer) {
    clearTimeout(failoverTimer);
    failoverTimer = null;
  }

  const plyrWrapper = document.getElementById('plyrWrapper');
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');

  if (isArchive) {
    try {
      showToast('Querying Archive.org stream...', 'info');
      let data = null;
      try {
        data = await fetch(sourceUrl).then(r => r.json());
      } catch (_) {
        const animeTitle = currentPlayingAnime?.title || '';
        const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(animeTitle)})+AND+mediatype:(movies)&fl[]=identifier,title&output=json&rows=3`;
        const sRes = await fetch(searchUrl).then(r => r.json());
        const docs = sRes?.response?.docs || [];
        if (docs && docs.length > 0) {
          const id = docs[0].identifier;
          const mRes = await fetch(`https://archive.org/metadata/${id}`).then(r => r.json());
          const mp4 = (mRes?.files || []).find(f => f.name && f.name.endsWith('.mp4'));
          if (mp4) {
            data = { success: true, streamUrl: `https://archive.org/download/${id}/${encodeURIComponent(mp4.name)}` };
          }
        }
      }

      if (data && data.success && data.streamUrl) {
        showToast('Playing Archive.org open stream via Plyr', 'success');
        loadActivePlayer(data.streamUrl, false);
        return;
      }
    } catch (err) {
      console.warn('Archive stream resolver failed:', err);
    }
    showToast('Archive stream unavailable — switched to backup stream source', 'warning');
    loadActivePlayer(fallbackEmbed || `https://vidsrc.icu/embed/anime/151807/1/0`, true);
    return;
  }

  if (isDynamic) {
    try {
      const res = await fetch(sourceUrl).then(r => r.json());
      if (res && res.success && res.streamUrl) {
        loadActivePlayer(res.streamUrl, false);
        return;
      }
    } catch (err) {
      console.warn('Dynamic stream resolver failed, switching to embed fallback:', err);
    }
    loadActivePlayer(fallbackEmbed || `https://vidsrc.icu/embed/anime/151807/1/0`, true);
    return;
  }

  if (isEmbed) {
    // Hide native Plyr player
    if (plyrWrapper) plyrWrapper.style.display = 'none';
    if (neonHlsPlayer) {
      neonHlsPlayer.pause();
      neonHlsPlayer.src = '';
    }
    if (hlsPlayer) {
      hlsPlayer.destroy();
      hlsPlayer = null;
    }
    if (animeVideoPlayer) {
      animeVideoPlayer.pause();
      animeVideoPlayer.src = '';
      animeVideoPlayer.style.display = 'none';
    }

    if (animeEmbedPlayer) {
      animeEmbedPlayer.style.display = 'block';
      applySandboxLock();
      animeEmbedPlayer.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write');
      animeEmbedPlayer.setAttribute('referrerpolicy', 'origin');

      // Start 6-second auto-failover monitor
      const autoFailoverBox = document.getElementById('autoFailoverCheck');
      const isAutoFailover = autoFailoverBox ? autoFailoverBox.checked : true;
      if (isAutoFailover) {
        failoverTimer = setTimeout(() => {
          console.warn('[Auto-Failover] Server response timeout reached (6s). Cycling to next server.');
          cycleNextServer(true);
        }, 6000);

        animeEmbedPlayer.onload = () => {
          if (failoverTimer) {
            clearTimeout(failoverTimer);
            failoverTimer = null;
          }
        };

        animeEmbedPlayer.onerror = () => {
          if (failoverTimer) {
            clearTimeout(failoverTimer);
            failoverTimer = null;
          }
          cycleNextServer(true);
        };
      }

      if (animeEmbedPlayer.src !== sourceUrl) {
        animeEmbedPlayer.src = sourceUrl;
      }
    }
  } else {
    // Direct HLS / Native Plyr Mode
    if (animeEmbedPlayer) {
      animeEmbedPlayer.src = 'about:blank';
      animeEmbedPlayer.style.display = 'none';
    }
    if (plyrWrapper) {
      plyrWrapper.style.display = 'block';
    }
    initPlyrHlsPlayer(sourceUrl);
  }
}

// Initialize Custom Plyr + Hls.js Skin
function initPlyrHlsPlayer(streamUrl) {
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  if (!neonHlsPlayer) return;

  const savedSpeed = parseFloat(localStorage.getItem('hianime_playback_speed') || '1.0');

  if (window.Plyr && !plyrInstance) {
    try {
      plyrInstance = new Plyr(neonHlsPlayer, {
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'duration',
          'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        speed: { selected: savedSpeed, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        keyboard: { focused: true, global: false }
      });

      plyrInstance.on('timeupdate', () => {
        checkAniSkip(plyrInstance.currentTime);
      });
    } catch (_) {}
  }

  neonHlsPlayer.playbackRate = savedSpeed;
  updateSpeedUI(savedSpeed);

  neonHlsPlayer.onerror = () => {
    console.warn('[NeonHLSPlayer Error] Native video playback error, triggering auto-failover');
    const autoFailoverBox = document.getElementById('autoFailoverCheck');
    if (!autoFailoverBox || autoFailoverBox.checked) {
      cycleNextServer(true);
    }
  };

  if (streamUrl && streamUrl.includes('.m3u8')) {
    if (window.Hls && Hls.isSupported()) {
      if (hlsPlayer) hlsPlayer.destroy();
      hlsPlayer = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsPlayer.loadSource(streamUrl);
      hlsPlayer.attachMedia(neonHlsPlayer);

      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        populateQualityMenu(hlsPlayer.levels);
        neonHlsPlayer.play().catch(() => {});
      });

      hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn('[HLS Fatal Error]', data);
          const autoFailoverBox = document.getElementById('autoFailoverCheck');
          if (!autoFailoverBox || autoFailoverBox.checked) {
            cycleNextServer(true);
          }
        }
      });
    } else if (neonHlsPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      neonHlsPlayer.src = streamUrl;
      neonHlsPlayer.play().catch(() => {});
    }
  } else if (streamUrl) {
    if (hlsPlayer) {
      hlsPlayer.destroy();
      hlsPlayer = null;
    }
    neonHlsPlayer.src = streamUrl;
    neonHlsPlayer.play().catch(() => {});
  }
}

// --- ANISKIP API ENGINE ---
async function fetchAniSkipData(malId, epNumber) {
  currentSkipTimes = null;
  hideAniSkipOverlay();
  if (!malId) return;

  try {
    const res = await fetch(`https://api.aniskip.com/v1/skip-times/${malId}/${epNumber}?types[]=op&types[]=ed`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.found && Array.isArray(data.results)) {
        const op = data.results.find(r => r.skip_type === 'op');
        const ed = data.results.find(r => r.skip_type === 'ed');
        currentSkipTimes = {
          op: op ? op.interval : null,
          ed: ed ? ed.interval : null
        };
        renderTimelineSkipMarkers(currentSkipTimes);
      }
    }
  } catch (err) {
    console.warn('[AniSkip] Skip-times fetch warning:', err.message);
  }
}

function checkAniSkip(currentTime) {
  if (!currentSkipTimes) return;
  const isAutoSkip = document.getElementById('autoSkipCheck')?.checked ?? true;

  // Opening Intro Skip Window
  if (currentSkipTimes.op && currentTime >= currentSkipTimes.op.start_time && currentTime < currentSkipTimes.op.end_time) {
    if (isAutoSkip) {
      seekDirectVideo(currentSkipTimes.op.end_time);
      showSkipToast('Auto-skipped opening intro! ⚡');
    } else {
      showAniSkipOverlay('Skip Intro [OP] ⏭', currentSkipTimes.op.end_time);
    }
    return;
  }

  // Ending Credits Skip Window
  if (currentSkipTimes.ed && currentTime >= currentSkipTimes.ed.start_time && currentTime < currentSkipTimes.ed.end_time) {
    if (isAutoSkip) {
      seekDirectVideo(currentSkipTimes.ed.end_time);
      showSkipToast('Auto-skipped ending credits! ⚡');
    } else {
      showAniSkipOverlay('Skip Ending [ED] ⏭', currentSkipTimes.ed.end_time);
    }
    return;
  }

  hideAniSkipOverlay();
}

function showAniSkipOverlay(btnText, targetTime) {
  const overlay = document.getElementById('aniSkipOverlay');
  const btnTextEl = document.getElementById('aniSkipBtnText');
  if (!overlay) return;
  activeSkipTargetTime = targetTime;
  if (btnTextEl) btnTextEl.textContent = btnText;
  overlay.style.display = 'block';
}

function hideAniSkipOverlay() {
  const overlay = document.getElementById('aniSkipOverlay');
  if (overlay) overlay.style.display = 'none';
}

function showSkipToast(msg) {
  const toastBanner = document.getElementById('skipToastBanner');
  const textEl = document.getElementById('skipToastText');
  if (!toastBanner) return;
  if (textEl) textEl.textContent = msg;
  toastBanner.style.display = 'flex';
  setTimeout(() => {
    toastBanner.style.display = 'none';
  }, 3500);
}

function seekDirectVideo(targetSec) {
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  if (plyrInstance) {
    plyrInstance.currentTime = targetSec;
  } else if (neonHlsPlayer) {
    neonHlsPlayer.currentTime = targetSec;
  }
}

function seekRelativeDirect(seconds) {
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  if (plyrInstance) {
    plyrInstance.currentTime = Math.max(0, (plyrInstance.currentTime || 0) + seconds);
  } else if (neonHlsPlayer) {
    neonHlsPlayer.currentTime = Math.max(0, (neonHlsPlayer.currentTime || 0) + seconds);
  }
}

function renderTimelineSkipMarkers(skipData) {
  const progressTrack = document.querySelector('.plyr__progress');
  if (!progressTrack || !skipData) return;
  
  // Clean previous markers
  progressTrack.querySelectorAll('.chapter-marker-op, .chapter-marker-ed').forEach(el => el.remove());
  
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  const duration = (plyrInstance && plyrInstance.duration) || (neonHlsPlayer && neonHlsPlayer.duration) || 1440;
  if (duration <= 0) return;

  if (skipData.op) {
    const leftPct = (skipData.op.start_time / duration) * 100;
    const widthPct = ((skipData.op.end_time - skipData.op.start_time) / duration) * 100;
    const marker = document.createElement('div');
    marker.className = 'chapter-marker-op';
    marker.style.left = `${leftPct}%`;
    marker.style.width = `${widthPct}%`;
    marker.title = 'Opening Theme (OP)';
    progressTrack.appendChild(marker);
  }

  if (skipData.ed) {
    const leftPct = (skipData.ed.start_time / duration) * 100;
    const widthPct = ((skipData.ed.end_time - skipData.ed.start_time) / duration) * 100;
    const marker = document.createElement('div');
    marker.className = 'chapter-marker-ed';
    marker.style.left = `${leftPct}%`;
    marker.style.width = `${widthPct}%`;
    marker.title = 'Ending Theme (ED)';
    progressTrack.appendChild(marker);
  }
}

// --- DIRECT TOOLBAR, SPEED, SUBTITLE & QUALITY CONTROLS ---
function setupDirectToolbarListeners() {
  // Rewind -10s
  document.getElementById('rewind10Btn')?.addEventListener('click', () => {
    seekRelativeDirect(-10);
    showToast('Rewound -10s');
  });

  // Forward +10s
  document.getElementById('forward10Btn')?.addEventListener('click', () => {
    seekRelativeDirect(10);
    showToast('Fast-forward +10s');
  });

  // Quick Skip +85s Intro
  document.getElementById('quickSkip85Btn')?.addEventListener('click', () => {
    seekRelativeDirect(85);
    showToast('Skipped Anime Opening (+85s) ⏭');
  });

  // AniSkip manual click on overlay button
  document.getElementById('aniSkipBtn')?.addEventListener('click', () => {
    if (activeSkipTargetTime > 0) {
      seekDirectVideo(activeSkipTargetTime);
      hideAniSkipOverlay();
      showToast('Skipped sequence ⏭');
    }
  });

  // Quick Switch Server button
  document.getElementById('streamQuickSwitchBtn')?.addEventListener('click', () => {
    cycleNextServer(false);
  });

  // Auto-failover toggle
  document.getElementById('autoFailoverCheck')?.addEventListener('change', (e) => {
    autoFailoverEnabled = e.target.checked;
    localStorage.setItem('hianime_auto_failover', String(autoFailoverEnabled));
    showToast(autoFailoverEnabled ? 'Auto-Failover Enabled ⚡' : 'Auto-Failover Disabled');
  });

  // Auto-Skip toggle
  document.getElementById('autoSkipCheck')?.addEventListener('change', (e) => {
    localStorage.setItem('hianime_auto_skip', String(e.target.checked));
    showToast(e.target.checked ? 'AniSkip Auto-Skip Enabled ⚡' : 'AniSkip Auto-Skip Disabled');
  });

  // Speed dropdown toggle
  const speedBtn = document.getElementById('speedDropdownBtn');
  const speedMenu = document.getElementById('speedMenu');
  if (speedBtn && speedMenu) {
    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speedMenu.classList.toggle('active');
      document.getElementById('qualityMenu')?.classList.remove('active');
      document.getElementById('subtitleMenu')?.classList.remove('active');
    });
    speedMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const rate = parseFloat(item.dataset.speed);
        setPlaybackRate(rate);
        speedMenu.classList.remove('active');
      });
    });
  }

  // Quality dropdown toggle
  const qualityBtn = document.getElementById('qualityDropdownBtn');
  const qualityMenu = document.getElementById('qualityMenu');
  if (qualityBtn && qualityMenu) {
    qualityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      qualityMenu.classList.toggle('active');
      document.getElementById('speedMenu')?.classList.remove('active');
      document.getElementById('subtitleMenu')?.classList.remove('active');
    });
    qualityMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const q = parseInt(item.dataset.quality);
        setQualityLevel(q);
        qualityMenu.classList.remove('active');
      });
    });
  }

  // Subtitle dropdown toggle
  const subBtn = document.getElementById('subtitleDropdownBtn');
  const subMenu = document.getElementById('subtitleMenu');
  if (subBtn && subMenu) {
    subBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      subMenu.classList.toggle('active');
      document.getElementById('speedMenu')?.classList.remove('active');
      document.getElementById('qualityMenu')?.classList.remove('active');
    });
    subMenu.querySelectorAll('.dropdown-item[data-track]').forEach(item => {
      item.addEventListener('click', () => {
        const track = item.dataset.track;
        setSubtitleTrack(track);
        subMenu.classList.remove('active');
      });
    });
  }

  // Close menus on outside click
  document.addEventListener('click', () => {
    speedMenu?.classList.remove('active');
    qualityMenu?.classList.remove('active');
    subMenu?.classList.remove('active');
  });

  // Setup local subtitle uploader
  setupSubtitleUploader();
}

function setPlaybackRate(rate) {
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  if (plyrInstance) {
    plyrInstance.speed = rate;
  } else if (neonHlsPlayer) {
    neonHlsPlayer.playbackRate = rate;
  }
  localStorage.setItem('hianime_playback_speed', String(rate));
  updateSpeedUI(rate);
  showToast(`Playback Speed: ${rate}x`);
}

function updateSpeedUI(rate) {
  const label = document.getElementById('currentSpeedLabel');
  if (label) label.textContent = `${rate}x`;
  document.querySelectorAll('#speedMenu .dropdown-item').forEach(item => {
    item.classList.toggle('active', parseFloat(item.dataset.speed) === rate);
  });
}

function populateQualityMenu(levels) {
  const menu = document.getElementById('qualityMenu');
  if (!menu || !levels || levels.length === 0) return;
  menu.innerHTML = `<button type="button" class="dropdown-item active" data-quality="-1">Auto (ABR)</button>`;
  levels.forEach((lvl, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dropdown-item';
    btn.dataset.quality = idx;
    btn.textContent = `${lvl.height || 'HD'}p (${Math.round((lvl.bitrate || 0) / 1000)}k)`;
    btn.onclick = () => {
      if (hlsPlayer) {
        hlsPlayer.currentLevel = idx;
        const qLabel = document.getElementById('currentQualityLabel');
        if (qLabel) qLabel.textContent = `${lvl.height}p`;
        showToast(`Stream Quality: ${lvl.height}p`);
      }
      menu.classList.remove('active');
    };
    menu.appendChild(btn);
  });
}

function setQualityLevel(levelIdx) {
  if (hlsPlayer) {
    hlsPlayer.currentLevel = levelIdx;
    const qLabel = document.getElementById('currentQualityLabel');
    if (qLabel) qLabel.textContent = levelIdx === -1 ? 'Auto' : 'Manual';
    showToast(levelIdx === -1 ? 'Quality: Auto (ABR)' : 'Quality set');
  }
}

function setSubtitleTrack(trackCode) {
  const label = document.getElementById('currentSubtitleLabel');
  if (trackCode === '-1') {
    if (plyrInstance) plyrInstance.currentTrack = -1;
    if (label) label.textContent = 'Subtitles: Off';
    showToast('Subtitles Off');
  } else {
    if (label) label.textContent = `Sub: ${trackCode.toUpperCase()}`;
    showToast(`Subtitles: ${trackCode.toUpperCase()}`);
  }
}

function setupSubtitleUploader() {
  const localInput = document.getElementById('localSubtitleInput');
  if (!localInput) return;
  localInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      let content = evt.target.result;
      if (file.name.endsWith('.srt')) {
        content = 'WEBVTT\n\n' + content.replace(/\r\n|\r/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      }
      const blob = new Blob([content], { type: 'text/vtt' });
      const trackUrl = URL.createObjectURL(blob);
      const neonHlsPlayer = document.getElementById('neonHlsPlayer');
      if (neonHlsPlayer) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.label = file.name;
        track.srclang = 'custom';
        track.src = trackUrl;
        track.default = true;
        neonHlsPlayer.appendChild(track);
        showToast(`Loaded Custom Subtitles: ${file.name}`);
        const label = document.getElementById('currentSubtitleLabel');
        if (label) label.textContent = 'Sub: Custom';
      }
    };
    reader.readAsText(file);
  });
}

function setupSubtitleStylerListeners() {
  const openBtn = document.getElementById('openSubStylerBtn');
  const modal = document.getElementById('subStylerModal');
  const closeBtn = document.getElementById('closeSubStylerBtn');
  const overlay = document.getElementById('subStylerOverlay');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      loadSubtitleStylerPreferences();
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  if (overlay && modal) {
    overlay.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Hook choice buttons
  setupStyleChoiceGroup('subFontSizeGroup', (val) => updateSubtitleStyle({ fontSize: val }));
  setupStyleChoiceGroup('subTextColorGroup', (val) => updateSubtitleStyle({ textColor: val }));
  setupStyleChoiceGroup('subBgOpacityGroup', (val) => updateSubtitleStyle({ bgOpacity: val }));

  // Load initial styles
  const savedStyles = JSON.parse(localStorage.getItem('hianime_subtitle_style') || '{}');
  applySubtitleStyles(savedStyles);
}

function setupStyleChoiceGroup(groupId, onChange) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.style-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.style-choice-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}

function updateSubtitleStyle(partial) {
  const current = JSON.parse(localStorage.getItem('hianime_subtitle_style') || '{"fontSize":"125%","textColor":"#ffffff","bgOpacity":"0.5"}');
  const merged = { ...current, ...partial };
  localStorage.setItem('hianime_subtitle_style', JSON.stringify(merged));
  applySubtitleStyles(merged);
}

function applySubtitleStyles(styleObj) {
  let styleEl = document.getElementById('dynamicSubtitleStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicSubtitleStyles';
    document.head.appendChild(styleEl);
  }
  const fontSize = styleObj.fontSize || '125%';
  const textColor = styleObj.textColor || '#ffffff';
  const bgOpacity = styleObj.bgOpacity ?? '0.5';
  const bgColor = `rgba(0, 0, 0, ${bgOpacity})`;

  styleEl.textContent = `
    .plyr__captions, ::cue {
      font-size: ${fontSize} !important;
      color: ${textColor} !important;
      background-color: ${bgColor} !important;
    }
  `;

  // Update preview in modal
  const preview = document.getElementById('subPreviewText');
  if (preview) {
    preview.style.fontSize = fontSize;
    preview.style.color = textColor;
    preview.style.backgroundColor = bgColor;
  }
}

function loadSubtitleStylerPreferences() {
  const saved = JSON.parse(localStorage.getItem('hianime_subtitle_style') || '{"fontSize":"125%","textColor":"#ffffff","bgOpacity":"0.5"}');
  syncChoiceGroup('subFontSizeGroup', saved.fontSize);
  syncChoiceGroup('subTextColorGroup', saved.textColor);
  syncChoiceGroup('subBgOpacityGroup', saved.bgOpacity);
  applySubtitleStyles(saved);
}

function syncChoiceGroup(groupId, val) {
  const group = document.getElementById(groupId);
  if (!group || !val) return;
  group.querySelectorAll('.style-choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(val));
  });
}

// --- SUB/DUB AUDIO PREFERENCE ---
function setupAudioPrefListeners() {
  const subBtn = document.getElementById('prefSubBtn');
  const dubBtn = document.getElementById('prefDubBtn');

  if (subBtn) {
    subBtn.addEventListener('click', () => setAudioPreference('SUB'));
  }
  if (dubBtn) {
    dubBtn.addEventListener('click', () => setAudioPreference('DUB'));
  }

  // Profile modal selector
  const profileAudioSelect = document.getElementById('profileAudioPrefSelect');
  if (profileAudioSelect) {
    profileAudioSelect.value = userAudioPref;
    profileAudioSelect.addEventListener('change', (e) => {
      setAudioPreference(e.target.value);
    });
  }

  syncAudioPrefUI();
}

function setAudioPreference(pref) {
  userAudioPref = pref;
  localStorage.setItem('hianime_audio_pref', pref);
  syncAudioPrefUI();
  showToast(`Audio Preference: ${pref === 'DUB' ? 'English Dubbed' : 'Subbed (Japanese)'}`);

  // Re-order or switch active server if currentServer doesn't match pref
  const isDubServer = currentServer.includes('dub');
  if (pref === 'DUB' && !isDubServer) {
    currentServer = 'vidsrc-dub';
  } else if (pref === 'SUB' && isDubServer) {
    currentServer = 'vidsrc-sub';
  }

  // Update pills
  document.querySelectorAll('.server-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.server === currentServer);
  });

  if (currentPlayingAnime) {
    const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
    loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed);
  }
}

function syncAudioPrefUI() {
  const subBtn = document.getElementById('prefSubBtn');
  const dubBtn = document.getElementById('prefDubBtn');
  if (subBtn) subBtn.classList.toggle('active', userAudioPref === 'SUB');
  if (dubBtn) dubBtn.classList.toggle('active', userAudioPref === 'DUB');
  const profileAudioSelect = document.getElementById('profileAudioPrefSelect');
  if (profileAudioSelect) profileAudioSelect.value = userAudioPref;
}

// --- MULTI-TABS UNDER PLAYER ---
function setupPlayerTabs() {
  const tabBtns = document.querySelectorAll('.player-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.player-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

function renderQuickEpGrid(anime, activeNum) {
  const container = document.getElementById('epGridQuickAccess');
  if (!container) return;
  container.innerHTML = '';
  const episodes = (anime.episodes && anime.episodes.length > 0) ? anime.episodes : [{ number: 1, title: 'Episode 1' }];
  episodes.forEach(ep => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ep-quick-btn ${ep.number === activeNum ? 'active' : ''}`;
    btn.textContent = `EP ${ep.number}`;
    btn.title = `${ep.title} (${ep.filler ? 'Filler' : 'Canon'})`;
    btn.onclick = () => openWatchModal(anime.id, ep.number);
    container.appendChild(btn);
  });
}

function renderCastTab(anime) {
  const castGrid = document.getElementById('castGrid');
  if (!castGrid) return;
  if (!anime.characters || anime.characters.length === 0) {
    castGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 24px;">No character cast available.</div>`;
    return;
  }
  castGrid.innerHTML = anime.characters.map(char => `
    <div class="cast-card">
      <div class="cast-char-side">
        <img src="${char.image || anime.poster}" alt="${char.name}" class="cast-thumb" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='${anime.poster}'">
        <div class="cast-char-info">
          <h5 title="${char.name}">${char.name}</h5>
          <span>${char.role || 'CHARACTER'}</span>
        </div>
      </div>
      ${char.voiceActor ? `
        <div class="cast-va-side">
          <img src="${char.voiceActor.image || anime.poster}" alt="${char.voiceActor.name}" class="cast-thumb" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='${anime.poster}'">
          <div class="cast-va-info">
            <h5 title="${char.voiceActor.name}">${char.voiceActor.name}</h5>
            <span>JAPANESE VA</span>
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderTrailerTab(anime) {
  const trailerVideo = document.getElementById('trailerVideoPlayer');
  const trailerPlaceholder = document.getElementById('trailerPlaceholder');
  if (!trailerVideo) return;

  const posterImg = (anime.trailer && anime.trailer.thumbnail) || anime.banner || anime.poster || '';
  trailerVideo.poster = posterImg;

  if (anime.trailer && anime.trailer.videoUrl) {
    trailerVideo.src = anime.trailer.videoUrl;
    trailerVideo.style.display = 'block';
    if (trailerPlaceholder) trailerPlaceholder.style.display = 'none';
  } else {
    trailerVideo.src = '';
    trailerVideo.style.display = 'block';
    if (trailerPlaceholder) {
      trailerPlaceholder.style.display = 'none';
    }
  }
}

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (!playerModal || !playerModal.classList.contains('active')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    switch (e.code) {
      case 'Space':
      case 'KeyK':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
      case 'KeyJ':
        e.preventDefault();
        seekRelativeDirect(-10);
        showToast('Rewound -10s');
        break;
      case 'ArrowRight':
      case 'KeyL':
        e.preventDefault();
        seekRelativeDirect(10);
        showToast('Forward +10s');
        break;
      case 'KeyS':
        e.preventDefault();
        seekRelativeDirect(85);
        showToast('Skipped Anime Intro (+85s) ⏭');
        break;
      case 'KeyC':
        e.preventDefault();
        toggleSubtitles();
        break;
      case 'BracketLeft':
        e.preventDefault();
        stepSpeed(-0.25);
        break;
      case 'BracketRight':
        e.preventDefault();
        stepSpeed(0.25);
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreenPlayer();
        break;
    }
  });
}

function togglePlayPause() {
  const neonHlsPlayer = document.getElementById('neonHlsPlayer');
  if (plyrInstance) {
    plyrInstance.togglePlay();
  } else if (neonHlsPlayer) {
    if (neonHlsPlayer.paused) neonHlsPlayer.play().catch(() => {});
    else neonHlsPlayer.pause();
  }
}

function toggleSubtitles() {
  if (plyrInstance) {
    plyrInstance.toggleCaptions();
  }
}

function stepSpeed(delta) {
  const current = parseFloat(localStorage.getItem('hianime_playback_speed') || '1.0');
  const next = Math.max(0.25, Math.min(2.0, parseFloat((current + delta).toFixed(2))));
  setPlaybackRate(next);
}

function toggleFullscreenPlayer() {
  const container = document.querySelector('.video-inner');
  if (!container) return;
  if (!document.fullscreenElement) {
    container.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

// Continue Watching History Tracker
function saveWatchProgress(anime, episodeNumber) {
  if (!anime) return;
  const epNum = parseInt(episodeNumber) || 1;
  const totalEps = anime.subEpisodes || (anime.episodes ? anime.episodes.length : 12);
  const record = {
    animeId: anime.id,
    title: anime.title,
    cover: anime.poster || anime.banner,
    episodeNumber: epNum,
    totalEpisodes: totalEps,
    timestamp: Date.now()
  };

  // Deduplicate: filter out existing entry for this anime
  watchHistory = watchHistory.filter(h => h.animeId !== anime.id);
  // Add to beginning of array, keeping up to 12 recent items
  watchHistory.unshift(record);
  if (watchHistory.length > 12) watchHistory.length = 12;

  saveProfileWatchHistory(watchHistory);
  renderContinueWatching();
}

function renderContinueWatching() {
  if (!continueWatchingSection || !continueWatchingTrack) return;
  if (!watchHistory || watchHistory.length === 0) {
    continueWatchingSection.style.display = 'none';
    continueWatchingTrack.innerHTML = '';
    return;
  }

  continueWatchingSection.style.display = 'block';
  continueWatchingTrack.innerHTML = watchHistory.map(item => {
    const percent = Math.min(100, Math.round((item.episodeNumber / (item.totalEpisodes || 12)) * 100));
    return `
      <div class="continue-card" onclick="openWatchModal('${item.animeId}', ${item.episodeNumber})">
        <button class="continue-card-remove" onclick="event.stopPropagation(); removeWatchHistory('${item.animeId}')" title="Remove from History">✕</button>
        <div class="continue-card-thumb">
          <img src="${item.cover}" alt="${item.title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'">
          <div class="continue-play-overlay">
            <i data-lucide="play-circle"></i>
          </div>
          <div class="continue-progress-bar" style="width: ${percent}%;"></div>
        </div>
        <div class="continue-card-info">
          <div class="continue-card-title" title="${item.title}">${item.title}</div>
          <div class="continue-card-ep">Episode ${item.episodeNumber} / ${item.totalEpisodes}</div>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function removeWatchHistory(animeId) {
  watchHistory = watchHistory.filter(h => h.animeId !== animeId);
  saveProfileWatchHistory(watchHistory);
  renderContinueWatching();
}

function clearAllWatchHistory() {
  watchHistory = [];
  saveProfileWatchHistory(watchHistory);
  renderContinueWatching();
}

// Lights Off & Theater Mode Controls
function toggleLightsOff(forceState) {
  if (!playerModal) return;
  const shouldBeOn = typeof forceState === 'boolean' ? forceState : !playerModal.classList.contains('lights-off');
  if (shouldBeOn) {
    playerModal.classList.add('lights-off');
    if (lightsOffBtn) lightsOffBtn.classList.add('active');
  } else {
    playerModal.classList.remove('lights-off');
    if (lightsOffBtn) lightsOffBtn.classList.remove('active');
  }
}

function toggleTheaterMode(forceState) {
  if (!playerModal) return;
  const shouldBeOn = typeof forceState === 'boolean' ? forceState : !playerModal.classList.contains('theater-mode');
  if (shouldBeOn) {
    playerModal.classList.add('theater-mode');
    if (theaterModeBtn) theaterModeBtn.classList.add('active');
  } else {
    playerModal.classList.remove('theater-mode');
    if (theaterModeBtn) theaterModeBtn.classList.remove('active');
  }
}

// Open Watch Modal & Video Player
async function openWatchModal(animeId, episodeNum = 1) {
  const anime = currentAnimeList.find(a => a.id === animeId);
  if (!anime) return;

  currentPlayingAnime = anime;
  currentPlayingEpisode = episodeNum;

  modalAnimeTitle.textContent = anime.title;
  const ep = (anime.episodes && anime.episodes.find(e => e.number === episodeNum)) || 
    (anime.episodes && anime.episodes[0]) || 
    { number: episodeNum, title: `Episode ${episodeNum}` };

  modalEpCrumb.textContent = `Episode ${ep.number} - ${ep.title}`;
  modalScore.textContent = `★ ${anime.rating}`;
  modalType.textContent = anime.type || 'TV Series';
  modalStudio.textContent = anime.studio || 'Studio';
  modalSeason.textContent = anime.season || '2024';
  modalSynopsis.textContent = anime.synopsis;

  // Tab 1 Ep Header Elements
  const curEpHeader = document.getElementById('currentEpHeaderTitle');
  if (curEpHeader) curEpHeader.textContent = `Episode ${ep.number} - ${ep.title}`;
  const curEpAir = document.getElementById('currentEpAirDate');
  if (curEpAir) curEpAir.innerHTML = `<i data-lucide="calendar"></i> Aired: ${ep.aired || '2024-01-07'}`;
  const curEpCanon = document.getElementById('currentEpCanonBadge');
  if (curEpCanon) {
    curEpCanon.className = ep.filler ? 'badge-filler' : 'badge-canon';
    curEpCanon.textContent = ep.filler ? 'FILLER' : 'CANON';
  }

  // Track progress in Continue Watching
  saveWatchProgress(anime, episodeNum);

  // Sync Audio Preference & Server
  syncAudioPrefUI();
  if (userAudioPref === 'DUB' && !currentServer.includes('dub')) {
    currentServer = 'vidsrc-dub';
  } else if (userAudioPref === 'SUB' && currentServer.includes('dub')) {
    currentServer = 'vidsrc-sub';
  }

  // Resolve stream using active server
  const streamInfo = getServerStreamUrl(currentServer, anime, episodeNum);
  loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed);

  // Synchronize server buttons in player
  document.querySelectorAll('.server-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.server === currentServer);
  });

  // Update Bookmark Button in Modal
  updateModalBookmarkBtn(anime.id);

  // Render Episode List & Tabs
  renderEpisodesSidebar(anime, episodeNum);
  renderQuickEpGrid(anime, episodeNum);
  renderCastTab(anime);
  renderTrailerTab(anime);

  // Fetch AniSkip skip times
  fetchAniSkipData(anime.mal_id || anime.malId, episodeNum);

  // Initialize v4.0 Community & Interactive Features
  initStarRating(anime.id);
  initBookmarks(anime.id, episodeNum);
  initComments(anime.id, episodeNum);
  syncWatchPartyEpisode(anime.id, episodeNum);

  playerModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function renderEpisodesSidebar(anime, activeNum) {
  episodesList.innerHTML = '';
  const episodes = (anime.episodes && anime.episodes.length > 0) ? anime.episodes : [
    { number: 1, title: 'Episode 1', duration: '24:00' }
  ];

  episodes.forEach(ep => {
    const row = document.createElement('div');
    row.className = `episode-row ${ep.number === activeNum ? 'active' : ''}`;
    row.onclick = () => openWatchModal(anime.id, ep.number);

    row.innerHTML = `
      <div class="ep-num">${ep.number}</div>
      <div class="ep-name" title="${ep.title}">
        <span>${ep.title}</span>
        ${ep.filler ? '<span class="badge-filler" style="margin-left: 6px; font-size: 0.65rem; padding: 2px 6px;">FILLER</span>' : ''}
      </div>
      <div class="ep-time">${ep.duration || '24m'}</div>
    `;
    episodesList.appendChild(row);
  });
}

// Close Watch Modal
function closeWatchModal() {
  playerModal.classList.remove('active');
  toggleLightsOff(false);
  if (failoverTimer) {
    clearTimeout(failoverTimer);
    failoverTimer = null;
  }
  if (animeEmbedPlayer) {
    animeEmbedPlayer.src = 'about:blank';
  }
  if (plyrInstance) {
    plyrInstance.pause();
  }
  if (hlsPlayer) {
    hlsPlayer.destroy();
    hlsPlayer = null;
  }
  const trailerVideo = document.getElementById('trailerVideoPlayer');
  if (trailerVideo) {
    trailerVideo.pause();
    trailerVideo.src = '';
  }
  document.body.style.overflow = '';
}

// Watchlist Management
function isInWatchlist(animeId) {
  return watchlist.some(item => item.id === animeId);
}

function toggleWatchlist(animeId) {
  const anime = currentAnimeList.find(a => a.id === animeId);
  if (!anime) return;

  const idx = watchlist.findIndex(item => item.id === animeId);
  if (idx >= 0) {
    watchlist.splice(idx, 1);
  } else {
    watchlist.push({ id: anime.id, title: anime.title, poster: anime.poster, rating: anime.rating });
  }

  saveProfileWatchlist(watchlist);
  updateWatchlistBadge();
  updateModalBookmarkBtn(animeId);
  renderWatchlistDrawer();
}

function updateWatchlistBadge() {
  watchlistCount.textContent = watchlist.length;
}

function updateModalBookmarkBtn(animeId) {
  if (isInWatchlist(animeId)) {
    modalBookmarkBtn.innerHTML = `<i data-lucide="check"></i> In Watchlist`;
    modalBookmarkBtn.style.background = 'var(--accent-green)';
  } else {
    modalBookmarkBtn.innerHTML = `<i data-lucide="bookmark-plus"></i> Add to Watchlist`;
    modalBookmarkBtn.style.background = 'var(--accent-pink)';
  }
  if (window.lucide) lucide.createIcons();
}

function renderWatchlistDrawer() {
  watchlistItems.innerHTML = '';
  if (watchlist.length === 0) {
    watchlistItems.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">Your watchlist is currently empty.</div>`;
    return;
  }

  watchlist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'watchlist-card';
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'">
      <div class="watchlist-card-info">
        <h4>${item.title}</h4>
        <span style="font-size: 0.75rem; color: var(--accent-gold);">★ ${item.rating}</span>
        <button onclick="openWatchModal('${item.id}', 1); watchlistDrawer.classList.remove('open');" style="display:block; margin-top:4px; font-size:0.75rem; color:var(--accent-cyan); font-weight:700;">Watch Now</button>
      </div>
      <button class="watchlist-del-btn" onclick="toggleWatchlist('${item.id}')" title="Remove">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    watchlistItems.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

// Live Search Handling
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (query.length < 1) {
    searchDropdown.classList.remove('show');
    return;
  }

  const matches = currentAnimeList.filter(a => 
    a.title.toLowerCase().includes(query) || 
    (a.romajiTitle && a.romajiTitle.toLowerCase().includes(query)) ||
    a.genres.some(g => g.toLowerCase().includes(query))
  ).slice(0, 5);

  if (matches.length === 0) {
    searchDropdown.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size:0.85rem;">No anime found</div>`;
  } else {
    searchDropdown.innerHTML = matches.map(anime => `
      <div class="search-item" onclick="openWatchModal('${anime.id}', 1); searchDropdown.classList.remove('show');">
        <img src="${anime.poster}" alt="${anime.title}" referrerpolicy="no-referrer">
        <div class="search-item-info">
          <h4>${anime.title}</h4>
          <div class="search-item-meta">
            <span>★ ${anime.rating}</span>
            <span>${anime.type || 'TV'}</span>
            <span>${anime.genres.slice(0, 2).join(', ')}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  searchDropdown.classList.add('show');
});

// Search on Enter Key
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = searchInput.value.toLowerCase().trim();
    searchDropdown.classList.remove('show');
    if (!query) {
      filterAnimeGrid('all', 'All');
      return;
    }
    const matches = currentAnimeList.filter(a => 
      a.title.toLowerCase().includes(query) || 
      (a.romajiTitle && a.romajiTitle.toLowerCase().includes(query)) ||
      a.genres.some(g => g.toLowerCase().includes(query))
    );
    renderAnimeGrid(matches);
    window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
  }
});

// Hide dropdown on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-search')) {
    searchDropdown.classList.remove('show');
  }
});

// Event Listeners Setup
function setupEventListeners() {
  // Slider Arrows
  sliderPrev.addEventListener('click', () => {
    goToSlide(activeSpotlightIndex - 1);
    startSpotlightAutoPlay();
  });
  sliderNext.addEventListener('click', () => {
    goToSlide(activeSpotlightIndex + 1);
    startSpotlightAutoPlay();
  });

  // Trending Rail Horizontal Scroll
  railPrev.addEventListener('click', () => {
    trendingTrack.parentElement.scrollBy({ left: -420, behavior: 'smooth' });
  });
  railNext.addEventListener('click', () => {
    trendingTrack.parentElement.scrollBy({ left: 420, behavior: 'smooth' });
  });

  // Category Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const tab = e.target.dataset.tab;
      filterAnimeGrid(tab, getActiveGenre());
    });
  });

  // Genre Pills
  document.querySelectorAll('.genre-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const genre = e.target.dataset.genre;
      filterAnimeGrid(getActiveTab(), genre);
    });
  });

  // Sidebar Genre Tags
  document.querySelectorAll('.genre-tags-cloud a').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      const genre = e.target.dataset.genre;
      // Set active genre pill
      document.querySelectorAll('.genre-pill').forEach(p => {
        if (p.dataset.genre === genre) p.classList.add('active');
        else p.classList.remove('active');
      });
      filterAnimeGrid('all', genre);
      window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
    });
  });

  // Sub Navigation Links Filter
  document.querySelectorAll('.sub-nav-inner a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sub-nav-inner a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
      const tab = link.dataset.tab;
      const filter = link.dataset.filter;

      if (tab) {
        document.querySelectorAll('.tab-btn').forEach(b => {
          if (b.dataset.tab === tab) b.classList.add('active');
          else b.classList.remove('active');
        });
        filterAnimeGrid(tab, 'All');
      } else if (filter) {
        if (filter === 'all') {
          filterAnimeGrid('all', 'All');
        } else if (filter === 'TV Series' || filter === 'Movie') {
          const filtered = currentAnimeList.filter(a => a.type === filter);
          renderAnimeGrid(filtered.length > 0 ? filtered : currentAnimeList);
        } else if (filter === 'dub') {
          const filtered = currentAnimeList.filter(a => a.dubEpisodes && a.dubEpisodes > 0);
          renderAnimeGrid(filtered);
        }
      }
      window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
    });
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const subNav = document.querySelector('.sub-nav');
  if (mobileMenuBtn && subNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isVisible = subNav.style.display === 'block';
      subNav.style.display = isVisible ? 'none' : 'block';
    });
  }

  // Advanced Filter Panel Controls
  const filterBtn = document.getElementById('filterBtn');
  const advancedFilterPanel = document.getElementById('advancedFilterPanel');
  const applyAdvFilterBtn = document.getElementById('applyAdvFilterBtn');
  const resetAdvFilterBtn = document.getElementById('resetAdvFilterBtn');
  const advTypeFilter = document.getElementById('advTypeFilter');
  const advSortFilter = document.getElementById('advSortFilter');
  const advStatusFilter = document.getElementById('advStatusFilter');

  if (filterBtn && advancedFilterPanel) {
    filterBtn.addEventListener('click', () => {
      const isHidden = advancedFilterPanel.style.display === 'none';
      advancedFilterPanel.style.display = isHidden ? 'block' : 'none';
    });
  }

  if (applyAdvFilterBtn) {
    applyAdvFilterBtn.addEventListener('click', () => {
      let list = [...currentAnimeList];
      const type = advTypeFilter.value;
      const sort = advSortFilter.value;
      const status = advStatusFilter.value;

      if (type !== 'all') {
        list = list.filter(a => a.type === type);
      }
      if (status !== 'all') {
        list = list.filter(a => a.status === status);
      }
      if (sort === 'rating') {
        list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (sort === 'name') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === 'episodes') {
        list.sort((a, b) => (b.subEpisodes || 0) - (a.subEpisodes || 0));
      }

      renderAnimeGrid(list);
      window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
    });
  }

  if (resetAdvFilterBtn) {
    resetAdvFilterBtn.addEventListener('click', () => {
      advTypeFilter.value = 'all';
      advSortFilter.value = 'default';
      advStatusFilter.value = 'all';
      filterAnimeGrid('all', 'All');
    });
  }

  // Top 10 Sidebar Tabs (Today, Week, Month)
  document.querySelectorAll('.rank-filter-tabs span').forEach((tab, index) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rank-filter-tabs span').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      let sorted = [...top10Data];
      if (index === 0) {
        sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (index === 1) {
        sorted.sort((a, b) => (b.subEpisodes || 0) - (a.subEpisodes || 0));
      } else {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      }
      renderTop10(sorted);
    });
  });

  // Notifications Popover
  const notifyBtn = document.getElementById('notifyBtn');
  const notificationsPopover = document.getElementById('notificationsPopover');
  const clearNotifyBtn = document.getElementById('clearNotifyBtn');
  const notifyList = document.getElementById('notifyList');

  if (notifyBtn && notificationsPopover) {
    notifyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userPop = document.getElementById('userPopover');
      if (userPop) userPop.classList.remove('show');
      notificationsPopover.classList.toggle('show');
    });
  }

  if (clearNotifyBtn && notifyList) {
    clearNotifyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifyList.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No new notifications</div>`;
      const dot = notifyBtn.querySelector('.dot');
      if (dot) dot.style.display = 'none';
    });
  }

  document.querySelectorAll('.notify-item').forEach(item => {
    item.addEventListener('click', () => {
      const animeId = item.dataset.anime;
      const ep = parseInt(item.dataset.ep) || 1;
      if (notificationsPopover) notificationsPopover.classList.remove('show');
      openWatchModal(animeId, ep);
    });
  });

  // User Profile Popover
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userPopover = document.getElementById('userPopover');
  const profileWatchlistLink = document.getElementById('profileWatchlistLink');
  const profileRandomLink = document.getElementById('profileRandomLink');
  const profileThemeToggle = document.getElementById('profileThemeToggle');
  const userWatchlistCount = document.getElementById('userWatchlistCount');

  if (userAvatarBtn && userPopover) {
    userAvatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (notificationsPopover) notificationsPopover.classList.remove('show');
      if (userWatchlistCount) userWatchlistCount.textContent = watchlist.length;
      userPopover.classList.toggle('show');
    });
  }

  if (profileWatchlistLink) {
    profileWatchlistLink.addEventListener('click', (e) => {
      e.preventDefault();
      userPopover.classList.remove('show');
      renderWatchlistDrawer();
      watchlistDrawer.classList.add('open');
    });
  }

  if (profileRandomLink) {
    profileRandomLink.addEventListener('click', (e) => {
      e.preventDefault();
      userPopover.classList.remove('show');
      randomAnimeBtn.click();
    });
  }

  if (profileThemeToggle) {
    profileThemeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('high-contrast');
      const isHigh = document.body.classList.contains('high-contrast');
      profileThemeToggle.innerHTML = `<i data-lucide="${isHigh ? 'sun' : 'moon'}"></i> ${isHigh ? 'Default Dark Mode' : 'High Contrast Mode'}`;
      if (window.lucide) lucide.createIcons();
    });
  }

  // Episode Navigation: Prev & Next Buttons
  const prevEpBtn = document.getElementById('prevEpBtn');
  const nextEpBtn = document.getElementById('nextEpBtn');

  if (prevEpBtn) {
    prevEpBtn.addEventListener('click', () => {
      if (currentPlayingAnime && currentPlayingEpisode > 1) {
        openWatchModal(currentPlayingAnime.id, currentPlayingEpisode - 1);
      }
    });
  }

  if (nextEpBtn) {
    nextEpBtn.addEventListener('click', () => {
      if (currentPlayingAnime && currentPlayingAnime.episodes) {
        const next = currentPlayingAnime.episodes.find(e => e.number === currentPlayingEpisode + 1);
        if (next) {
          openWatchModal(currentPlayingAnime.id, next.number);
        }
      }
    });
  }

  // Clear Watchlist Button
  const clearWatchlistBtn = document.getElementById('clearWatchlistBtn');
  if (clearWatchlistBtn) {
    clearWatchlistBtn.addEventListener('click', () => {
      if (watchlist.length === 0) return;
      saveProfileWatchlist([]);
      updateWatchlistBadge();
      renderWatchlistDrawer();
    });
  }

  // Information & Legal Modal Handling
  const infoModal = document.getElementById('infoModal');
  const infoOverlay = document.getElementById('infoOverlay');
  const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
  const infoModalTitle = document.getElementById('infoModalTitle');
  const infoModalBody = document.getElementById('infoModalBody');

  function openInfoModal(title, htmlContent) {
    infoModalTitle.textContent = title;
    infoModalBody.innerHTML = htmlContent;
    infoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.lucide) lucide.createIcons();
  }

  function closeInfoModal() {
    infoModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeInfoModalBtn) closeInfoModalBtn.addEventListener('click', closeInfoModal);
  if (infoOverlay) infoOverlay.addEventListener('click', closeInfoModal);

  // Top Bar Community Links
  document.querySelectorAll('.top-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const action = link.dataset.action;
      if (action === 'discord') {
        openInfoModal('HiAnime Discord Community', `
          <p>Join over 150,000 anime fans on our official Discord server!</p>
          <p><strong>Channels:</strong> #episode-releases, #general-chat, #anime-memes, #server-status</p>
          <p><a href="https://discord.gg" target="_blank" style="color:var(--accent-pink); font-weight:700;">Click here to open Discord &rarr;</a></p>
        `);
      } else if (action === 'telegram') {
        openInfoModal('HiAnime Telegram Channel', `
          <p>Get instant push notifications whenever a new episode drops!</p>
          <p><strong>Broadcast Channel:</strong> @HiAnimeOfficial</p>
          <p><a href="https://t.me" target="_blank" style="color:var(--accent-cyan); font-weight:700;">Click here to join Telegram &rarr;</a></p>
        `);
      } else if (action === 'reddit') {
        openInfoModal('HiAnime Reddit Community', `
          <p>Discuss anime theory, episode reactions, and recommendations on Reddit!</p>
          <p><strong>Subreddit:</strong> r/HiAnimeLocal</p>
          <p><a href="https://reddit.com" target="_blank" style="color:var(--accent-orange); font-weight:700;">Click here to visit Reddit &rarr;</a></p>
        `);
      }
    });
  });

  // Footer Links
  document.querySelectorAll('.footer-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const action = link.dataset.action;
      if (action === 'az-list') {
        const sorted = [...currentAnimeList].sort((a, b) => a.title.localeCompare(b.title));
        renderAnimeGrid(sorted);
        window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
      } else if (action === 'airing') {
        filterAnimeGrid('airing', 'All');
        window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
      } else if (action === 'popular') {
        filterAnimeGrid('popular', 'All');
        window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
      } else if (action === 'recent') {
        const recent = [...currentAnimeList].reverse();
        renderAnimeGrid(recent);
        window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
      } else if (action === 'tos') {
        openInfoModal('Terms of Service', `
          <h4>1. Acceptance of Terms</h4>
          <p>HiAnime Localhost is a private local streaming client interface designed for personal educational research and local network streaming testing.</p>
          <h4>2. Disclaimer</h4>
          <p>This software does not store, host, or upload video files onto this server. Video playback is rendered via external streaming endpoints or local bridges.</p>
        `);
      } else if (action === 'dmca') {
        openInfoModal('DMCA & Copyright Policy', `
          <h4>Digital Millennium Copyright Act Notice</h4>
          <p>HiAnime Localhost respects the intellectual property rights of creators and copyright owners. This website serves as an aggregator interface and client gateway for personal educational use.</p>
          <p>No video files are hosted on localhost. All streams are routed to third-party providers. If you have any copyright inquiries, please contact the hosting providers directly.</p>
        `);
      } else if (action === 'contact') {
        openInfoModal('Contact Support', `
          <h4>Get in Touch</h4>
          <p>For inquiries, issues with local streaming, or gateway status, you can reach out through:</p>
          <p><strong>Email:</strong> admin@localhost</p>
          <p><strong>Gateway:</strong> http://localhost:3000</p>
        `);
      } else if (action === 'app-info') {
        openInfoModal('HiAnime App & Gateway', `
          <h4>HiAnime Progressive Web App</h4>
          <p>HiAnime Localhost is fully responsive and supports PWA standalone mode on Desktop and Mobile browsers.</p>
          <p>Enjoy 1080p stream switching, ani-cli integration, and offline-resilient local watchlists.</p>
        `);
      }
    });
  });

  // Random Anime Button
  randomAnimeBtn.addEventListener('click', () => {
    if (currentAnimeList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * currentAnimeList.length);
    openWatchModal(currentAnimeList[randomIndex].id, 1);
  });

  // Watchlist Drawer
  watchlistBtn.addEventListener('click', () => {
    renderWatchlistDrawer();
    watchlistDrawer.classList.add('open');
  });
  closeDrawerBtn.addEventListener('click', () => {
    watchlistDrawer.classList.remove('open');
  });

  // Clear Watch History Button
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      clearAllWatchHistory();
    });
  }

  // Player Tool Buttons (Lights Off & Theater Mode)
  if (lightsOffBtn) {
    lightsOffBtn.addEventListener('click', () => {
      toggleLightsOff();
    });
  }
  if (lightsOffOverlay) {
    lightsOffOverlay.addEventListener('click', () => {
      toggleLightsOff(false);
    });
  }
  if (theaterModeBtn) {
    theaterModeBtn.addEventListener('click', () => {
      toggleTheaterMode();
    });
  }

  const sandboxLockBtn = document.getElementById('sandboxLockBtn');
  if (sandboxLockBtn) {
    updateSandboxLockBtnUI();
    sandboxLockBtn.addEventListener('click', toggleSandboxLock);
  }

  // Auto-Next Checkbox Persistence
  if (autoNextCheck) {
    const autoNextSaved = localStorage.getItem('hianime_auto_next');
    if (autoNextSaved !== null) {
      autoNextCheck.checked = autoNextSaved === 'true';
    }
    autoNextCheck.addEventListener('change', () => {
      localStorage.setItem('hianime_auto_next', autoNextCheck.checked);
    });
  }

  // Player Modal Close
  closeModalBtn.addEventListener('click', closeWatchModal);
  playerOverlay.addEventListener('click', closeWatchModal);
  modalBookmarkBtn.addEventListener('click', () => {
    if (currentPlayingAnime) toggleWatchlist(currentPlayingAnime.id);
  });

  // Server Switcher Buttons
  document.querySelectorAll('.server-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.server-pill').forEach(p => p.classList.remove('active'));
      const targetPill = e.target.closest('.server-pill');
      if (!targetPill) return;
      targetPill.classList.add('active');
      currentServer = targetPill.dataset.server || 'vidsrc-sub';

      if (currentServer.includes('dub')) {
        userAudioPref = 'DUB';
        localStorage.setItem('hianime_audio_pref', 'DUB');
        syncAudioPrefUI();
      } else {
        userAudioPref = 'SUB';
        localStorage.setItem('hianime_audio_pref', 'SUB');
        syncAudioPrefUI();
      }

      if (currentPlayingAnime) {
        const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
        loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed);
      }
    });
  });

  // Quick Fallback Switcher Button
  const streamQuickSwitchBtn = document.getElementById('streamQuickSwitchBtn');
  if (streamQuickSwitchBtn) {
    streamQuickSwitchBtn.addEventListener('click', () => {
      cycleNextServer();
    });
  }

  // Community & Tools Event Listeners (v4.0)
  if (bookmarkSceneBtn) {
    bookmarkSceneBtn.addEventListener('click', addSceneBookmark);
  }
  if (commentForm) {
    commentForm.addEventListener('submit', submitCommentForm);
  }

  // Watch Party Listeners
  if (watchPartyBtn) {
    watchPartyBtn.addEventListener('click', openWatchParty);
  }
  if (closePartyDrawerBtn) {
    closePartyDrawerBtn.addEventListener('click', closeWatchParty);
  }
  if (copyPartyLinkBtn) {
    copyPartyLinkBtn.addEventListener('click', copyPartyInviteLink);
  }
  if (partyChatForm) {
    partyChatForm.addEventListener('submit', sendPartyChatMessage);
  }

  // Backup Export & Import Listeners
  if (exportBackupBtn) {
    exportBackupBtn.addEventListener('click', exportHiAnimeBackup);
  }
  if (importBackupBtn) {
    importBackupBtn.addEventListener('click', triggerImportBackup);
  }
  if (profileExportBackup) {
    profileExportBackup.addEventListener('click', exportHiAnimeBackup);
  }
  if (profileImportBackup) {
    profileImportBackup.addEventListener('click', triggerImportBackup);
  }
  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImportBackupFile(e.target.files[0]);
      }
    });
  }

  // Mini-Player PiP Button Listener
  if (miniPlayerBtn) {
    miniPlayerBtn.addEventListener('click', () => {
      enterMiniPlayer();
    });
  }

  // Video End - Auto Next Episode
  if (animeVideoPlayer) {
    animeVideoPlayer.addEventListener('ended', () => {
      if (autoNextCheck && autoNextCheck.checked && currentPlayingAnime && currentPlayingAnime.episodes) {
        const nextEp = currentPlayingAnime.episodes.find(e => e.number === currentPlayingEpisode + 1);
        if (nextEp) {
          openWatchModal(currentPlayingAnime.id, nextEp.number);
        }
      }
    });
  }

  // Episode Search Filter
  epSearchInput.addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.episode-row').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? 'flex' : 'none';
    });
  });

  // Close popovers on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-wrapper')) {
      if (notificationsPopover) notificationsPopover.classList.remove('show');
      if (userPopover) userPopover.classList.remove('show');
    }
  });

  // Global Keyboard Shortcuts (N, P, L, T, Ctrl+K, ESC)
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // Command Palette Trigger: Ctrl+K / Cmd+K
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    if (e.key === 'Escape') {
      if (commandPaletteModal && commandPaletteModal.classList.contains('active')) {
        closeCommandPalette();
        return;
      }
      if (adminStudioModal && adminStudioModal.classList.contains('active')) {
        closeAdminStudio();
        return;
      }
      if (otakuWrappedModal && otakuWrappedModal.classList.contains('active')) {
        closeOtakuStats();
        return;
      }
      if (playerModal && playerModal.classList.contains('lights-off')) {
        toggleLightsOff(false);
        return;
      }
      closeWatchModal();
      closeInfoModal();
      if (watchlistDrawer) watchlistDrawer.classList.remove('open');
      if (searchDropdown) searchDropdown.classList.remove('show');
      if (notificationsPopover) notificationsPopover.classList.remove('show');
      if (userPopover) userPopover.classList.remove('show');
      return;
    }

    if (!isTyping && playerModal && playerModal.classList.contains('active')) {
      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        if (nextEpBtn) nextEpBtn.click();
      } else if (key === 'p') {
        e.preventDefault();
        if (prevEpBtn) prevEpBtn.click();
      } else if (key === 'l') {
        e.preventDefault();
        toggleLightsOff();
      } else if (key === 't') {
        e.preventDefault();
        toggleTheaterMode();
      }
    }
  });
}

// Live Airing Schedule Functions
async function initSchedule() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDay = days[new Date().getDay()];

  const dayButtons = document.querySelectorAll('.schedule-day-btn');
  dayButtons.forEach(btn => {
    if (btn.dataset.day === todayDay) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.addEventListener('click', () => {
      dayButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSchedule(btn.dataset.day);
    });
  });

  await loadSchedule(todayDay);
}

async function loadSchedule(day) {
  if (!scheduleGrid) return;
  try {
    const res = await fetch(apiUrl(`/api/live/schedule?day=${encodeURIComponent(day)}`)).then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null);
    if (res && res.success && res.data && res.data.length > 0) {
      renderScheduleGrid(res.data);
      return;
    }
  } catch (_) {}

  // Instant responsive fallback for static hosts and offline mode
  if (currentAnimeList && currentAnimeList.length > 0) {
    const times = ['18:00 (JST)', '19:30 (JST)', '21:00 (JST)', '22:30 (JST)', '23:00 (JST)', '23:30 (JST)'];
    const fallbackItems = currentAnimeList.slice(0, 6).map((anime, i) => ({
      id: anime.id,
      malId: anime.malId || '52299',
      title: anime.title,
      image: anime.poster || anime.cover,
        broadcastTime: times[i % times.length],
        currentEp: Math.min((i + 1) * 2, anime.subEpisodes || 12),
        score: anime.rating || '8.8',
        type: anime.type || 'TV Series'
      }));
      renderScheduleGrid(fallbackItems);
      return;
    }
    scheduleGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: var(--text-muted);">Failed to load schedule. Please try again.</div>`;
  }

function renderScheduleGrid(items) {
  if (!scheduleGrid) return;
  scheduleGrid.innerHTML = items.map(item => `
    <div class="schedule-card" onclick="handleScheduleCardClick('${item.id}', '${item.malId}', '${(item.title || '').replace(/'/g, "\\'")}')">
      <img src="${item.image}" alt="${item.title}" class="schedule-card-thumb" loading="lazy" referrerpolicy="no-referrer">
      <div class="schedule-card-info">
        <span class="schedule-time-badge"><i data-lucide="clock" style="width:12px;height:12px;vertical-align:middle;"></i> ${item.broadcastTime}</span>
        <h4 class="schedule-card-title" title="${item.title}">${item.title}</h4>
        <div class="schedule-card-meta">
          <span class="schedule-ep-pill">EP ${item.currentEp || 1}</span>
          <span>★ ${item.score || '8.5'}</span>
          <span>${item.type || 'TV'}</span>
        </div>
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function handleScheduleCardClick(id, malId, title) {
  const match = currentAnimeList.find(a => a.id === id || String(a.malId) === String(malId) || a.title.toLowerCase() === (title || '').toLowerCase());
  if (match) {
    openWatchModal(match.id, 1);
  } else {
    if (searchInput) {
      searchInput.value = title;
      const matches = currentAnimeList.filter(a => 
        a.title.toLowerCase().includes(title.toLowerCase()) || 
        a.genres.some(g => title.toLowerCase().includes(g.toLowerCase()))
      );
      renderAnimeGrid(matches.length > 0 ? matches : currentAnimeList);
      if (animeGrid) window.scrollTo({ top: animeGrid.offsetTop - 120, behavior: 'smooth' });
    }
  }
}

function getActiveTab() {
  const activeBtn = document.querySelector('.tab-btn.active');
  return activeBtn ? activeBtn.dataset.tab : 'all';
}

function getActiveGenre() {
  const activePill = document.querySelector('.genre-pill.active');
  return activePill ? activePill.dataset.genre : 'All';
}

function filterAnimeGrid(tab, genre) {
  let list = [...currentAnimeList];

  if (genre && genre !== 'All') {
    list = list.filter(a => a.genres.includes(genre));
  }

  if (tab === 'popular') {
    list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  } else if (tab === 'airing') {
    const airing = list.filter(a => a.status === 'Currently Airing');
    list = airing.length > 0 ? airing : list.slice(0, 6);
  } else if (tab === 'completed') {
    list = list.filter(a => a.status === 'Completed');
  }

  renderAnimeGrid(list);
  if (window.lucide) lucide.createIcons();
}

// ========================================================
// v4.0 Community & Interactive Tools Implementations
// ========================================================

// 1. Star Rating Widget Logic
function initStarRating(animeId) {
  if (!starRatingWidget) return;
  const ratings = JSON.parse(localStorage.getItem('hianime_ratings') || '{}');
  const currentRating = ratings[animeId] || 0;
  updateStarRatingDisplay(currentRating);

  const starBtns = starRatingWidget.querySelectorAll('.star-btn');
  starBtns.forEach(btn => {
    btn.onclick = () => {
      const star = parseInt(btn.dataset.star, 10);
      ratings[animeId] = star;
      localStorage.setItem('hianime_ratings', JSON.stringify(ratings));
      updateStarRatingDisplay(star);
    };
    btn.onmouseenter = () => {
      const star = parseInt(btn.dataset.star, 10);
      starBtns.forEach(b => {
        b.classList.toggle('hovered', parseInt(b.dataset.star, 10) <= star);
      });
    };
    btn.onmouseleave = () => {
      starBtns.forEach(b => b.classList.remove('hovered'));
    };
  });
}

function updateStarRatingDisplay(rating) {
  if (!starRatingWidget) return;
  const starBtns = starRatingWidget.querySelectorAll('.star-btn');
  starBtns.forEach(btn => {
    const starVal = parseInt(btn.dataset.star, 10);
    btn.classList.toggle('active', starVal <= rating);
  });
  if (userRatingText) {
    if (rating > 0) {
      const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Masterpiece!'];
      userRatingText.textContent = `${rating}/5 Stars (${labels[rating]})`;
    } else {
      userRatingText.textContent = 'Not rated yet';
    }
  }
}

// 2. Timestamp Bookmarks Logic
function initBookmarks(animeId, episodeNum) {
  if (!bookmarksList) return;
  const bookmarks = JSON.parse(localStorage.getItem(`hianime_bookmarks_${animeId}`) || '[]');
  currentAnimeBookmarks = bookmarks;
  renderBookmarksList(animeId, bookmarks);
}

function renderBookmarksList(animeId, bookmarks) {
  if (!bookmarksList) return;
  if (bookmarksCount) bookmarksCount.textContent = `${bookmarks.length} saved`;
  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `<span class="bookmarks-empty">No scene bookmarks saved yet. Click "Bookmark Scene" to save key moments!</span>`;
    return;
  }
  bookmarksList.innerHTML = bookmarks.map(b => `
    <div class="bookmark-card" title="${b.note || 'Scene Bookmark'}">
      <span onclick="openWatchModal('${animeId}', ${b.epNumber})"><i data-lucide="play-circle" style="width:13px;height:13px;vertical-align:middle;"></i> EP ${b.epNumber}: ${b.note || 'Key Scene'}</span>
      <button class="bookmark-del-btn" onclick="event.stopPropagation(); deleteBookmark('${animeId}', '${b.id}')" title="Delete bookmark">&times;</button>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function addSceneBookmark() {
  if (!currentPlayingAnime) return;
  const note = prompt(`Enter a note for Episode ${currentPlayingEpisode} bookmark:`, `EP ${currentPlayingEpisode} Epic Scene`);
  if (!note) return;

  const animeId = currentPlayingAnime.id;
  const bookmarks = JSON.parse(localStorage.getItem(`hianime_bookmarks_${animeId}`) || '[]');
  const newBookmark = {
    id: 'bm_' + Date.now(),
    epNumber: currentPlayingEpisode,
    note: note.trim(),
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  bookmarks.push(newBookmark);
  localStorage.setItem(`hianime_bookmarks_${animeId}`, JSON.stringify(bookmarks));
  renderBookmarksList(animeId, bookmarks);
}

function deleteBookmark(animeId, bookmarkId) {
  let bookmarks = JSON.parse(localStorage.getItem(`hianime_bookmarks_${animeId}`) || '[]');
  bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
  localStorage.setItem(`hianime_bookmarks_${animeId}`, JSON.stringify(bookmarks));
  renderBookmarksList(animeId, bookmarks);
}

// 3. Episode Discussion & Comments Logic
function initComments(animeId, episodeNum) {
  if (!commentsSection) return;
  const key = `hianime_comments_${animeId}_${episodeNum}`;
  let comments = JSON.parse(localStorage.getItem(key) || 'null');
  if (!comments) {
    comments = [
      {
        id: 'seed_1_' + episodeNum,
        username: 'AnimeSlayer',
        avatarSeed: 'slayer',
        text: `The animation and pacing in Episode ${episodeNum} is absolutely unbelievable! Top-tier studio quality.`,
        isSpoiler: false,
        likes: 12,
        timeAgo: '2 hours ago',
        isUser: false
      },
      {
        id: 'seed_2_' + episodeNum,
        username: 'ShadowMonarch',
        avatarSeed: 'shadow',
        text: `Watch out at the climax when the secret skill unlocks! Cannot believe they kept that twist from the manga!`,
        isSpoiler: true,
        likes: 8,
        timeAgo: '4 hours ago',
        isUser: false
      }
    ];
    localStorage.setItem(key, JSON.stringify(comments));
  }
  renderCommentsFeed(comments, animeId, episodeNum);
}

function renderCommentsFeed(comments, animeId, episodeNum) {
  if (!commentsList) return;
  if (commentsCount) commentsCount.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`;

  if (comments.length === 0) {
    commentsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No comments yet on Episode ${episodeNum}. Be the first to start the discussion!</div>`;
    return;
  }

  commentsList.innerHTML = comments.map(c => `
    <div class="comment-card" id="comment-${c.id}">
      <div class="comment-top">
        <div class="comment-author-wrap">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${c.avatarSeed || 'otaku'}" alt="${c.username}" class="comment-author-avatar">
          <span class="comment-author-name">${c.username}</span>
          <span class="comment-time">${c.timeAgo || 'Just now'}</span>
        </div>
        ${c.isSpoiler ? `<span class="comment-badge-spoiler">SPOILER</span>` : ''}
      </div>
      <div class="comment-content ${c.isSpoiler ? 'comment-spoiler-blurred' : ''}" ${c.isSpoiler ? `onclick="this.classList.toggle('comment-spoiler-blurred');"` : ''} title="${c.isSpoiler ? 'Click to reveal spoiler' : ''}">
        ${c.text}
      </div>
      <div class="comment-bottom">
        <button class="comment-like-btn" onclick="toggleCommentLike('${animeId}', ${episodeNum}, '${c.id}')">
          <i data-lucide="heart" style="width:13px;height:13px;"></i> <span>${c.likes || 0}</span>
        </button>
        ${c.isUser ? `<button class="comment-del-btn" onclick="deleteComment('${animeId}', ${episodeNum}, '${c.id}')"><i data-lucide="trash-2" style="width:12px;height:12px;"></i> Delete</button>` : ''}
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function submitCommentForm(e) {
  e.preventDefault();
  if (!currentPlayingAnime) return;
  const username = (commentUsername.value || '').trim() || 'Anonymous Otaku';
  const text = (commentText.value || '').trim();
  const isSpoiler = commentSpoilerCheck ? commentSpoilerCheck.checked : false;

  if (!text) return;

  const animeId = currentPlayingAnime.id;
  const epNum = currentPlayingEpisode;
  const key = `hianime_comments_${animeId}_${epNum}`;
  const comments = JSON.parse(localStorage.getItem(key) || '[]');

  const newComment = {
    id: 'user_comment_' + Date.now(),
    username: username,
    avatarSeed: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
    text: text,
    isSpoiler: isSpoiler,
    likes: 1,
    timeAgo: 'Just now',
    isUser: true
  };

  comments.unshift(newComment);
  localStorage.setItem(key, JSON.stringify(comments));

  commentText.value = '';
  if (commentSpoilerCheck) commentSpoilerCheck.checked = false;

  renderCommentsFeed(comments, animeId, epNum);
}

function toggleCommentLike(animeId, episodeNum, commentId) {
  const key = `hianime_comments_${animeId}_${episodeNum}`;
  let comments = JSON.parse(localStorage.getItem(key) || '[]');
  const target = comments.find(c => c.id === commentId);
  if (target) {
    target.likes = (target.likes || 0) + 1;
    localStorage.setItem(key, JSON.stringify(comments));
    renderCommentsFeed(comments, animeId, episodeNum);
  }
}

function deleteComment(animeId, episodeNum, commentId) {
  const key = `hianime_comments_${animeId}_${episodeNum}`;
  let comments = JSON.parse(localStorage.getItem(key) || '[]');
  comments = comments.filter(c => c.id !== commentId);
  localStorage.setItem(key, JSON.stringify(comments));
  renderCommentsFeed(comments, animeId, episodeNum);
}

// 4. Watch Party Room & Live Chat Logic
function openWatchParty() {
  if (!watchPartyDrawer) return;
  if (!activePartyRoom) {
    const urlParams = new URLSearchParams(window.location.search);
    const existing = urlParams.get('party');
    activePartyRoom = existing || ('ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase());

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('party', activePartyRoom);
    if (currentPlayingAnime) {
      newUrl.searchParams.set('anime', currentPlayingAnime.id);
      newUrl.searchParams.set('ep', currentPlayingEpisode);
    }
    window.history.replaceState({}, '', newUrl.toString());
  }

  if (partyRoomCode) partyRoomCode.textContent = activePartyRoom;
  watchPartyDrawer.classList.add('open');

  pollPartyMessages();
  if (partyPollTimer) clearInterval(partyPollTimer);
  partyPollTimer = setInterval(pollPartyMessages, 3000);
}

function closeWatchParty() {
  if (watchPartyDrawer) watchPartyDrawer.classList.remove('open');
}

let partyBroadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    partyBroadcastChannel = new BroadcastChannel('hianime_watch_party_sync');
    partyBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.room === activePartyRoom) {
        if (data.type === 'message' && data.message) {
          const cached = getLocalPartyMessages(activePartyRoom);
          if (!cached.find(m => m.id === data.message.id || (m.timestamp === data.message.timestamp && m.text === data.message.text))) {
            cached.push(data.message);
            saveLocalPartyMessages(activePartyRoom, cached);
            renderPartyMessages(cached);
          }
        } else if (data.type === 'sync' && data.animeId && data.episodeNum) {
          if (currentPlayingAnime && data.animeId === currentPlayingAnime.id && data.episodeNum !== currentPlayingEpisode) {
            currentPlayingEpisode = data.episodeNum;
            const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
            loadActivePlayer(streamInfo.url, streamInfo.isEmbed);
            modalEpCrumb.textContent = `Episode ${currentPlayingEpisode}`;
          }
        }
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel error:', e);
}

function getLocalPartyMessages(roomId) {
  try {
    return JSON.parse(localStorage.getItem(`hianime_party_msgs_${roomId}`) || '[]');
  } catch (_) {
    return [];
  }
}

function saveLocalPartyMessages(roomId, msgs) {
  try {
    localStorage.setItem(`hianime_party_msgs_${roomId}`, JSON.stringify(msgs.slice(-50)));
  } catch (_) {}
}

async function pollPartyMessages() {
  if (!activePartyRoom || !partyChatMessages) return;
  const animeId = currentPlayingAnime ? currentPlayingAnime.id : '';
  const ep = currentPlayingEpisode || 1;
  try {
    const res = await fetch(apiUrl(`/api/party/${encodeURIComponent(activePartyRoom)}/messages?anime=${encodeURIComponent(animeId)}&ep=${ep}`)).then(r => r.json());
    if (res && res.success && res.messages) {
      saveLocalPartyMessages(activePartyRoom, res.messages);
      renderPartyMessages(res.messages);

      if (res.animeId && res.episodeNum && currentPlayingAnime) {
        if (res.animeId === currentPlayingAnime.id && res.episodeNum !== currentPlayingEpisode) {
          currentPlayingEpisode = res.episodeNum;
          const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
          loadActivePlayer(streamInfo.url, streamInfo.isEmbed);
          modalEpCrumb.textContent = `Episode ${currentPlayingEpisode}`;
        }
      }
      return;
    }
  } catch (err) {
    // Offline / Backend sleep fallback: read from localStorage
    const localMsgs = getLocalPartyMessages(activePartyRoom);
    if (localMsgs && localMsgs.length > 0) {
      renderPartyMessages(localMsgs);
    }
  }
}

function renderPartyMessages(messages) {
  if (!partyChatMessages) return;
  partyChatMessages.innerHTML = messages.map(m => `
    <div class="party-msg ${m.type || 'chat'}">
      <div class="party-msg-header">
        <span class="party-msg-sender">${m.user}</span>
        <span class="party-msg-time">${m.timestamp}</span>
      </div>
      <div class="party-msg-text">${m.text}</div>
    </div>
  `).join('');
  partyChatMessages.scrollTop = partyChatMessages.scrollHeight;
}

async function sendPartyChatMessage(e) {
  if (e) e.preventDefault();
  if (!activePartyRoom || !partyChatInput) return;
  const text = partyChatInput.value.trim();
  if (!text) return;

  const user = (commentUsername && commentUsername.value.trim()) || 'OtakuFan';
  const newMsg = {
    id: 'msg_' + Date.now(),
    user: user,
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'chat'
  };

  // Immediate local & BroadcastChannel broadcast
  const localMsgs = getLocalPartyMessages(activePartyRoom);
  localMsgs.push(newMsg);
  saveLocalPartyMessages(activePartyRoom, localMsgs);
  renderPartyMessages(localMsgs);
  partyChatInput.value = '';

  if (partyBroadcastChannel) {
    partyBroadcastChannel.postMessage({
      room: activePartyRoom,
      type: 'message',
      message: newMsg
    });
  }

  // Sync to Render backend if reachable
  try {
    await fetch(apiUrl(`/api/party/${encodeURIComponent(activePartyRoom)}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: user,
        text: text,
        animeId: currentPlayingAnime ? currentPlayingAnime.id : null,
        episodeNum: currentPlayingEpisode,
        currentServer: currentServer,
        type: 'chat'
      })
    });
  } catch (err) {
    console.warn('Backend party sync skipped (offline/fallback mode active):', err);
  }
}

function syncWatchPartyEpisode(animeId, episodeNum) {
  if (!activePartyRoom) return;
  if (partyBroadcastChannel) {
    partyBroadcastChannel.postMessage({
      room: activePartyRoom,
      type: 'sync',
      animeId: animeId,
      episodeNum: episodeNum
    });
  }
  fetch(apiUrl(`/api/party/${encodeURIComponent(activePartyRoom)}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: 'HiAnime Sync',
      type: 'sync',
      animeId: animeId,
      episodeNum: episodeNum,
      text: `Host switched to Episode ${episodeNum}`
    })
  }).catch(() => {});
}

function copyPartyInviteLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert(`Party link copied to clipboard!\n${url}`);
  }).catch(() => {
    prompt('Copy this party link to invite friends:', url);
  });
}

function checkUrlPartyParams() {
  const params = new URLSearchParams(window.location.search);
  const party = params.get('party');
  const anime = params.get('anime');
  const ep = parseInt(params.get('ep'), 10) || 1;

  if (party) {
    activePartyRoom = party;
    if (partyRoomCode) partyRoomCode.textContent = party;
    if (anime) {
      setTimeout(() => {
        openWatchModal(anime, ep);
        openWatchParty();
      }, 500);
    } else {
      openWatchParty();
    }
  }
}

// 5. Watchlist & User Backup Export & Import Logic
function exportHiAnimeBackup() {
  const backupData = {
    version: '4.0',
    exportedAt: new Date().toISOString(),
    watchlist: JSON.parse(localStorage.getItem('hianime_watchlist') || '[]'),
    watchHistory: JSON.parse(localStorage.getItem('hianime_watch_history') || '[]'),
    ratings: JSON.parse(localStorage.getItem('hianime_ratings') || '{}'),
    preferences: {
      autoNext: localStorage.getItem('hianime_auto_next') !== 'false',
      theme: 'hianime-dark-neon'
    }
  };

  backupData.bookmarks = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('hianime_bookmarks_')) {
      backupData.bookmarks[k] = JSON.parse(localStorage.getItem(k) || '[]');
    }
  }

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hianime-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerImportBackup() {
  if (importFileInput) {
    importFileInput.click();
  }
}

function handleImportBackupFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.version) {
        throw new Error('Invalid backup file format');
      }

      if (Array.isArray(data.watchlist)) {
        watchlist = data.watchlist;
        localStorage.setItem('hianime_watchlist', JSON.stringify(watchlist));
        updateWatchlistBadge();
        renderWatchlistDrawer();
      }

      if (Array.isArray(data.watchHistory)) {
        watchHistory = data.watchHistory;
        localStorage.setItem('hianime_watch_history', JSON.stringify(watchHistory));
        renderContinueWatching();
      }

      if (data.ratings && typeof data.ratings === 'object') {
        localStorage.setItem('hianime_ratings', JSON.stringify(data.ratings));
      }

      if (data.preferences) {
        if (data.preferences.autoNext !== undefined) {
          localStorage.setItem('hianime_auto_next', data.preferences.autoNext);
          if (autoNextCheck) autoNextCheck.checked = Boolean(data.preferences.autoNext);
        }
      }

      if (data.bookmarks && typeof data.bookmarks === 'object') {
        for (const [k, v] of Object.entries(data.bookmarks)) {
          localStorage.setItem(k, JSON.stringify(v));
        }
      }

      alert('Backup successfully restored! Your Watchlist, History, and Bookmarks have been updated.');
    } catch (err) {
      alert('Failed to import backup: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ========================================================
// v5.0 Enterprise Modules: Theme Engine, Command Palette,
// Admin CMS Studio & Otaku Wrapped Analytics
// ========================================================

// 1. Dynamic Neon Theme Engine
function initThemeEngine() {
  const savedTheme = localStorage.getItem('hianime_theme') || 'sakura';
  applyTheme(savedTheme);

  const dots = document.querySelectorAll('.theme-dot');
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const theme = dot.dataset.theme;
      applyTheme(theme);
    });
  });
}

function applyTheme(themeName) {
  const validThemes = ['sakura', 'crimson', 'cyan', 'purple', 'gold'];
  const theme = validThemes.includes(themeName) ? themeName : 'sakura';
  document.body.dataset.theme = theme;
  localStorage.setItem('hianime_theme', theme);

  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === theme);
  });
}

// 2. Global Command Palette (Ctrl+K / Cmd+K)
function setupPaletteListeners() {
  if (paletteTriggerBtn) {
    paletteTriggerBtn.addEventListener('click', openCommandPalette);
  }
  if (paletteOverlay) {
    paletteOverlay.addEventListener('click', closeCommandPalette);
  }
  if (paletteInput) {
    paletteInput.addEventListener('input', (e) => {
      renderPaletteResults(e.target.value.trim());
    });
    paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigatePalette(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigatePalette(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executePaletteItem(paletteSelectedIndex);
      }
    });
  }
}

function openCommandPalette() {
  if (!commandPaletteModal) return;
  commandPaletteModal.classList.add('active');
  if (paletteInput) {
    paletteInput.value = '';
    paletteInput.focus();
  }
  renderPaletteResults('');
}

function closeCommandPalette() {
  if (!commandPaletteModal) return;
  commandPaletteModal.classList.remove('active');
}

function getPaletteActionItems() {
  return [
    {
      type: 'action',
      title: 'Pop-out Floating Mini-Player (PiP)',
      desc: 'Minimize player into a floating draggable window',
      icon: 'picture-in-picture-2',
      shortcut: '',
      action: () => enterMiniPlayer()
    },
    {
      type: 'action',
      title: 'Switch Profile (Who\'s Watching?)',
      desc: 'Open Netflix-style profile selector with isolated histories',
      icon: 'users',
      shortcut: '',
      action: () => openWhoIsWatching()
    },
    {
      type: 'action',
      title: 'Toggle Lights Off Mode',
      desc: 'Dim everything outside the video player',
      icon: 'lightbulb',
      shortcut: 'L',
      action: () => toggleLightsOff()
    },
    {
      type: 'action',
      title: 'Toggle Theater Mode',
      desc: 'Expand video player to full 95vw width',
      icon: 'maximize-2',
      shortcut: 'T',
      action: () => toggleTheaterMode()
    },
    {
      type: 'action',
      title: 'Open Watchlist Drawer',
      desc: 'View and manage your saved anime titles',
      icon: 'bookmark',
      shortcut: '',
      action: () => {
        renderWatchlistDrawer();
        if (watchlistDrawer) watchlistDrawer.classList.add('open');
      }
    },
    {
      type: 'action',
      title: 'Surprise Me / Random Anime',
      desc: 'Instantly watch a random anime from the catalog',
      icon: 'shuffle',
      shortcut: '',
      action: () => {
        if (currentAnimeList.length > 0) {
          const rand = currentAnimeList[Math.floor(Math.random() * currentAnimeList.length)];
          openWatchModal(rand.id, 1);
        }
      }
    },
    {
      type: 'action',
      title: 'Open Admin CMS Studio',
      desc: 'Add, edit, or feature anime in the hero spotlight',
      icon: 'layout-dashboard',
      shortcut: '',
      action: () => openAdminStudio()
    },
    {
      type: 'action',
      title: 'Otaku Wrapped & User Stats',
      desc: 'View your live watch time, top genres, and rank badges',
      icon: 'bar-chart-2',
      shortcut: '',
      action: () => openOtakuStats()
    },
    {
      type: 'action',
      title: 'Export Profile Backup (JSON)',
      desc: 'Download your full watchlist, history, and bookmarks',
      icon: 'download',
      shortcut: '',
      action: () => exportHiAnimeBackup()
    },
    {
      type: 'action',
      title: 'Switch Theme: Cyberpunk Crimson',
      desc: 'Apply the high-octane crimson red neon palette',
      icon: 'palette',
      shortcut: '',
      action: () => applyTheme('crimson')
    },
    {
      type: 'action',
      title: 'Switch Theme: Electric Cyan',
      desc: 'Apply the futuristic high-tech cyan blue palette',
      icon: 'palette',
      shortcut: '',
      action: () => applyTheme('cyan')
    },
    {
      type: 'action',
      title: 'Switch Theme: Sakura Pink',
      desc: 'Apply the signature HiAnime vibrant pink aesthetic',
      icon: 'palette',
      shortcut: '',
      action: () => applyTheme('sakura')
    },
    {
      type: 'navigation',
      title: 'Filter: Movies',
      desc: 'Show all anime theatrical releases & films',
      icon: 'film',
      shortcut: '',
      action: () => {
        const filterLink = document.querySelector('.sub-nav a[data-filter="Movie"]');
        if (filterLink) filterLink.click();
      }
    },
    {
      type: 'navigation',
      title: 'Filter: Top Airing',
      desc: 'Show all currently airing weekly anime broadcasts',
      icon: 'flame',
      shortcut: '',
      action: () => {
        const tabLink = document.querySelector('.sub-nav a[data-tab="airing"]');
        if (tabLink) tabLink.click();
      }
    },
    {
      type: 'navigation',
      title: 'Filter: Completed Shows',
      desc: 'Show all binge-ready finished anime series',
      icon: 'check-circle',
      shortcut: '',
      action: () => {
        const compLink = document.querySelector('.sub-nav a[data-tab="completed"]');
        if (compLink) compLink.click();
      }
    },
    {
      type: 'navigation',
      title: 'Jump to Estimated Broadcast Schedule',
      desc: 'View Monday–Sunday airing times and live releases',
      icon: 'calendar',
      shortcut: '',
      action: () => {
        if (scheduleGrid) window.scrollTo({ top: scheduleGrid.offsetTop - 140, behavior: 'smooth' });
      }
    }
  ];
}

function renderPaletteResults(query) {
  if (!paletteResults) return;
  const q = (query || '').toLowerCase().trim();
  paletteItemsList = [];

  const actions = getPaletteActionItems().filter(item => 
    !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  );

  const animeMatches = currentAnimeList.filter(anime =>
    !q || anime.title.toLowerCase().includes(q) || 
    (anime.romajiTitle && anime.romajiTitle.toLowerCase().includes(q)) ||
    anime.genres.some(g => g.toLowerCase().includes(q))
  ).slice(0, 15).map(anime => ({
    type: 'anime',
    id: anime.id,
    title: anime.title,
    desc: `${anime.type || 'TV'} • ${anime.subEpisodes || 12} Episodes • ★ ${anime.rating}`,
    icon: 'play-circle',
    shortcut: 'Watch',
    action: () => openWatchModal(anime.id, 1)
  }));

  paletteItemsList = [...actions, ...animeMatches];
  paletteSelectedIndex = 0;

  if (paletteItemsList.length === 0) {
    paletteResults.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
        No results found for "${query}". Try searching an anime title or command.
      </div>
    `;
    return;
  }

  let html = '';
  if (actions.length > 0) {
    html += `<div class="palette-group-title">Quick Actions & Navigation</div>`;
    actions.forEach((item) => {
      const idx = paletteItemsList.indexOf(item);
      html += renderPaletteRow(item, idx);
    });
  }

  if (animeMatches.length > 0) {
    html += `<div class="palette-group-title">Anime Catalog (${animeMatches.length})</div>`;
    animeMatches.forEach((item) => {
      const idx = paletteItemsList.indexOf(item);
      html += renderPaletteRow(item, idx);
    });
  }

  paletteResults.innerHTML = html;
  highlightPaletteSelection();
  if (window.lucide) lucide.createIcons();
}

function renderPaletteRow(item, idx) {
  return `
    <div class="palette-item ${idx === paletteSelectedIndex ? 'active' : ''}" data-idx="${idx}" onclick="executePaletteItem(${idx})">
      <i data-lucide="${item.icon || 'terminal'}" class="palette-item-icon"></i>
      <div class="palette-item-info">
        <div class="palette-item-title">${item.title}</div>
        <div class="palette-item-desc">${item.desc}</div>
      </div>
      ${item.shortcut ? `<span class="palette-item-shortcut"><kbd>${item.shortcut}</kbd></span>` : ''}
    </div>
  `;
}

function navigatePalette(direction) {
  if (paletteItemsList.length === 0) return;
  paletteSelectedIndex = (paletteSelectedIndex + direction + paletteItemsList.length) % paletteItemsList.length;
  highlightPaletteSelection();
}

function highlightPaletteSelection() {
  const items = document.querySelectorAll('.palette-item');
  items.forEach((el, idx) => {
    el.classList.toggle('active', idx === paletteSelectedIndex);
    if (idx === paletteSelectedIndex) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

function executePaletteItem(index) {
  const item = paletteItemsList[index];
  if (item && typeof item.action === 'function') {
    closeCommandPalette();
    item.action();
  }
}

// 3. Built-In Admin Studio / CMS
function setupAdminListeners() {
  if (openAdminStudioBtn) {
    openAdminStudioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminStudio();
    });
  }
  if (closeAdminStudioBtn) {
    closeAdminStudioBtn.addEventListener('click', closeAdminStudio);
  }
  if (adminStudioOverlay) {
    adminStudioOverlay.addEventListener('click', closeAdminStudio);
  }

  // Admin Tab Switching
  const adminTabs = document.querySelectorAll('.admin-tab-btn');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.dataset.tab;
      if (targetTab === 'catalog') {
        document.getElementById('adminTabCatalog').classList.add('active');
        renderAdminCatalogTable();
      } else if (targetTab === 'add') {
        document.getElementById('adminTabAdd').classList.add('active');
      } else if (targetTab === 'spotlight') {
        document.getElementById('adminTabSpotlight').classList.add('active');
        renderSpotlightManagerGrid();
      } else if (targetTab === 'settings') {
        const settingsTab = document.getElementById('adminTabSettings');
        if (settingsTab) settingsTab.classList.add('active');
      } else if (targetTab === 'providers') {
        const providersTab = document.getElementById('adminTabProviders');
        if (providersTab) providersTab.classList.add('active');
        const jsonArea = document.getElementById('adminProvidersJsonTextarea');
        if (jsonArea) {
          loadStreamingProviders();
          jsonArea.value = JSON.stringify(streamingProviders, null, 2);
        }
      }
    });
  });

  const adminSaveProvidersBtn = document.getElementById('adminSaveProvidersBtn');
  const adminResetProvidersBtn = document.getElementById('adminResetProvidersBtn');
  const adminProvidersJsonTextarea = document.getElementById('adminProvidersJsonTextarea');

  if (adminSaveProvidersBtn && adminProvidersJsonTextarea) {
    adminSaveProvidersBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(adminProvidersJsonTextarea.value.trim());
        if (!Array.isArray(parsed)) throw new Error('Providers registry must be a JSON array');
        streamingProviders = parsed;
        localStorage.setItem('hianime_custom_providers', JSON.stringify(parsed, null, 2));
        showToast('Stream providers registry saved!', 'success');
        if (currentPlayingAnime) {
          const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
          loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed, streamInfo.isArchive);
        }
      } catch (err) {
        showToast(`Invalid JSON: ${err.message}`, 'error');
      }
    });
  }

  if (adminResetProvidersBtn && adminProvidersJsonTextarea) {
    adminResetProvidersBtn.addEventListener('click', () => {
      localStorage.removeItem('hianime_custom_providers');
      streamingProviders = DEFAULT_STREAMING_PROVIDERS;
      adminProvidersJsonTextarea.value = JSON.stringify(streamingProviders, null, 2);
      showToast('Providers reset to default registry', 'info');
      if (currentPlayingAnime) {
        const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
        loadActivePlayer(streamInfo.url, streamInfo.isEmbed, streamInfo.isDynamic, streamInfo.fallbackEmbed, streamInfo.isArchive);
      }
    });
  }

  const adminBackendUrlInput = document.getElementById('adminBackendUrlInput');
  const adminSaveBackendUrlBtn = document.getElementById('adminSaveBackendUrlBtn');
  const adminPingBackendBtn = document.getElementById('adminPingBackendBtn');
  const adminBackendStatusPill = document.getElementById('adminBackendStatusPill');

  if (adminBackendUrlInput) {
    adminBackendUrlInput.value = localStorage.getItem('hianime_render_api_url') || (window.location.hostname.includes('github.io') ? 'https://hianime-localweb.onrender.com' : '');
  }

  if (adminSaveBackendUrlBtn && adminBackendUrlInput) {
    adminSaveBackendUrlBtn.addEventListener('click', () => {
      const val = adminBackendUrlInput.value.trim();
      if (val) {
        localStorage.setItem('hianime_render_api_url', val);
        showToast('Render Backend URL updated', 'success');
      } else {
        localStorage.removeItem('hianime_render_api_url');
        showToast('Reset to automatic Backend URL detection', 'info');
      }
    });
  }

  if (adminPingBackendBtn && adminBackendStatusPill) {
    adminPingBackendBtn.addEventListener('click', async () => {
      adminBackendStatusPill.textContent = 'Pinging...';
      adminBackendStatusPill.style.background = 'rgba(255, 190, 11, 0.2)';
      adminBackendStatusPill.style.color = 'var(--accent-gold)';
      try {
        const pingUrl = apiUrl('/api/health');
        const res = await fetch(pingUrl).then(r => r.json());
        if (res && res.status === 'healthy') {
          adminBackendStatusPill.textContent = `Online: HTTP 200 (${res.catalogSize} shows, up ${res.uptime}s)`;
          adminBackendStatusPill.style.background = 'rgba(16, 185, 129, 0.2)';
          adminBackendStatusPill.style.color = '#10b981';
          showToast('Backend online & healthy!', 'success');
        } else {
          adminBackendStatusPill.textContent = 'Degraded Response';
          adminBackendStatusPill.style.background = 'rgba(239, 68, 68, 0.2)';
          adminBackendStatusPill.style.color = '#ef4444';
        }
      } catch (err) {
        adminBackendStatusPill.textContent = 'Offline / Cold Start (Retrying)';
        adminBackendStatusPill.style.background = 'rgba(239, 68, 68, 0.2)';
        adminBackendStatusPill.style.color = '#ef4444';
        showToast('Failed to reach backend: ' + err.message, 'error');
      }
    });
  }

  if (adminAddNewBtn) {
    adminAddNewBtn.addEventListener('click', () => {
      resetAdminForm();
      const addTabBtn = document.querySelector('.admin-tab-btn[data-tab="add"]');
      if (addTabBtn) addTabBtn.click();
    });
  }

  if (adminCatalogSearch) {
    adminCatalogSearch.addEventListener('input', (e) => {
      renderAdminCatalogTable(e.target.value.toLowerCase().trim());
    });
  }

  if (adminAnimeForm) {
    adminAnimeForm.addEventListener('submit', handleAdminFormSubmit);
  }

  if (adminResetBtn) {
    adminResetBtn.addEventListener('click', resetAdminForm);
  }

  // Otaku Stats Listeners
  if (openOtakuStatsBtn) {
    openOtakuStatsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOtakuStats();
    });
  }
  if (closeOtakuWrappedBtn) {
    closeOtakuWrappedBtn.addEventListener('click', closeOtakuStats);
  }
  if (otakuWrappedOverlay) {
    otakuWrappedOverlay.addEventListener('click', closeOtakuStats);
  }
}

function openAdminStudio() {
  if (!adminStudioModal) return;
  if (adminShowsCount) {
    adminShowsCount.textContent = `${currentAnimeList.length} Shows`;
  }
  renderAdminCatalogTable();
  adminStudioModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function closeAdminStudio() {
  if (!adminStudioModal) return;
  adminStudioModal.classList.remove('active');
  document.body.style.overflow = '';
}

function renderAdminCatalogTable(filter = '') {
  if (!adminCatalogTbody) return;
  const filtered = currentAnimeList.filter(a => 
    !filter || a.title.toLowerCase().includes(filter) || 
    (a.genres && a.genres.some(g => g.toLowerCase().includes(filter)))
  );

  adminCatalogTbody.innerHTML = filtered.map(a => `
    <tr>
      <td><img src="${a.poster || a.cover}" alt="${a.title}" class="admin-poster-mini"></td>
      <td><strong>${a.title}</strong></td>
      <td>${a.type || 'TV Series'}</td>
      <td><span class="user-status-badge">${a.status || 'Completed'}</span></td>
      <td>${a.subEpisodes || 12}</td>
      <td>${a.spotlight ? '★ Featured' : '—'}</td>
      <td>
        <button class="admin-action-btn" title="Edit Show" onclick="editAdminShow('${a.id}')"><i data-lucide="edit-3"></i></button>
        <button class="admin-action-btn del" title="Delete Show" onclick="deleteAdminShow('${a.id}')"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function resetAdminForm() {
  if (!adminAnimeForm) return;
  adminEditId.value = '';
  adminFormTitle.value = '';
  adminFormCover.value = '';
  adminFormBanner.value = '';
  adminFormEpisodes.value = '12';
  adminFormType.value = 'TV Series';
  adminFormStatus.value = 'Completed';
  adminFormGenres.value = '';
  adminFormSynopsis.value = '';
  adminFormSpotlight.checked = false;
  if (adminSaveBtn) adminSaveBtn.innerHTML = `<i data-lucide="save"></i> Save Show to Catalog`;
  if (window.lucide) lucide.createIcons();
}

function editAdminShow(id) {
  const anime = currentAnimeList.find(a => a.id === id);
  if (!anime) return;

  adminEditId.value = anime.id;
  adminFormTitle.value = anime.title || '';
  adminFormCover.value = anime.cover || anime.poster || '';
  adminFormBanner.value = anime.banner || '';
  adminFormEpisodes.value = anime.subEpisodes || 12;
  adminFormType.value = anime.type || 'TV Series';
  adminFormStatus.value = anime.status || 'Completed';
  adminFormGenres.value = (anime.genres || []).join(', ');
  adminFormSynopsis.value = anime.synopsis || '';
  adminFormSpotlight.checked = Boolean(anime.spotlight);

  if (adminSaveBtn) adminSaveBtn.innerHTML = `<i data-lucide="check-circle"></i> Update Show`;

  const addTabBtn = document.querySelector('.admin-tab-btn[data-tab="add"]');
  if (addTabBtn) addTabBtn.click();
}

async function handleAdminFormSubmit(e) {
  e.preventDefault();
  const id = adminEditId.value;
  const payload = {
    title: adminFormTitle.value.trim(),
    type: adminFormType.value,
    cover: adminFormCover.value.trim(),
    banner: adminFormBanner.value.trim(),
    subEpisodes: parseInt(adminFormEpisodes.value) || 12,
    status: adminFormStatus.value,
    genres: adminFormGenres.value.split(',').map(g => g.trim()).filter(Boolean),
    synopsis: adminFormSynopsis.value.trim(),
    spotlight: adminFormSpotlight.checked
  };

  try {
    const url = id ? apiUrl(`/api/admin/anime/${encodeURIComponent(id)}`) : apiUrl('/api/admin/anime');
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res && res.success) {
      alert(`Success: ${res.message}`);
      await loadData(); // Refresh UI catalog
      resetAdminForm();
      const catalogTabBtn = document.querySelector('.admin-tab-btn[data-tab="catalog"]');
      if (catalogTabBtn) catalogTabBtn.click();
    } else {
      alert(`Failed to save: ${res.message || 'Unknown error'}`);
    }
  } catch (err) {
    alert(`Server error: ${err.message}`);
  }
}

async function deleteAdminShow(id) {
  const anime = currentAnimeList.find(a => a.id === id);
  if (!confirm(`Are you sure you want to permanently delete "${anime ? anime.title : id}"?`)) return;

  try {
    const res = await fetch(apiUrl(`/api/admin/anime/${encodeURIComponent(id)}`), { method: 'DELETE' }).then(r => r.json());
    if (res && res.success) {
      await loadData();
      renderAdminCatalogTable();
    } else {
      alert(`Delete failed: ${res.message}`);
    }
  } catch (err) {
    alert(`Delete error: ${err.message}`);
  }
}

function renderSpotlightManagerGrid() {
  if (!spotlightManagerGrid) return;
  spotlightManagerGrid.innerHTML = currentAnimeList.map(a => `
    <div class="spotlight-card ${a.spotlight ? 'featured' : ''}">
      <img src="${a.poster || a.cover}" alt="${a.title}" referrerpolicy="no-referrer">
      <div class="spotlight-card-info">
        <h4>${a.title}</h4>
        <button class="spotlight-toggle-btn ${a.spotlight ? 'active' : ''}" onclick="toggleSpotlightStatus('${a.id}')">
          ${a.spotlight ? '★ In Spotlight' : '+ Add Spotlight'}
        </button>
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

async function toggleSpotlightStatus(id) {
  const anime = currentAnimeList.find(a => a.id === id);
  if (!anime) return;

  const newStatus = !anime.spotlight;
  try {
    const res = await fetch(apiUrl(`/api/admin/anime/${encodeURIComponent(id)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotlight: newStatus })
    }).then(r => r.json());

    if (res && res.success) {
      anime.spotlight = newStatus;
      await loadData();
      renderSpotlightManagerGrid();
    }
  } catch (err) {
    console.warn('Failed to toggle spotlight:', err);
  }
}

// 4. User Analytics & Otaku Wrapped Dashboard
function openOtakuStats() {
  if (!otakuWrappedModal || !otakuWrappedBody) return;

  const history = JSON.parse(localStorage.getItem('hianime_watch_history') || '[]');
  const savedWatchlist = JSON.parse(localStorage.getItem('hianime_watchlist') || '[]');
  const ratings = JSON.parse(localStorage.getItem('hianime_ratings') || '{}');

  const totalEpisodesWatched = history.reduce((acc, item) => acc + (item.currentEpisode || 1), 0);
  const estimatedHours = ((totalEpisodesWatched * 24) / 60).toFixed(1);

  // Genre breakdown
  const genreCounts = {};
  history.forEach(item => {
    const anime = currentAnimeList.find(a => a.id === item.animeId);
    if (anime && anime.genres) {
      anime.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxGenreCount = sortedGenres[0] ? sortedGenres[0][1] : 1;

  // Completion calculation
  const completedCount = history.filter(h => h.totalEpisodes && h.currentEpisode >= h.totalEpisodes).length;
  const completionRate = history.length > 0 ? Math.round((completedCount / history.length) * 100) : 0;

  // Otaku Rank
  let otakuRank = 'Genin Rookie';
  if (totalEpisodesWatched >= 100) otakuRank = 'Anime Hashira';
  else if (totalEpisodesWatched >= 40) otakuRank = 'Chunin Veteran';
  else if (totalEpisodesWatched >= 15) otakuRank = 'Jonin Enthusiast';

  otakuWrappedBody.innerHTML = `
    <div class="wrapped-hero-stats">
      <div class="wrapped-stat-card">
        <span class="val">${totalEpisodesWatched}</span>
        <span class="lbl">Episodes Watched</span>
      </div>
      <div class="wrapped-stat-card">
        <span class="val">${estimatedHours}h</span>
        <span class="lbl">Estimated Time</span>
      </div>
      <div class="wrapped-stat-card">
        <span class="val">${completionRate}%</span>
        <span class="lbl">Completion Rate</span>
      </div>
    </div>

    <div>
      <div class="wrapped-section-title"><i data-lucide="award"></i> Otaku Badges & Ranking</div>
      <div class="wrapped-badges-row">
        <span class="otaku-badge highlight"><i data-lucide="crown"></i> Rank: ${otakuRank}</span>
        <span class="otaku-badge"><i data-lucide="flame"></i> 7-Day Watch Streak</span>
        <span class="otaku-badge"><i data-lucide="bookmark"></i> ${savedWatchlist.length} in Watchlist</span>
        <span class="otaku-badge"><i data-lucide="star"></i> ${Object.keys(ratings).length} Rated Anime</span>
      </div>
    </div>

    <div>
      <div class="wrapped-section-title"><i data-lucide="pie-chart"></i> Top Favorite Genres</div>
      <div class="wrapped-genre-bars">
        ${sortedGenres.length > 0 ? sortedGenres.map(([genre, count]) => `
          <div class="genre-bar-row">
            <div class="genre-bar-info">
              <span><strong>${genre}</strong></span>
              <span>${count} shows</span>
            </div>
            <div class="genre-bar-track">
              <div class="genre-bar-fill" style="width: ${Math.round((count / maxGenreCount) * 100)}%;"></div>
            </div>
          </div>
        `).join('') : '<p style="color: var(--text-muted); font-size: 0.85rem;">Watch episodes to generate your dynamic genre affinities!</p>'}
      </div>
    </div>
  `;

  otakuWrappedModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function closeOtakuStats() {
  if (!otakuWrappedModal) return;
  otakuWrappedModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ========================================================
// Netflix-Style "Who's Watching?" Multi-Profile System
// ========================================================
function initProfileSystem() {
  updateProfileUI();
}

function updateProfileUI() {
  const current = getActiveProfile();
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${current.avatar || 'otaku'}`;
  
  // Update navbar user avatar
  const navAvatar = document.querySelector('#userAvatarBtn img');
  if (navAvatar) navAvatar.src = avatarUrl;
  
  // Update popover header
  const popoverAvatar = document.querySelector('.user-popover-avatar');
  if (popoverAvatar) popoverAvatar.src = avatarUrl;
  
  const popoverName = document.querySelector('.user-popover-header h4');
  if (popoverName) popoverName.textContent = current.name;

  const userStatusBadge = document.querySelector('.user-popover-header .user-status-badge');
  if (userStatusBadge) {
    userStatusBadge.textContent = current.isKid ? 'Kids Profile' : 'VIP Member';
  }
}

function setupProfileListeners() {
  if (openWhoWatchingBtn) {
    openWhoWatchingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const userPop = document.getElementById('userPopover');
      if (userPop) userPop.classList.remove('show');
      openWhoIsWatching();
    });
  }
  if (whoIsWatchingOverlay) {
    whoIsWatchingOverlay.addEventListener('click', () => {
      closeWhoIsWatching();
    });
  }
  if (manageProfilesBtn) {
    manageProfilesBtn.addEventListener('click', () => {
      isProfileManageMode = !isProfileManageMode;
      const container = document.querySelector('.who-watching-container');
      if (container) container.classList.toggle('manage-mode', isProfileManageMode);
      manageProfilesBtn.textContent = isProfileManageMode ? 'Done' : 'Manage Profiles';
      if (doneProfilesBtn) doneProfilesBtn.style.display = isProfileManageMode ? 'inline-block' : 'none';
      renderProfilesGrid();
    });
  }
  if (doneProfilesBtn) {
    doneProfilesBtn.addEventListener('click', () => {
      isProfileManageMode = false;
      const container = document.querySelector('.who-watching-container');
      if (container) container.classList.remove('manage-mode');
      manageProfilesBtn.textContent = 'Manage Profiles';
      doneProfilesBtn.style.display = 'none';
      renderProfilesGrid();
    });
  }
  if (addProfileBtn) {
    addProfileBtn.addEventListener('click', () => {
      openProfileEditModal(null);
    });
  }
  if (closeProfileEditBtn) {
    closeProfileEditBtn.addEventListener('click', closeProfileEditModal);
  }
  if (profileEditOverlay) {
    profileEditOverlay.addEventListener('click', closeProfileEditModal);
  }
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileFormSubmit);
  }
  if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener('click', () => {
      const id = editProfileId.value;
      if (id) deleteActiveProfile(id);
    });
  }

  // Avatar Choice Buttons
  const choiceBtns = document.querySelectorAll('.avatar-choice-btn');
  choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      choiceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAvatarSeed = btn.dataset.avatar || 'otaku';
      if (profilePreviewAvatar) {
        profilePreviewAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;
      }
    });
  });
}

function openWhoIsWatching() {
  if (!whoIsWatchingModal) return;
  isProfileManageMode = false;
  const container = document.querySelector('.who-watching-container');
  if (container) container.classList.remove('manage-mode');
  if (manageProfilesBtn) manageProfilesBtn.textContent = 'Manage Profiles';
  if (doneProfilesBtn) doneProfilesBtn.style.display = 'none';

  renderProfilesGrid();
  whoIsWatchingModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeWhoIsWatching() {
  if (!whoIsWatchingModal) return;
  whoIsWatchingModal.classList.remove('active');
  document.body.style.overflow = '';
}

function renderProfilesGrid() {
  if (!profilesGrid) return;
  profilesGrid.innerHTML = profiles.map(p => `
    <div class="profile-card ${p.id === activeProfileId ? 'active' : ''}" onclick="handleProfileCardClick('${p.id}')">
      <div class="profile-avatar-wrap">
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${p.avatar || 'otaku'}" alt="${p.name}" class="profile-avatar-img">
        <div class="profile-edit-overlay"><i data-lucide="edit-2"></i></div>
      </div>
      <span class="profile-card-name">${p.name}</span>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function handleProfileCardClick(profileId) {
  if (isProfileManageMode) {
    openProfileEditModal(profileId);
  } else {
    switchActiveProfile(profileId);
    closeWhoIsWatching();
  }
}

function switchActiveProfile(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  activeProfileId = profile.id;
  localStorage.setItem('hianime_active_profile', activeProfileId);

  // Reload isolated data
  watchlist = loadProfileWatchlist();
  watchHistory = loadProfileWatchHistory();

  // Apply isolated theme
  const savedTheme = localStorage.getItem(`hianime_theme_${activeProfileId}`) || 'sakura';
  applyTheme(savedTheme);

  // Apply profile audio preference
  if (profile.audioPref) {
    setAudioPreference(profile.audioPref);
  }

  // Update UI
  updateProfileUI();
  updateWatchlistBadge();
  renderContinueWatching();
  renderWatchlistDrawer();

  console.log(`[Profile Switcher] Active profile switched to: ${profile.name} (${profile.id})`);
}

function openProfileEditModal(profileId) {
  if (!profileEditModal) return;
  const isEdit = Boolean(profileId);
  const profile = isEdit ? profiles.find(p => p.id === profileId) : null;

  editProfileId.value = isEdit ? profile.id : '';
  profileNameInput.value = isEdit ? profile.name : '';
  selectedAvatarSeed = (isEdit && profile.avatar) ? profile.avatar : 'otaku';

  const modalTitle = document.getElementById('profileEditModalTitle');
  if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Profile' : 'Add Profile';

  if (profilePreviewAvatar) {
    profilePreviewAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;
  }

  // Highlight active avatar choice button
  document.querySelectorAll('.avatar-choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.avatar === selectedAvatarSeed);
  });

  // Only allow deleting if editing and there is more than 1 profile
  if (deleteProfileBtn) {
    deleteProfileBtn.style.display = (isEdit && profiles.length > 1) ? 'inline-flex' : 'none';
  }

  const profileAudioSelect = document.getElementById('profileAudioPrefSelect');
  if (profileAudioSelect) {
    profileAudioSelect.value = (isEdit && profile.audioPref) ? profile.audioPref : userAudioPref;
  }

  profileEditModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function closeProfileEditModal() {
  if (!profileEditModal) return;
  profileEditModal.classList.remove('active');
  if (whoIsWatchingModal && whoIsWatchingModal.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function handleProfileFormSubmit(e) {
  e.preventDefault();
  const id = editProfileId.value;
  const name = profileNameInput.value.trim();
  if (!name) return;

  const audioPref = document.getElementById('profileAudioPrefSelect')?.value || 'SUB';

  if (id) {
    const target = profiles.find(p => p.id === id);
    if (target) {
      target.name = name;
      target.avatar = selectedAvatarSeed;
      target.audioPref = audioPref;
      if (activeProfileId === id) {
        setAudioPreference(audioPref);
      }
    }
  } else {
    const newId = 'p_' + Date.now();
    profiles.push({
      id: newId,
      name: name,
      avatar: selectedAvatarSeed,
      isKid: false,
      audioPref: audioPref
    });
  }

  localStorage.setItem('hianime_profiles', JSON.stringify(profiles));
  closeProfileEditModal();
  renderProfilesGrid();
  updateProfileUI();
}

function deleteActiveProfile(profileId) {
  if (profiles.length <= 1) {
    alert('You cannot delete the only remaining profile.');
    return;
  }
  if (!confirm('Are you sure you want to delete this profile and its viewing history?')) return;

  profiles = profiles.filter(p => p.id !== profileId);
  localStorage.setItem('hianime_profiles', JSON.stringify(profiles));

  if (activeProfileId === profileId) {
    switchActiveProfile(profiles[0].id);
  }

  closeProfileEditModal();
  renderProfilesGrid();
}

// ========================================================
// Floating Draggable Picture-in-Picture Mini-Player
// ========================================================
function setupMiniPlayerListeners() {
  if (miniExpandBtn) {
    miniExpandBtn.addEventListener('click', expandMiniPlayer);
  }
  if (miniCloseBtn) {
    miniCloseBtn.addEventListener('click', closeMiniPlayer);
  }
  if (miniPrevBtn) {
    miniPrevBtn.addEventListener('click', () => {
      if (currentPlayingAnime && currentPlayingEpisode > 1) {
        changeMiniPlayerEpisode(currentPlayingEpisode - 1);
      }
    });
  }
  if (miniNextBtn) {
    miniNextBtn.addEventListener('click', () => {
      if (currentPlayingAnime) {
        changeMiniPlayerEpisode(currentPlayingEpisode + 1);
      }
    });
  }

  setupMiniPlayerDrag();
}

function enterMiniPlayer() {
  if (!currentPlayingAnime) return;
  const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
  
  if (miniIframePlayer) {
    miniIframePlayer.src = streamInfo.url;
  }
  if (miniAnimeTitle) {
    miniAnimeTitle.textContent = currentPlayingAnime.title;
  }
  if (miniEpCrumb) {
    miniEpCrumb.textContent = `EP ${currentPlayingEpisode}`;
  }
  if (miniServerBadge) {
    miniServerBadge.textContent = currentServer.toUpperCase();
  }

  // Close full player modal without stopping state
  playerModal.classList.remove('active');
  toggleLightsOff(false);
  document.body.style.overflow = '';
  if (animeEmbedPlayer) {
    animeEmbedPlayer.src = 'about:blank';
  }

  // Show floating mini player
  if (floatingMiniPlayer) {
    floatingMiniPlayer.classList.add('active');
  }
  if (window.lucide) lucide.createIcons();
}

function expandMiniPlayer() {
  if (!currentPlayingAnime) return;
  const animeId = currentPlayingAnime.id;
  const ep = currentPlayingEpisode;

  closeMiniPlayer();
  openWatchModal(animeId, ep);
}

function closeMiniPlayer() {
  if (miniIframePlayer) {
    miniIframePlayer.src = 'about:blank';
  }
  if (floatingMiniPlayer) {
    floatingMiniPlayer.classList.remove('active');
  }
}

function changeMiniPlayerEpisode(newEp) {
  if (!currentPlayingAnime) return;
  currentPlayingEpisode = newEp;
  const streamInfo = getServerStreamUrl(currentServer, currentPlayingAnime, currentPlayingEpisode);
  if (miniIframePlayer) {
    miniIframePlayer.src = streamInfo.url;
  }
  if (miniEpCrumb) {
    miniEpCrumb.textContent = `EP ${currentPlayingEpisode}`;
  }
  saveWatchProgress(currentPlayingAnime, currentPlayingEpisode);
}

function setupMiniPlayerDrag() {
  if (!miniPlayerDragHandle || !floatingMiniPlayer) return;
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  function onMouseDown(e) {
    if (e.target.closest('.mini-player-actions') || e.target.closest('.mini-btn')) return;
    isDragging = true;
    const rect = floatingMiniPlayer.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    floatingMiniPlayer.style.bottom = 'auto';
    floatingMiniPlayer.style.right = 'auto';
    floatingMiniPlayer.style.left = `${initialLeft}px`;
    floatingMiniPlayer.style.top = `${initialTop}px`;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    const maxLeft = window.innerWidth - floatingMiniPlayer.offsetWidth - 10;
    const maxTop = window.innerHeight - floatingMiniPlayer.offsetHeight - 10;

    newLeft = Math.max(10, Math.min(newLeft, maxLeft));
    newTop = Math.max(10, Math.min(newTop, maxTop));

    floatingMiniPlayer.style.left = `${newLeft}px`;
    floatingMiniPlayer.style.top = `${newTop}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  miniPlayerDragHandle.addEventListener('mousedown', onMouseDown);

  miniPlayerDragHandle.addEventListener('touchstart', (e) => {
    if (e.target.closest('.mini-player-actions') || e.target.closest('.mini-btn')) return;
    const touch = e.touches[0];
    isDragging = true;
    const rect = floatingMiniPlayer.getBoundingClientRect();
    startX = touch.clientX;
    startY = touch.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    floatingMiniPlayer.style.bottom = 'auto';
    floatingMiniPlayer.style.right = 'auto';
    floatingMiniPlayer.style.left = `${initialLeft}px`;
    floatingMiniPlayer.style.top = `${initialTop}px`;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    const maxLeft = window.innerWidth - floatingMiniPlayer.offsetWidth - 10;
    const maxTop = window.innerHeight - floatingMiniPlayer.offsetHeight - 10;

    newLeft = Math.max(10, Math.min(newLeft, maxLeft));
    newTop = Math.max(10, Math.min(newTop, maxTop));

    floatingMiniPlayer.style.left = `${newLeft}px`;
    floatingMiniPlayer.style.top = `${newTop}px`;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// Setup Custom Stream & Local Video File Loader Listeners
function setupCustomStreamListeners() {
  const openBtn = document.getElementById('openCustomStreamModalBtn');
  const modal = document.getElementById('customStreamModal');
  const closeBtn = document.getElementById('closeCustomStreamBtn');
  const overlay = document.getElementById('customStreamOverlay');
  const tabUrlBtn = document.getElementById('tabCustomUrlBtn');
  const tabLocalBtn = document.getElementById('tabCustomLocalBtn');
  const urlTabContent = document.getElementById('customUrlTabContent');
  const localTabContent = document.getElementById('customLocalTabContent');

  if (!modal) return;

  function closeModal() {
    modal.style.display = 'none';
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      if (window.lucide) lucide.createIcons();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  if (tabUrlBtn && tabLocalBtn) {
    tabUrlBtn.addEventListener('click', () => {
      tabUrlBtn.classList.add('active');
      tabUrlBtn.style.background = 'var(--accent-pink)';
      tabUrlBtn.style.color = '#fff';
      tabLocalBtn.classList.remove('active');
      tabLocalBtn.style.background = 'var(--bg-tertiary)';
      tabLocalBtn.style.color = 'var(--text-muted)';
      if (urlTabContent) urlTabContent.style.display = 'block';
      if (localTabContent) localTabContent.style.display = 'none';
    });

    tabLocalBtn.addEventListener('click', () => {
      tabLocalBtn.classList.add('active');
      tabLocalBtn.style.background = 'var(--accent-pink)';
      tabLocalBtn.style.color = '#fff';
      tabUrlBtn.classList.remove('active');
      tabUrlBtn.style.background = 'var(--bg-tertiary)';
      tabUrlBtn.style.color = 'var(--text-muted)';
      if (localTabContent) localTabContent.style.display = 'block';
      if (urlTabContent) urlTabContent.style.display = 'none';
    });
  }

  // Play Direct Custom URL
  const playUrlBtn = document.getElementById('playCustomUrlBtn');
  const streamUrlInput = document.getElementById('customStreamUrlInput');
  const subtitleUrlInput = document.getElementById('customSubtitleUrlInput');

  if (playUrlBtn && streamUrlInput) {
    playUrlBtn.addEventListener('click', () => {
      const url = streamUrlInput.value.trim();
      if (!url) {
        showToast('Please enter a valid stream URL', 'warning');
        return;
      }
      closeModal();
      const isDirectMedia = url.includes('.m3u8') || url.includes('.mp4') || url.includes('.webm');
      showToast('Loading custom stream...', 'info');
      loadActivePlayer(url, !isDirectMedia);

      const subUrl = subtitleUrlInput?.value?.trim();
      if (subUrl && isDirectMedia) {
        const neonHlsPlayer = document.getElementById('neonHlsPlayer');
        if (neonHlsPlayer) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = 'Custom Subtitles';
          track.srclang = 'en';
          track.src = subUrl;
          track.default = true;
          neonHlsPlayer.appendChild(track);
        }
      }
    });
  }

  // Mount & Play Local File
  const playLocalBtn = document.getElementById('playCustomLocalBtn');
  const localVideoInput = document.getElementById('customLocalVideoInput');
  const localSubInput = document.getElementById('customLocalSubInput');

  if (playLocalBtn && localVideoInput) {
    playLocalBtn.addEventListener('click', () => {
      const file = localVideoInput.files?.[0];
      if (!file) {
        showToast('Please select a local video file', 'warning');
        return;
      }
      closeModal();
      const videoBlobUrl = URL.createObjectURL(file);
      showToast(`Mounted local file: ${file.name}`, 'success');

      loadActivePlayer(videoBlobUrl, false);

      const subFile = localSubInput?.files?.[0];
      if (subFile) {
        const subBlobUrl = URL.createObjectURL(subFile);
        const neonHlsPlayer = document.getElementById('neonHlsPlayer');
        if (neonHlsPlayer) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = subFile.name;
          track.srclang = 'en';
          track.src = subBlobUrl;
          track.default = true;
          neonHlsPlayer.appendChild(track);
        }
      }
    });
  }
}


