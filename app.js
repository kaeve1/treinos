// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  page: 'home',
  workoutDay: 'A',
  openExercise: null,
};

function getStorage() {
  try { return JSON.parse(localStorage.getItem('treino_data') || '{}'); } catch { return {}; }
}
function saveStorage(data) {
  try { localStorage.setItem('treino_data', JSON.stringify(data)); } catch {}
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function getSessionKey(dayId) {
  return `${todayKey()}_${dayId}`;
}

function getDaySession(dayId) {
  const data = getStorage();
  return data[getSessionKey(dayId)] || { sets: {}, completed: false, date: todayKey() };
}

function saveDaySession(dayId, session) {
  const data = getStorage();
  data[getSessionKey(dayId)] = session;
  saveStorage(data);
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  state.page = page;
  if (page === 'home') renderHome();
  if (page === 'workout') { renderWorkout(); loadVisibleGifs(); prefetchDayGifs(state.workoutDay); }
  if (page === 'history') renderHistory();
  if (page === 'info') renderInfo();
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia 👋';
  if (h < 18) return 'Boa tarde 👋';
  return 'Boa noite 👋';
}

// ─── Streak ──────────────────────────────────────────────────────────────────
function calcStreak() {
  const data = getStorage();
  const keys = Object.keys(data).sort().reverse();
  const trained = new Set();
  keys.forEach(k => {
    const session = data[k];
    const dayKey = k.split('_')[0];
    if (Object.values(session.sets || {}).some(v => v)) trained.add(dayKey);
  });
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (trained.has(d.toISOString().split('T')[0])) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// ─── Week strip ──────────────────────────────────────────────────────────────
function renderWeekStrip() {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  const data = getStorage();
  const trained = new Set(Object.keys(data).map(k => k.split('_')[0]).filter(k => {
    const sessions = Object.keys(data).filter(sk => sk.startsWith(k));
    return sessions.some(sk => Object.values(data[sk].sets || {}).some(v => v));
  }));

  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const isToday = i === 6;
    const hasTrained = trained.has(key);
    html += `<div class="week-day ${isToday ? 'today' : ''} ${hasTrained ? 'trained' : ''}">
      <span class="week-day-label">${days[d.getDay()]}</span>
      <div class="week-day-dot">${hasTrained ? '<i class="ti ti-check"></i>' : ''}</div>
    </div>`;
  }
  document.getElementById('week-strip').innerHTML = html;
}

// ─── Today card ──────────────────────────────────────────────────────────────
function getTodayWorkout() {
  const dayOfWeek = new Date().getDay();
  const map = { 1: 'A', 2: 'B', 4: 'C', 5: 'D' };
  return map[dayOfWeek] || null;
}

function renderTodayCard() {
  const dayId = getTodayWorkout();
  const el = document.getElementById('today-card');
  if (!dayId) {
    el.innerHTML = `<div class="rest-card"><i class="ti ti-zzz"></i><div><p class="rest-title">Dia de descanso</p><p class="rest-sub">Recuperação é parte do treino.</p></div></div>`;
    return;
  }
  const day = WORKOUT_DATA.find(d => d.id === dayId);
  const session = getDaySession(dayId);
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = Object.values(session.sets).filter(v => v).length;
  const pct = Math.round(doneSets / totalSets * 100);

  el.innerHTML = `
    <div class="today-workout-card" style="--day-color:${day.color}">
      <div class="today-top">
        <div>
          <p class="today-label">Hoje</p>
          <h3 class="today-day-name">${day.day} — ${day.label}</h3>
          <p class="today-focus">${day.focus}</p>
        </div>
        <div class="today-pct">${pct}<span>%</span></div>
      </div>
      <div class="today-progress-wrap">
        <div class="today-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="today-bottom">
        <span>${doneSets}/${totalSets} séries</span>
        <button class="today-btn" onclick="navigate('workout');selectDay('${dayId}')">
          ${pct === 0 ? 'Iniciar treino' : pct === 100 ? 'Ver treino' : 'Continuar'} <i class="ti ti-arrow-right"></i>
        </button>
      </div>
    </div>`;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  const data = getStorage();
  const allKeys = Object.keys(data);
  const trainedDays = new Set(allKeys.filter(k => Object.values(data[k].sets || {}).some(v => v)).map(k => k.split('_')[0]));
  const thisWeek = (() => {
    const today = new Date();
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (trainedDays.has(d.toISOString().split('T')[0])) count++;
    }
    return count;
  })();

  const totalSessions = trainedDays.size;
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><p class="stat-val">${thisWeek}</p><p class="stat-label">Treinos essa semana</p></div>
    <div class="stat-card"><p class="stat-val">${totalSessions}</p><p class="stat-label">Total de treinos</p></div>
    <div class="stat-card"><p class="stat-val">${calcStreak()}</p><p class="stat-label">Sequência atual</p></div>`;
}

// ─── Week summary ─────────────────────────────────────────────────────────────
function renderWeekSummary() {
  const data = getStorage();
  const today = new Date();
  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dk = d.toISOString().split('T')[0];
    const sessions = Object.keys(data).filter(k => k.startsWith(dk));
    if (sessions.length === 0) continue;
    sessions.forEach(sk => {
      const dayId = sk.split('_')[1];
      const day = WORKOUT_DATA.find(d => d.id === dayId);
      if (!day) return;
      const done = Object.values(data[sk].sets || {}).filter(v => v).length;
      const total = day.exercises.reduce((a, e) => a + e.sets, 0);
      if (done === 0) return;
      html += `<div class="history-item">
        <div class="history-dot" style="background:${day.color}"></div>
        <div class="history-info">
          <p class="history-name">${day.label} — ${day.focus}</p>
          <p class="history-meta">${dk === todayKey() ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${done}/${total} séries</p>
        </div>
        <div class="history-pct" style="color:${day.color}">${Math.round(done/total*100)}%</div>
      </div>`;
    });
  }
  document.getElementById('week-summary').innerHTML = html || '<p class="empty-state">Nenhum treino registrado ainda. Bora começar!</p>';
}

// ─── Home render ─────────────────────────────────────────────────────────────
function renderHome() {
  document.getElementById('greeting').textContent = greeting();
  document.getElementById('streak-count').textContent = calcStreak();
  renderWeekStrip();
  renderTodayCard();
  renderStats();
  renderWeekSummary();
}

// ─── Workout Day Nav ──────────────────────────────────────────────────────────
function selectDay(id) {
  state.workoutDay = id;
  state.openExercise = null;
  prefetchDayGifs(id);
  renderWorkout();
  loadVisibleGifs();
}

function renderWorkout() {
  const nav = document.getElementById('workout-day-nav');
  nav.innerHTML = WORKOUT_DATA.map(d => {
    const session = getDaySession(d.id);
    const total = d.exercises.reduce((a, e) => a + e.sets, 0);
    const done = Object.values(session.sets).filter(v => v).length;
    const pct = Math.round(done / total * 100);
    return `<button class="day-tab ${state.workoutDay === d.id ? 'active' : ''}" onclick="selectDay('${d.id}')" style="--day-color:${d.color}">
      <span class="day-tab-name">${d.day}</span>
      ${pct > 0 ? `<span class="day-tab-pct">${pct}%</span>` : ''}
    </button>`;
  }).join('');
  renderWorkoutContent();
}

function renderWorkoutContent() {
  const day = WORKOUT_DATA.find(d => d.id === state.workoutDay);
  const session = getDaySession(day.id);
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = Object.values(session.sets).filter(v => v).length;
  const pct = Math.round(doneSets / totalSets * 100);

  let html = `
    <div class="workout-header" style="--day-color:${day.color}">
      <div class="workout-header-top">
        <div>
          <h2 class="workout-title">${day.label}</h2>
          <p class="workout-focus">${day.focus}</p>
        </div>
        <span class="workout-pct-badge" style="color:${day.color}">${pct}%</span>
      </div>
      <div class="workout-progress-wrap">
        <div class="workout-progress-bar" style="width:${pct}%;background:${day.color}"></div>
      </div>
      <p class="workout-progress-label">${doneSets} de ${totalSets} séries concluídas</p>
    </div>`;

  day.exercises.forEach((ex, ei) => {
    const exKey = `${day.id}_${ei}`;
    const isOpen = state.openExercise === exKey;
    const doneCount = Array.from({ length: ex.sets }, (_, s) => session.sets[`${ei}_${s}`]).filter(Boolean).length;
    const ytUrl = `https://www.youtube.com/results?search_query=${ex.yt}`;
    const allDone = doneCount === ex.sets;

    html += `<div class="ex-card ${allDone ? 'ex-done' : ''}">
      <div class="ex-header" onclick="toggleExercise('${exKey}')">
        <div class="ex-gif-wrap">
          <img class="ex-thumb gif-loading" data-search="${ex.search}" alt="${ex.name}" style="opacity:0">
          <div class="ex-thumb-fallback"><i class="ti ti-barbell"></i></div>
        </div>
        <div class="ex-info">
          <p class="ex-name">${ex.name}</p>
          <p class="ex-meta">${ex.sets}×${ex.reps} &nbsp;·&nbsp; <span style="color:${allDone ? '#34C98A' : day.color}">${doneCount}/${ex.sets}</span></p>
          <div class="muscles-row">
            ${ex.muscles.map(m => `<span class="muscle-tag">${m}</span>`).join('')}
          </div>
        </div>
        <div class="ex-right">
          ${allDone ? '<i class="ti ti-circle-check ex-check"></i>' : ''}
          <i class="ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} ex-chevron"></i>
        </div>
      </div>`;

    if (isOpen) {
      html += `<div class="ex-body">
        <div class="ex-body-gif-row">
          <img class="ex-gif-large gif-loading" data-search="${ex.search}" alt="${ex.name}" style="opacity:0">
          <div class="ex-body-right">
            <p class="sets-label">Marque cada série concluída</p>
            <div class="sets-grid">`;

      for (let s = 0; s < ex.sets; s++) {
        const setKey = `${ei}_${s}`;
        const isDone = session.sets[setKey];
        html += `<button class="set-btn ${isDone ? 'done' : ''}" onclick="toggleSet('${day.id}',${ei},${s})" style="--day-color:${day.color}">
          <span class="set-num">Série ${s + 1}</span>
          <span class="set-reps">${ex.reps}</span>
          <span class="set-status">${isDone ? '<i class="ti ti-check"></i>' : '<i class="ti ti-circle-dashed"></i>'}</span>
        </button>`;
      }

      html += `</div>
            <a class="yt-btn" href="${ytUrl}" target="_blank" rel="noopener">
              <i class="ti ti-brand-youtube"></i> Ver técnica
            </a>
            ${ex.secondary.length > 0 ? `<div class="secondary-muscles"><span class="secondary-label">Secundários:</span> ${ex.secondary.map(m => `<span class="muscle-tag secondary">${m}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      </div>`;
    }

    html += `</div>`;
  });

  if (doneSets > 0) {
    html += `<button class="reset-btn" onclick="resetDay('${day.id}')"><i class="ti ti-refresh"></i> Resetar treino</button>`;
  }

  document.getElementById('workout-content').innerHTML = html;
}

// Após renderizar, carrega os GIFs de todos os imgs com data-search visíveis
function loadVisibleGifs() {
  document.querySelectorAll('img[data-search]').forEach(img => {
    const search = img.getAttribute('data-search');
    if (search) loadGifIntoImg(img, search);
  });
}

function toggleExercise(key) {
  state.openExercise = state.openExercise === key ? null : key;
  renderWorkout();
  loadVisibleGifs();
}

function toggleSet(dayId, exIdx, setIdx) {
  const session = getDaySession(dayId);
  const k = `${exIdx}_${setIdx}`;
  session.sets[k] = !session.sets[k];
  saveDaySession(dayId, session);
  renderWorkout();
}

function resetDay(dayId) {
  const session = getDaySession(dayId);
  session.sets = {};
  saveDaySession(dayId, session);
  state.openExercise = null;
  renderWorkout();
}

// ─── History ──────────────────────────────────────────────────────────────────
function renderHistory() {
  const data = getStorage();
  const keys = Object.keys(data).sort().reverse();
  if (keys.length === 0) {
    document.getElementById('history-content').innerHTML = `<p class="empty-state">Nenhum treino registrado ainda.</p>`;
    return;
  }

  const grouped = {};
  keys.forEach(k => {
    const [date, dayId] = k.split('_');
    const day = WORKOUT_DATA.find(d => d.id === dayId);
    if (!day) return;
    const done = Object.values(data[k].sets || {}).filter(v => v).length;
    if (done === 0) return;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({ day, done, total: day.exercises.reduce((a, e) => a + e.sets, 0), key: k });
  });

  let html = '';
  Object.keys(grouped).sort().reverse().forEach(date => {
    const d = new Date(date + 'T12:00:00');
    const isToday = date === todayKey();
    const label = isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    html += `<p class="history-date-label">${label}</p>`;
    grouped[date].forEach(item => {
      const pct = Math.round(item.done / item.total * 100);
      html += `<div class="history-card">
        <div class="history-color-bar" style="background:${item.day.color}"></div>
        <div class="history-card-inner">
          <div class="history-card-top">
            <div>
              <p class="history-card-name">${item.day.label}</p>
              <p class="history-card-focus">${item.day.focus}</p>
            </div>
            <span class="history-badge" style="color:${item.day.color};background:${item.day.color}18">${pct}%</span>
          </div>
          <div class="history-mini-progress">
            <div style="width:${pct}%;background:${item.day.color}"></div>
          </div>
          <p class="history-sets">${item.done} de ${item.total} séries concluídas</p>
        </div>
      </div>`;
    });
  });

  document.getElementById('history-content').innerHTML = html;
}

// ─── Info ─────────────────────────────────────────────────────────────────────
function renderInfo() {
  const { nutrition, supplements, discipline } = INFO_DATA;
  let html = '';

  html += `<div class="info-section">
    <div class="info-section-header"><i class="ti ${nutrition.icon}"></i>${nutrition.title}</div>
    ${nutrition.sections.map(s => `
      <div class="info-row">
        <div class="info-row-left"><p class="info-row-label">${s.label}</p><p class="info-row-note">${s.note}</p></div>
        <span class="info-row-val">${s.value}</span>
      </div>`).join('')}
    <div class="info-tip"><i class="ti ti-bulb"></i>${nutrition.tip}</div>
  </div>`;

  html += `<div class="info-section">
    <div class="info-section-header"><i class="ti ${supplements.icon}"></i>${supplements.title}</div>
    ${supplements.items.map(s => `
      <div class="supp-card">
        <div class="supp-card-top">
          <p class="supp-name">${s.name}</p>
          <span class="supp-priority" style="color:${s.color};background:${s.color}18">${s.priority}</span>
        </div>
        <p class="supp-why">${s.why}</p>
        <div class="supp-details">
          <span><i class="ti ti-pill"></i>${s.dose}</span>
          <span><i class="ti ti-clock"></i>${s.when}</span>
        </div>
      </div>`).join('')}
  </div>`;

  html += `<div class="info-section">
    <div class="info-section-header"><i class="ti ${discipline.icon}"></i>${discipline.title}</div>
    ${discipline.tips.map(t => `
      <div class="disc-tip">
        <i class="ti ${t.icon}"></i>
        <p>${t.text}</p>
      </div>`).join('')}
  </div>`;

  document.getElementById('info-content').innerHTML = html;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  renderHome();
  const todayDay = getTodayWorkout();
  if (todayDay) state.workoutDay = todayDay;

  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
  }, 1200);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
