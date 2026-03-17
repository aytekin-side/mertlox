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

// Read stories data
const STORIES_FILE = path.join(__dirname, 'stories.js');
let stories = {};
if (fs.existsSync(STORIES_FILE)) {
  try {
    stories = new Function(fs.readFileSync(STORIES_FILE, 'utf8') + '\nreturn stories;')();
    console.log(`Loaded stories for ${Object.keys(stories).length} games`);
  } catch(e) { console.error('Warning: Failed to parse stories.js:', e.message); }
}

// Extract CSS (everything between <style> and </style>)
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
let css = cssMatch ? cssMatch[1] : '';

// Add stories CSS
css += `
/* STORIES */
.detail-stories { margin-bottom: 2.5rem; }
.detail-stories > h3 {
  font-family: 'Chakra Petch', sans-serif; font-size: 1.1rem; margin-bottom: 1.25rem;
  display: flex; align-items: center; gap: 0.5rem;
}
.detail-stories > h3::before {
  content: ''; display: inline-block; width: 4px; height: 1.1em;
  background: var(--red); border-radius: 2px;
}
.story-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.25rem 1.5rem; margin-bottom: 0.75rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.story-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.story-card h4 {
  font-family: 'Chakra Petch', sans-serif; font-size: 0.95rem; font-weight: 600;
  color: var(--text-primary); margin-bottom: 0.5rem; line-height: 1.4;
}
.story-card p {
  font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7; margin: 0;
}
`;

// Extract games array
const gamesMatch = html.match(/const games = \[([\s\S]*?)\n\];/);
if (!gamesMatch) { console.error('Could not find games array'); process.exit(1); }
let games;
try {
  games = new Function('return [' + gamesMatch[1] + ']')();
} catch(e) { console.error('Failed to parse games:', e); process.exit(1); }

console.log(`Found ${games.length} games`);

// Build unique genres list and slug helper
function genreSlug(genre) {
  return genre.toLowerCase().replace(/\s+/g, '-');
}
const genres = [...new Set(games.map(g => g.genre))].sort();
console.log(`Found ${genres.length} genres: ${genres.join(', ')}`);

// Generate category footer links HTML (used in game pages and category pages)
const categoryLinksHTML = genres.map(g =>
  `      <a href="/category/${genreSlug(g)}/">${g}</a>`
).join('\n');

// Add footer category CSS
css += `
/* FOOTER CATEGORIES */
.footer-categories { margin-bottom: 1.25rem; }
.footer-categories h4 { font-family: 'Chakra Petch', sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-dim); margin-bottom: 0.6rem; }
.footer-cat-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; }
.footer-cat-links a {
  padding: 0.3rem 0.7rem; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 6px; color: var(--text-secondary); font-size: 0.72rem; font-weight: 500;
  text-decoration: none; transition: all 0.2s;
}
.footer-cat-links a:hover { border-color: var(--red); color: var(--red); background: rgba(255,26,26,0.05); }
`;

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

  // Stories section
  const gameStories = stories[g.slug] || [];
  let storiesHTML = '';
  if (gameStories.length > 0) {
    const storyCards = gameStories.map(s =>
      `      <div class="story-card">
        <h4>${esc(s.title)}</h4>
        <p>${esc(s.body)}</p>
      </div>`
    ).join('\n');
    storiesHTML = `
    <div class="detail-stories">
      <h3>Stories &amp; News</h3>
${storyCards}
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

    ${storiesHTML}

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
  <div class="footer-categories">
    <h4>Browse by Category</h4>
    <div class="footer-cat-links">
${categoryLinksHTML}
    </div>
  </div>
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

// ═══════════════════════════════════
// CATEGORY PAGES
// ═══════════════════════════════════
const catDir = path.join(__dirname, 'category');
if (!fs.existsSync(catDir)) fs.mkdirSync(catDir);

genres.forEach(genre => {
  const slug = genreSlug(genre);
  const dir = path.join(catDir, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const catGames = games.filter(g => g.genre === genre);
  const canonicalUrl = `${DOMAIN}/category/${slug}/`;
  const pageTitle = `Best ${genre} Games on Roblox | Mertlox`;
  const metaDesc = `Discover the top ${catGames.length} most popular ${genre} games on Roblox. Live player counts, stats, and gameplay for every ${genre} game.`;

  // Game cards HTML
  const gameCardsHTML = catGames.map((g, i) => `
      <a href="/games/${g.slug}/" class="game-card visible" style="text-decoration:none;color:inherit;">
        <div class="card-thumb-wrapper">
          <img class="card-thumb" src="${esc(g.thumb)}" alt="${esc(g.name)}" loading="lazy">
          <div class="card-thumb-overlay"></div>
          <div class="card-genre-badge">${esc(g.genre)}</div>
          <div class="card-live-badge"><span class="dot"></span>${esc(g.players)}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(g.name)}</h3>
          <p class="card-desc">${esc(g.desc)}</p>
          <div class="card-stats">
            <div class="card-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span class="card-stat-value" style="color:var(--green)">${esc(g.players)}</span>
              <span class="card-stat-label">playing</span>
            </div>
            <div class="card-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span class="card-stat-value">${esc(g.visits)}</span>
              <span class="card-stat-label">visits</span>
            </div>
            <div class="card-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="card-stat-value">${esc(g.favorites)}</span>
              <span class="card-stat-label">favorites</span>
            </div>
          </div>
        </div>
      </a>`).join('\n');

  // Other category links (for navigation between categories)
  const otherCatsHTML = genres.filter(g => g !== genre).map(g =>
    `        <a href="/category/${genreSlug(g)}/" class="filter-tag">${g}</a>`
  ).join('\n');

  // JSON-LD
  const catJsonLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best ${genre} Games on Roblox`,
    "description": metaDesc,
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": catGames.length,
      "itemListElement": catGames.map((g, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": g.name,
        "url": `${DOMAIN}/games/${g.slug}/`
      }))
    }
  });

  const breadcrumbLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN + "/" },
      { "@type": "ListItem", "position": 2, "name": genre, "item": canonicalUrl }
    ]
  });

  const catHTML = `<!DOCTYPE html>
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
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="Mertlox">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<script type="application/ld+json">${catJsonLD}</script>
<script type="application/ld+json">${breadcrumbLD}</script>
<style>
${css}
.category-page { padding: calc(64px + 2rem) clamp(1.5rem,4vw,3rem) 3rem; background: var(--bg-surface); min-height: 100vh; }
.category-header { text-align: center; margin-bottom: 2rem; }
.category-back { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); text-decoration: none; font-size: 0.82rem; margin-bottom: 1.5rem; transition: color 0.2s; }
.category-back:hover { color: var(--text-primary); }
.category-back svg { width: 16px; height: 16px; }
.category-badge { display: inline-block; padding: 0.35rem 0.85rem; background: rgba(255,26,26,0.1); border: 1px solid rgba(255,26,26,0.2); border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--red); margin-bottom: 0.75rem; }
.category-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(1.8rem,3.5vw,2.8rem); letter-spacing: 1px; margin-bottom: 0.5rem; }
.category-subtitle { font-size: 0.88rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto; }
.category-count { color: var(--green); font-weight: 600; }
.other-categories { margin-top: 2rem; text-align: center; }
.other-categories h3 { font-family: 'Chakra Petch', sans-serif; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; }
.other-categories .filter-tags { justify-content: center; }
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

<div class="category-page">
  <a href="/" class="category-back">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Back to all games
  </a>

  <div class="category-header">
    <div class="category-badge">${esc(genre)}</div>
    <h1 class="category-title">${esc(genre)} Roblox Games</h1>
    <p class="category-subtitle">The top <span class="category-count">${catGames.length}</span> most popular ${esc(genre.toLowerCase())} games on Roblox, ranked by live player count.</p>
  </div>

  <div class="games-grid" style="max-width:1300px;margin:0 auto;">
    ${gameCardsHTML}
  </div>

  <div class="other-categories">
    <h3>Explore Other Categories</h3>
    <div class="filter-tags" style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.4rem;margin-top:0.5rem;">
${otherCatsHTML}
    </div>
  </div>
</div>

<footer>
  <div class="footer-brand">Mert<span style="color:#22C55E">lox</span></div>
  <div class="footer-categories">
    <h4>Browse by Category</h4>
    <div class="footer-cat-links">
${categoryLinksHTML}
    </div>
  </div>
  <p class="footer-line">
    Data sourced from <a href="https://www.rolimons.com/games" target="_blank" rel="noopener">Rolimon's</a> &amp; <a href="https://www.roblox.com/charts" target="_blank" rel="noopener">Roblox Charts</a>. Not affiliated with Roblox Corporation.
  </p>
</footer>

</body>
</html>`;

  fs.writeFileSync(path.join(dir, 'index.html'), catHTML);
  console.log(`  ✓ /category/${slug}/ (${catGames.length} games)`);
});

console.log(`\n✓ Generated ${genres.length} category pages`);

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
genres.forEach(genre => {
  sitemap += `  <url>
    <loc>${DOMAIN}/category/${genreSlug(genre)}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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

console.log(`\nDone! Generated ${games.length} game pages + ${genres.length} category pages.`);
