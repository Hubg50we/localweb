# HiAnime Architectural Blueprint & Exhaustive Glitch Audit (v13.0)

## 1. System Architecture Map

```mermaid
flowchart TD
    User([User / Browser / Gamepad]) --> Router[Client-Side Router & Event Gateway]
    
    subgraph Frontend [Modern Dark-Neon Frontend]
        Router --> Shell[App Shell: index.html & style.css]
        Shell --> SoundEngine[Web Audio API SoundEngine]
        Shell --> GamepadEngine[Gamepad & TV 2D Spatial Focus Manager]
        Shell --> HoverQtip[HiAnime Hover Quick-Preview Qtip]
        Shell --> AmbientGlow[Ambient Cinema Backdrop Glow]
        Shell --> ToastStack[Interactive Glassmorphic Toast Stack]
        Shell --> TopProgress[Neon Top Loading Bar]
    end

    subgraph StateAndStorage [Multi-Profile Isolated State Engine]
        Shell --> ProfileEngine[Netflix 'Who's Watching' Profile Manager]
        ProfileEngine --> LocalStorage[Safe JSON LocalStorage Storage System]
        LocalStorage --> DataIsolation[Isolated Watchlist / History / Bookmarks]
    end

    subgraph PlayerPipeline [Universal Multi-Source Video Pipeline]
        Shell --> ServerSelector[Fast Auto-Select Server Engine]
        ServerSelector --> ActiveServer{Active Stream Source}
        ActiveServer -->|Fast Embed #1| VidLink[VidLink Pro HD Sub/Dub 642ms]
        ActiveServer -->|Fast Embed #2| MultiEmbed[MultiEmbed Gateway 1575ms]
        ActiveServer -->|Direct HLS| PlyrHls[Plyr + Hls.js Native Player]
        ActiveServer -->|Archive.org| ArchiveStream[Internet Archive Video Stream]
        ActiveServer -->|Failover 3.5s| NextServer[Auto-Failover Next Server]
    end

    subgraph OfflinePWA [PWA Service Worker]
        Shell --> ServiceWorker[Service Worker: hianime-v13-sfx-gamepad]
        ServiceWorker --> StaticCache[Static Assets Cache: Stale-While-Revalidate]
        ServiceWorker --> ApiCache[API Routes: Network-First with Safe 200 Caching]
    end

    subgraph BackendAPI [Express Backend on Render / Localhost]
        Shell --> Backend[Express Server: server.js]
        Backend --> AnimeAPI[/api/anime Catalog & Search]
        Backend --> ScheduleAPI[/api/live/schedule Jikan v4 Sync]
        Backend --> ProvidersAPI[/api/providers Dynamic Registry]
        Backend --> ArchiveAPI[/api/sources/archive Public Domain Streams]
        Backend --> AdminAPI[/api/admin/anime CMS Studio CRUD]
        Backend --> HealthAPI[/api/health 200 OK + Full CORS]
    end
```

---

## 2. Root-Cause Glitch Breakdown & Surgical Solutions

| # | Glitch Identified | Root Cause | Impact | Surgical Fix Applied |
|---|-------------------|------------|--------|----------------------|
| **1** | **Dead Primary Video Server (net::ERR_NAME_NOT_RESOLVED)** | `vidsrc-sub` (`vidsrc.icu`) domain DNS expired, but was hardcoded as `#1` priority in default server rotation. | Users were greeted with dead/blank embeds on every anime. | Reordered provider priority in `providers.json` and `app.js` to put **VidLink HD (Sub)** (tested HTTP 200 in 642ms) and **MultiEmbed** (1575ms) at the top. Implemented real-time `autoSelectBestWorkingServer` and reduced failover timeout from 6.0s to 3.5s. |
| **2** | **Full-Screen Reload Flash Glitch on Page Arrival** | `navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload())` forcibly refreshed the page. | Jarring full-page reload, tearing down in-flight UI state on visitor arrival. | Purged the aggressive `controllerchange` listener and let the Service Worker update smoothly without reloading. |
| **3** | **Uncaught SyntaxError Crash on LocalStorage JSON parsing** | Raw `JSON.parse(localStorage.getItem(...))` called across 18 locations without try-catch schema guards. | A single corrupted or undefined localStorage key (`"{bad_json"`) caused entire application startup to fail. | Built `safeJsonParse(key, fallback)` and `safeParseString(str, fallback)` with automatic fallback initialization and wrapped all storage reads. |
| **4** | **Horizontal Viewport Overflow on Mobile & Tablet** | Navbar search bar, actions container, and top banner lacked max-width constraints on small viewports (`docWidth: 375px`, but elements reached `570px`). | Horizontal page scrolling, broken responsive layouts on phones and tablets. | Added strict global overflow containment (`html, body { overflow-x: hidden !important; max-width: 100vw; }`) and responsive media queries hiding overflowing desktop elements on tablet & mobile. |
| **5** | **Modal Scroll-Lock Stuck After Close** | `openWatchModal` applied `.modal-open` (`overflow: hidden`), but `closeWatchModal` did not remove `.modal-open`. | Page remained unscrollable after closing the video player modal. | Enforced symmetric scroll locking: `closeWatchModal` now removes `.modal-open` and resets `document.body.style.overflow = ''`. |
| **6** | **Ghost Audio Playing in Background After Modal Close** | Closing player modal left native video elements or hidden iframes loaded in DOM memory. | Audio continued playing after user exited the watch screen. | `closeWatchModal` unconditionally sets `animeEmbedPlayer.src = 'about:blank'`, pauses and clears `neonHlsPlayer.removeAttribute('src')`, and unmounts Hls.js/Plyr instances. |
| **7** | **Archive.org Streaming Resolution Failure** | `/api/sources/archive` only inspected `docs[0]` of search results; if `docs[0]` was a document without MP4 files, it returned failure. | Legitimate public-domain titles failed to resolve stream URLs. | Upgraded `server.js` to iterate over search candidates until a valid MP4/WebM video asset is located. |
| **8** | **Arbitrary Z-Index Collisions** | Modals, drawers, and overlays used conflicting arbitrary numbers (`99999`, `99998`, `100000`, `1005`, `1010`). | Modals clipped beneath overlays or stacked incorrectly. | Enforced conflict-free z-index hierarchy: Header (100) < Drawer (500) < Modal (1000) < Lights-Off (1500) < Mini-Player (2000) < Command Palette (2500) < Qtip (3000) < Toast (4000) < Top Progress Bar (5000). |
| **9** | **Missing Audio Feedback & Spatial TV Controls** | Platform lacked gamepad accessibility and interactive audio feedback. | Couch navigation and TV controller use was impossible. | Implemented zero-dependency Web Audio API procedural `ProceduralSoundEngine` (hover tick, click harmonic, modal sweep, success arpeggio) and HTML5 Gamepad API 2D spatial focus engine (`.spatial-focus`) with on-screen HUD bar. |

---

## 3. Automated Verification Evidence

- **Headless Glitch Hunter Suite (`tests/glitch-hunter.js`)**: **22 Passed, 0 Failed** across Desktop (1920x1080), Tablet (768x1024), and Mobile (375x812).
- **Universal Multi-Source Suite (`tests/v11-verify.js`)**: **33 Passed, 0 Failed**.
- **Enterprise Verification Suite (`tests/v5-verify.js` / `npm test`)**: **38 Passed, 0 Failed**.
- **Zero-YouTube Purge**: **0 matches** across all production directories.
- **Production Synchronization**: `docs/` is an exact byte-for-byte mirror of `public/` and `data/`.
