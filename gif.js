const CACHE_KEY = 'treino_gif_cache';

const ENDPOINTS = [
  search => `https://corsproxy.io/?url=${encodeURIComponent('https://oss.exercisedb.dev/api/v1/exercises?name=' + encodeURIComponent(search) + '&limit=1')}`,
  search => `https://api.allorigins.win/get?url=${encodeURIComponent('https://oss.exercisedb.dev/api/v1/exercises?name=' + encodeURIComponent(search) + '&limit=1')}`,
];

function getGifCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function setGifCache(cache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function parseResponse(data, isAllOrigins) {
  try {
    const parsed = isAllOrigins ? JSON.parse(data.contents) : data;
    const list = Array.isArray(parsed) ? parsed : (parsed.exercises || parsed.data || []);
    return list.length > 0 && list[0].gifUrl ? list[0].gifUrl : null;
  } catch { return null; }
}

async function fetchGifUrl(searchTerm) {
  const cache = getGifCache();
  if (cache[searchTerm] !== undefined) return cache[searchTerm];

  for (let i = 0; i < ENDPOINTS.length; i++) {
    try {
      const res = await fetch(ENDPOINTS[i](searchTerm), { headers: { 'Accept': 'application/json' } });
      if (!res.ok) continue;
      const data = await res.json();
      const gifUrl = parseResponse(data, i === 1);
      if (gifUrl) {
        cache[searchTerm] = gifUrl;
        setGifCache(cache);
        return gifUrl;
      }
    } catch {}
  }

  cache[searchTerm] = null;
  setGifCache(cache);
  return null;
}

async function prefetchDayGifs(dayId) {
  const day = WORKOUT_DATA.find(d => d.id === dayId);
  if (!day) return;
  const cache = getGifCache();
  const missing = day.exercises.filter(ex => cache[ex.search] === undefined);
  if (missing.length === 0) return;
  await Promise.allSettled(missing.map(ex => fetchGifUrl(ex.search)));
}

async function loadGifIntoImg(imgEl, searchTerm) {
  imgEl.classList.add('gif-loading');
  const url = await fetchGifUrl(searchTerm);
  imgEl.classList.remove('gif-loading');
  if (url) {
    imgEl.src = url;
    imgEl.style.opacity = '1';
  } else {
    imgEl.style.display = 'none';
    const fallback = imgEl.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  }
}