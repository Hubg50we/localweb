# HiAnime LocalWeb v4.0

> Full-featured anime streaming and discovery platform with a 50+ show catalog, live broadcast schedules, Watch Party rooms with live chat, interactive episode comments, timestamp bookmarks, 5-star ratings, Watchlist backup export/import, and one-click cloud deployment.

![HiAnime LocalWeb](https://images.alphacoders.com/134/1347318.png)

## Overview

**HiAnime LocalWeb v4.0** is an ad-free, production-ready web application providing an authentic anime streaming experience. It combines real anime episode playback across multiple open streaming providers with rich metadata, live Japanese broadcast schedules, synchronized Watch Party rooms, community discussions, and an interactive modern dark-neon interface.

## Key Features

- **Expanded Catalog (50+ Shows)**:
  - 54 hand-curated popular and seasonal anime (Solo Leveling, Jujutsu Kaisen, Demon Slayer, Attack on Titan, Frieren, Chainsaw Man, One Piece, Bleach, Oshi no Ko, and more).
  - Every title includes full metadata, high-resolution posters/banners, synopses, and generated episode lists.
- **Multi-Server Streaming**: Seamless switching between top providers:
  - **VidSrc HD (1080p)** (Sub)
  - **MultiEmbed (Auto 4K)** (Sub)
  - **2Embed (Fast)** (Sub)
  - **VidSrc Dub** (Dubbed stream)
  - **StreamWish** (Dubbed stream)
- **Watch Party Rooms & Live Chat**:
  - One-click shareable room code (`?party=<roomId>&anime=<id>&ep=<ep>`).
  - Real-time side-chat drawer and automatic episode synchronization across multiple viewers.
- **Interactive Community & Episode Discussions**:
  - Episode discussion feed with realistic community commentary.
  - User comment form with custom username, spoiler blur toggle (reveals on click), like counter, and comment deletion.
- **1–5 Star Rating Widget**:
  - Interactive rating widget persisted to `localStorage` (`hianime_ratings`).
- **Timestamp Scene Bookmarks**:
  - Bookmark favorite scenes with custom notes to jump back to memorable moments at any time.
- **Watchlist Backup Export & Import**:
  - One-click JSON backup export (`hianime-backup.json`) preserving your Watchlist, Watch History, Star Ratings, and Scene Bookmarks.
  - Seamless backup import to restore your profile across devices.
- **"Continue Watching" History Tracker**:
  - Automatically records episode progress to `localStorage` (`hianime_watch_history`).
  - Horizontal progress rail with episode percentage bars and one-click resumption.
- **Player Controls & Cinema Experience**:
  - **Lights Off Mode (`L`)**: Dims the background to 95% black for focused viewing.
  - **Theater Mode (`T`)**: Expands video container to `95vw` and stacks the episode sidebar below.
  - **Auto-Next Persistence**: Automatically advances to the next episode when the current one ends.
  - **Quick Episode Navigation (`N` / `P`)**: Next and previous episode hotkeys.
  - **ESC**: Exit Lights Off mode or dismiss overlays.
- **Live Airing Schedule & Seasonal Sync**:
  - Real-time broadcast schedule fetched from Jikan v4 (MyAnimeList) with 30-minute in-memory caching and resilient local fallback.
- **Progressive Web App (PWA)**:
  - Installable on desktop and mobile devices via `manifest.json` with theme color `#ffbade`.

## Keyboard Shortcuts

| Shortcut | Action |
|:---:|:---|
| <kbd>N</kbd> | Next Episode |
| <kbd>P</kbd> | Previous Episode |
| <kbd>L</kbd> | Toggle Lights Off Mode |
| <kbd>T</kbd> | Toggle Theater Mode |
| <kbd>Esc</kbd> | Exit Lights Off or Close Modal |

## Cloud Deployment (GitHub One-Click)

The repository includes pre-configured deployment blueprints for zero-configuration cloud hosting:

### 1. Render (`render.yaml`)
1. Create a new Web Service on [Render](https://render.com/).
2. Select your repository `https://github.com/Hubg50we/localweb`.
3. Render automatically picks up `render.yaml` with:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: Automatic via `process.env.PORT`

### 2. Railway (`railway.json` & `Procfile`)
1. On [Railway](https://railway.app/), click **New Project** → **Deploy from GitHub repo**.
2. Select `Hubg50we/localweb`.
3. Railway immediately deploys the web service with zero manual settings.

### 3. Fly.io / Heroku
- A standard `Procfile` (`web: node server.js`) is included for automatic containerization.

## Local Development (Optional)

1. Clone repository:
   ```bash
   git clone https://github.com/Hubg50we/localweb.git
   cd localweb
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000`.

## License

MIT License. Designed with the HiAnime dark-neon aesthetic.
