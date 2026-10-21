const fs = require('fs');
const path = require('path');

// 1. Copy public/index.html to public/404.html
fs.copyFileSync('public/index.html', 'public/404.html');
console.log('Copied public/index.html -> public/404.html');

// 2. Mirror all public/ files to docs/
const files = ['index.html', '404.html', 'app.js', 'style.css', 'sw.js', 'manifest.json'];
files.forEach(f => {
  const src = path.join('public', f);
  const dest = path.join('docs', f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Synced ${src} -> ${dest}`);
  }
});

// Also copy data/
if (!fs.existsSync('docs/data')) {
  fs.mkdirSync('docs/data', { recursive: true });
}
if (fs.existsSync('data/anime-data.js')) {
  fs.copyFileSync('data/anime-data.js', 'docs/data/anime-data.js');
  console.log('Synced data/anime-data.js -> docs/data/anime-data.js');
}
if (fs.existsSync('data/providers.json')) {
  fs.copyFileSync('data/providers.json', 'docs/data/providers.json');
  console.log('Synced data/providers.json -> docs/data/providers.json');
}

console.log('Docs mirror sync complete.');
