# HiAnime LocalWeb v3.1

> High-speed local anime streaming and discovery platform inspired by HiAnime with live broadcast schedules, multi-provider playback, Continue Watching history, Theater & Lights Off modes, and PWA support.

![HiAnime LocalWeb](https://images.alphacoders.com/134/1347318.png)

## Overview

**HiAnime LocalWeb** is an ad-free, local web application providing an authentic anime streaming experience. It combines real anime episode playback across multiple open streaming providers with rich metadata, live Japanese broadcast schedules, and an interactive modern dark-neon interface.

## Key Features

- **Multi-Server Streaming**: Seamless switching between top providers:
  - **VidSrc HD (1080p)** (Sub)
  - **MultiEmbed (Auto 4K)** (Sub)
  - **2Embed (Fast)** (Sub)
  - **VidSrc Dub** (Dubbed stream)
  - **StreamWish** (Dubbed stream)
- **"Continue Watching" History Tracker**:
  - Automatically records episode progress to `localStorage` (`hianime_watch_history`)
  - Horizontal progress rail with episode percentage bars
  - One-click instant episode resumption, individual card removal (`✕`), and `Clear History`
- **Player Controls & Cinema Experience**:
  - **Lights Off Mode (`L`)**: Dims the background to 95% black for focused viewing
  - **Theater Mode (`T`)**: Expands video container to `95vw` and stacks the episode sidebar below
  - **Auto-Next Persistence**: Automatically advances to the next episode when the current one ends (persisted in `localStorage`)
  - **Quick Episode Navigation (`N` / `P`)**: Next and previous episode hotkeys
  - **ESC**: Exit Lights Off mode or dismiss overlays
- **Live Airing Schedule & Seasonal Sync**:
  - Real-time broadcast schedule fetched from Jikan v4 (MyAnimeList) with 30-minute in-memory caching
  - Automatic day-of-week selection (Monday–Sunday)
  - Resilient local fallback when offline or rate-limited
- **Search & Advanced Filtering**:
  - Live as-you-type search dropdown with anime covers, ratings, and genres
  - Enter-key search submission to filter the main grid
  - Filter by Type (TV Series, Movie), Airing Status, and Sort Order (Rating, A-Z, Episode Count)
- **Watchlist & User Profile**:
  - Slide-over watchlist drawer with badge counters and instant removal
  - Member profile modal with High-Contrast dark mode toggle
  - Top 10 rankings sorted dynamically by Today, Week, and Month
- **Progressive Web App (PWA)**:
  - Installable on desktop and mobile devices via `manifest.json` with theme color `#ffbade`

## Keyboard Shortcuts

| Shortcut | Action |
|:---:|:---|
| <kbd>N</kbd> | Next Episode |
| <kbd>P</kbd> | Previous Episode |
| <kbd>L</kbd> | Toggle Lights Off Mode |
| <kbd>T</kbd> | Toggle Theater Mode |
| <kbd>Esc</kbd> | Exit Lights Off or Close Modal |

## Quick Start (Local)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- npm

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Hubg50we/localweb.git
   cd localweb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the application:
   ```bash
   npm start
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## Cloud Deployment

### Deploy to Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository (`Hubg50we/localweb`).
3. Set the following build and start configurations:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Render automatically supplies the `PORT` environment variable, which `server.js` listens on (`0.0.0.0:${PORT}`).

### Deploy to Railway

1. In [Railway](https://railway.app/), click **New Project** → **Deploy from GitHub repo**.
2. Select `Hubg50we/localweb`.
3. Railway automatically detects `package.json` and runs `npm install` followed by `npm start`.
4. Add a public networking domain under your service settings.

## Tech Stack

- **Backend**: Node.js, Express, CORS
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Variables & Flexbox/Grid
- **Metadata & APIs**: Consumet (`@consumet/extensions`), Jikan v4 API
- **Icons & Streaming**: Lucide Icons, HLS.js, MultiEmbed, VidSrc, 2Embed

## License

This project is open-source and intended for educational and personal research purposes.
