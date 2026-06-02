// ─── GIF Fetcher ─────────────────────────────────────────────────────────────
// Usa a API open source: https://oss.exercisedb.dev (sem chave, sem cadastro)
// Cache em sessionStorage para evitar chamadas repetidas na mesma sessão

const GIF_API = 'https://oss.exercisedb.dev/api/v1/exercises';
const CACHE_KEY = 'treino_gif_cache';
const FALLBACK_ICON = ''; // Deixa vazio — o fallback visual é tratado no CSS

function getGifCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}

function setGifCache(cache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

// Busca GIF de um exercício pelo termo de busca em inglês
// Retorna a URL do GIF ou null se não encontrar
async function fetchGifUrl(searchTerm) {
  const cache = getGifCache();
  if (cache[searchTerm] !== undefined) return cache[searchTerm];

  try {
    const encoded = encodeURIComponent(searchTerm);
    const res = await fetch(`${GIF_API}?name=${encoded}&limit=1`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    // A API pode retornar { exercises: [...] } ou diretamente um array
    const list = Array.isArray(data) ? data : (data.exercises || data.data || []);
    const gifUrl = list.length > 0 && list[0].gifUrl ? list[0].gifUrl : null;

    cache[searchTerm] = gifUrl;
    setGifCache(cache);
    return gifUrl;
  } catch {
    cache[searchTerm] = null;
    setGifCache(cache);
    return null;
  }
}

// Pré-carrega os GIFs de um dia inteiro em paralelo
async function prefetchDayGifs(dayId) {
  const day = WORKOUT_DATA.find(d => d.id === dayId);
  if (!day) return;
  const cache = getGifCache();
  const missing = day.exercises.filter(ex => cache[ex.search] === undefined);
  if (missing.length === 0) return;
  await Promise.allSettled(missing.map(ex => fetchGifUrl(ex.search)));
}

// Injeta o GIF num elemento <img> pelo seu search term
// Mostra skeleton enquanto carrega, fallback se falhar
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
