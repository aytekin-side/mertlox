#!/usr/bin/env node
/**
 * Static page generator for Mertlox
 * Generates individual HTML pages for each game with full SEO
 * Run: node generate.js
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://mertlox.com';
const SRC = path.join(__dirname, 'index.html');

// Read index.html
const html = fs.readFileSync(SRC, 'utf8');

// Extract CSS (everything between <style> and </style>)
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const css = cssMatch ? cssMatch[1] : '';

// Extract games array
const gamesMatch = html.match(/const games = \[([\s\S]*?)\n\];/);
if (!gamesMatch) { console.error('Could not find games array'); process.exit(1); }
let games;
try {
  games = new Function('return [' + gamesMatch[1] + ']')();
} catch(e) { console.error('Failed to parse games:', e); process.exit(1); }

console.log(`Found ${games.length} games`);

// Ensure games/ directory exists
const gamesDir = path.join(__dirname, 'games');
if (!fs.existsSync(gamesDir)) fs.mkdirSync(gamesDir);

// Escape HTML entities for safe insertion into attributes
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Escape for JS strings inside inline scripts
function escJS(s) {
  return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,'\\n');
}

// Generate each game page
games.forEach((g, i) => {
  const slug = g.slug;
  const dir = path.join(gamesDir, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const canonicalUrl = `${DOMAIN}/games/${slug}/`;
  const pageTitle = `${g.name} - Stats, Info & Gameplay | Mertlox`;
  const metaDesc = g.desc;

  // Video section
  let videoHTML = '';
  if (g.videoId) {
    videoHTML = `
    <div class="detail-video">
      <h3><span class="mertlox-badge">Mertlox Video</span> Our Review</h3>
      <div class="video-container">
        <iframe src="https://www.youtube.com/embed/${esc(g.videoId)}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      </div>
      <a href="https://www.youtube.com/@MertloxTank" target="_blank" rel="noopener" class="mertlox-channel-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
        Subscribe to Mertlox for more gameplay videos
      </a>
    </div>`;
  } else {
    videoHTML = `
    <div class="detail-video">
      <h3>Gameplay Video</h3>
      <div class="video-container">
        <div class="video-placeholder" onclick="loadVideo(this, '${escJS(g.name)} Roblox gameplay')">
          <img src="${esc(g.thumb)}" alt="Watch ${esc(g.name)} gameplay" loading="lazy">
          <div class="video-play-btn">
            <svg viewBox="0 0 68 48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#FF0000"/><path d="M45 24L27 14v20" fill="#fff"/></svg>
          </div>
          <div class="video-label">Click to load video</div>
        </div>
      </div>
    </div>`;
  }

  // Screenshots
  const screenshotsHTML = g.screenshots.map(s =>
    `<img src="${esc(s)}" alt="${esc(g.name)} screenshot" loading="lazy" onclick="openLightbox('${escJS(s)}')">`
  ).join('\n        ');

  // JSON-LD structured data
  const jsonLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": g.name,
    "description": g.longDesc || g.desc,
    "image": g.thumb,
    "url": g.url,
    "genre": g.genre,
    "gamePlatform": "Roblox",
    "author": { "@type": "Organization", "name": g.creator },
    "dateCreated": g.created
  });

  const breadcrumbLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN + "/" },
      { "@type": "ListItem", "position": 2, "name": g.name, "item": canonicalUrl }
    ]
  });

  const pageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LM6ZKX5PW1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-LM6ZKX5PW1');
</script>
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(g.name)} - Mertlox">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(g.thumb)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="Mertlox">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(g.name)} - Mertlox">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(g.thumb)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonLD}</script>
<script type="application/ld+json">${breadcrumbLD}</script>
<style>
${css}
#detail-view { display: block; }
</style>
</head>
<body>

<nav>
  <a href="/" class="nav-logo">
    <div class="nav-logo-icon">M</div>
    <div class="nav-logo-text">Mert<span class="green">lox</span></div>
  </a>
  <ul class="nav-links">
    <li><a href="/">Games</a></li>
    <li><a href="https://www.youtube.com/@MertloxTank" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.4rem;"><svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>YouTube</a></li>
    <li><a href="https://www.roblox.com/charts" target="_blank" rel="noopener" class="nav-cta">Roblox Charts</a></li>
  </ul>
</nav>

<div id="detail-view">
  <div class="detail-page">
    <a href="/" class="detail-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Back to all games
    </a>

    <img class="detail-hero-img" src="${esc(g.thumb)}" alt="${esc(g.name)}" width="1100" height="619">

    <div class="detail-header">
      <div class="detail-genre">${esc(g.genre)}</div>
      <h1 class="detail-title">${esc(g.name)}</h1>
      <p class="detail-creator">By <strong>${esc(g.creator)}</strong> &middot; Created ${esc(g.created)}</p>
    </div>

    <div class="detail-stats-grid">
      <div class="detail-stat-card">
        <div class="val live" id="stat-playing">${esc(g.players)}</div>
        <div class="lbl">Playing Now</div>
      </div>
      <div class="detail-stat-card">
        <div class="val" id="stat-visits">${esc(g.visits)}</div>
        <div class="lbl">Total Visits</div>
      </div>
      <div class="detail-stat-card">
        <div class="val" id="stat-favorites">${esc(g.favorites)}</div>
        <div class="lbl">Favorites</div>
      </div>
      <div class="detail-stat-card">
        <div class="val">${g.maxPlayers}</div>
        <div class="lbl">Max Players</div>
      </div>
    </div>

    <a href="${esc(g.url)}" target="_blank" rel="noopener" class="detail-play-btn">
      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Play on Roblox
    </a>

    <div class="detail-desc">
      <h3>About This Game</h3>
      <p>${esc(g.longDesc || g.desc)}</p>
    </div>

    ${videoHTML}

    <div class="detail-screenshots">
      <h3>Screenshots</h3>
      <div class="screenshots-grid">
        ${screenshotsHTML}
      </div>
    </div>
  </div>
</div>

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
  <img id="lightbox-img" src="" alt="Screenshot">
</div>

<footer>
  <div class="footer-brand">Mert<span style="color:#22C55E">lox</span></div>
  <p class="footer-line">
    Data sourced from <a href="https://www.rolimons.com/games" target="_blank" rel="noopener">Rolimon's</a> &amp; <a href="https://www.roblox.com/charts" target="_blank" rel="noopener">Roblox Charts</a>. Not affiliated with Roblox Corporation.
  </p>
</footer>

<script>
// Lightbox
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// Video embed
function loadVideo(placeholder, query) {
  const container = placeholder.parentElement;
  placeholder.querySelector('.video-label').textContent = 'Loading video...';
  const searchQuery = encodeURIComponent(query);
  const apis = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de'];
  (async () => {
    for (const api of apis) {
      try {
        const res = await fetch(api + '/search?q=' + searchQuery + '&filter=videos');
        if (!res.ok) continue;
        const data = await res.json();
        const vid = data.items && data.items.find(i => i.type === 'stream' && i.url);
        if (vid) {
          const videoId = vid.url.replace('/watch?v=', '');
          container.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
          return;
        }
      } catch(e) { continue; }
    }
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:1rem;"><p style="color:#8888A0;font-size:0.9rem;">Could not load video automatically</p><a href="https://www.youtube.com/results?search_query=' + searchQuery + '" target="_blank" rel="noopener" style="background:#FF1A1A;color:white;padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem;">Watch on YouTube \\u2192</a></div>';
  })();
}

// Live stats update for this game
(async () => {
  try {
    const res = await fetch('https://games.roproxy.com/v1/games?universeIds=${g.universeId}');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.data && data.data[0]) {
      const d = data.data[0];
      const fmt = n => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toLocaleString();
      document.getElementById('stat-playing').textContent = fmt(d.playing);
      document.getElementById('stat-visits').textContent = fmt(d.visits);
      document.getElementById('stat-favorites').textContent = fmt(d.favoritedCount);
    }
  } catch(e) {}
})();
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(dir, 'index.html'), pageHTML);
  console.log(`  ✓ /games/${slug}/`);
});

// Generate sitemap.xml
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
games.forEach(g => {
  sitemap += `  <url>
    <loc>${DOMAIN}/games/${g.slug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});
sitemap += `</urlset>`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log('\n✓ sitemap.xml generated');

// Generate robots.txt
fs.writeFileSync(path.join(__dirname, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${DOMAIN}/sitemap.xml
`);
console.log('✓ robots.txt generated');

console.log(`\nDone! Generated ${games.length} game pages.`);
