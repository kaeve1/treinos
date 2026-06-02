(() => {
  'use strict';

  const APP_KEY = 'atlas_fit_store_v1';
  const OLD_KEY = 'treino_data';
  const DATE_LOCALE = 'pt-BR';

  const pages = ['home', 'train', 'progress', 'library', 'settings'];
  const state = {
    page: 'home',
    selectedDay: null,
    openExercise: null,
    timer: null,
    timerTick: null,
    deferredInstallPrompt: null,
    libraryQuery: ''
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  function escapeHTML(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function todayISO(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function formatDate(isoDate, options = { weekday: 'short', day: '2-digit', month: 'short' }) {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(DATE_LOCALE, options);
  }

  function formatTime(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString(DATE_LOCALE, { hour: '2-digit', minute: '2-digit' });
  }

  function secondsToClock(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const normalized = String(value).replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getDow(date = new Date()) {
    return date.getDay();
  }

  function newStore() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      plan: clone(DEFAULT_PLAN),
      sessions: [],
      settings: {
        athleteName: DEFAULT_PLAN.athleteName || 'Atleta',
        weeklyGoal: DEFAULT_PLAN.weeklyGoal || 4,
        unit: 'kg',
        accent: '#7C8CFF',
        compactMode: false
      }
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(APP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return normalizeStore(parsed);
      }
    } catch (error) {
      console.warn('Falha lendo store principal', error);
    }

    const store = newStore();
    migrateLegacySessions(store);
    saveStore(store);
    return store;
  }

  function normalizeStore(store) {
    const base = newStore();
    const normalized = {
      ...base,
      ...store,
      plan: store.plan || base.plan,
      sessions: Array.isArray(store.sessions) ? store.sessions : [],
      settings: { ...base.settings, ...(store.settings || {}) }
    };
    normalized.plan.days = Array.isArray(normalized.plan.days) ? normalized.plan.days : base.plan.days;
    normalized.plan.weeklyGoal = normalized.settings.weeklyGoal;
    return normalized;
  }

  function saveStore(store = appStore) {
    store.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(APP_KEY, JSON.stringify(store));
    } catch (error) {
      toast('Não consegui salvar. O armazenamento do navegador pode estar cheio.');
      console.warn(error);
    }
  }

  function migrateLegacySessions(store) {
    try {
      const raw = localStorage.getItem(OLD_KEY);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      Object.entries(legacy).forEach(([key, session]) => {
        const [date, dayId] = key.split('_');
        const day = store.plan.days.find(item => item.id === dayId);
        if (!date || !day || !session?.sets) return;
        const migrated = createSession(day.id, date, false);
        day.exercises.forEach((exercise, exerciseIndex) => {
          const sets = Array.from({ length: exercise.sets }, (_, setIndex) => ({
            done: Boolean(session.sets[`${exerciseIndex}_${setIndex}`]),
            weight: '',
            reps: '',
            rpe: '',
            at: session.sets[`${exerciseIndex}_${setIndex}`] ? `${date}T12:00:00.000Z` : null
          }));
          migrated.exercises[exercise.id] = { notes: '', skipped: false, sets };
        });
        if (session.completed || countDoneSets(migrated) > 0) migrated.status = 'finished';
        store.sessions.push(migrated);
      });
    } catch (error) {
      console.warn('Migração ignorada', error);
    }
  }

  let appStore = loadStore();
  document.documentElement.style.setProperty('--accent', appStore.settings.accent);
  document.body.classList.toggle('compact', Boolean(appStore.settings.compactMode));

  function getPlanDay(dayId) {
    return appStore.plan.days.find(day => day.id === dayId) || appStore.plan.days[0];
  }

  function getTodayWorkoutId() {
    return appStore.plan.schedule?.[getDow()] || null;
  }

  function getLastCompletedSession(dayId = null) {
    return appStore.sessions
      .filter(session => session.status === 'finished' && (!dayId || session.dayId === dayId))
      .sort((a, b) => new Date(b.endedAt || b.startedAt) - new Date(a.endedAt || a.startedAt))[0] || null;
  }

  function findSession(dayId, date = todayISO()) {
    return appStore.sessions.find(session => session.dayId === dayId && session.date === date && session.status !== 'deleted') || null;
  }

  function createSession(dayId, date = todayISO(), push = true) {
    const day = getPlanDay(dayId);
    const session = {
      id: uid('session'),
      dayId,
      dayLabel: day.label,
      date,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'active',
      notes: '',
      bodyWeight: '',
      exercises: {}
    };

    day.exercises.forEach(exercise => {
      session.exercises[exercise.id] = {
        notes: '',
        skipped: false,
        sets: Array.from({ length: exercise.sets }, () => ({ done: false, weight: '', reps: '', rpe: '', at: null }))
      };
    });

    if (push) {
      appStore.sessions.push(session);
      saveStore();
    }
    return session;
  }

  function getOrCreateSession(dayId) {
    return findSession(dayId) || createSession(dayId);
  }

  function exerciseSession(session, exercise) {
    if (!session.exercises[exercise.id]) {
      session.exercises[exercise.id] = {
        notes: '',
        skipped: false,
        sets: Array.from({ length: exercise.sets }, () => ({ done: false, weight: '', reps: '', rpe: '', at: null }))
      };
    }
    const current = session.exercises[exercise.id];
    while (current.sets.length < exercise.sets) current.sets.push({ done: false, weight: '', reps: '', rpe: '', at: null });
    return current;
  }

  function countDoneSets(session) {
    return Object.values(session?.exercises || {}).reduce((total, ex) => total + ex.sets.filter(set => set.done).length, 0);
  }

  function countTotalSets(day) {
    return day.exercises.reduce((total, exercise) => total + Number(exercise.sets || 0), 0);
  }

  function sessionVolume(session) {
    if (!session) return 0;
    return Object.values(session.exercises || {}).reduce((total, exercise) => total + exercise.sets.reduce((sum, set) => {
      if (!set.done) return sum;
      return sum + parseNumber(set.weight) * parseNumber(set.reps);
    }, 0), 0);
  }

  function allFinishedSessions() {
    return appStore.sessions.filter(session => session.status === 'finished').sort((a, b) => new Date(b.endedAt || b.startedAt) - new Date(a.endedAt || a.startedAt));
  }

  function sessionsInLastDays(days) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return allFinishedSessions().filter(session => new Date(`${session.date}T12:00:00`) >= start);
  }

  function weekRange(date = new Date()) {
    const current = new Date(date);
    current.setHours(12, 0, 0, 0);
    const monday = new Date(current);
    monday.setDate(current.getDate() - ((current.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  }

  function isThisWeek(dateIso) {
    const { monday, sunday } = weekRange();
    const date = new Date(`${dateIso}T12:00:00`);
    return date >= monday && date <= sunday;
  }

  function calcStreak() {
    const trainedDates = new Set(allFinishedSessions().map(session => session.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = todayISO(d);
      if (trainedDates.has(key)) streak += 1;
      else if (i > 0) break;
    }
    return streak;
  }

  function calculatePRs() {
    const prs = new Map();
    allFinishedSessions().forEach(session => {
      const day = getPlanDay(session.dayId);
      day.exercises.forEach(exercise => {
        const exSession = session.exercises?.[exercise.id];
        if (!exSession) return;
        exSession.sets.forEach(set => {
          if (!set.done) return;
          const weight = parseNumber(set.weight);
          const reps = parseNumber(set.reps);
          if (!weight || !reps) return;
          const estimated = weight * (1 + reps / 30);
          const current = prs.get(exercise.id);
          if (!current || estimated > current.estimated) {
            prs.set(exercise.id, { exercise, weight, reps, estimated, date: session.date });
          }
        });
      });
    });
    return Array.from(prs.values()).sort((a, b) => b.estimated - a.estimated);
  }

  function totalVolumeByMuscle(sessions = allFinishedSessions()) {
    const totals = new Map();
    sessions.forEach(session => {
      const day = getPlanDay(session.dayId);
      day.exercises.forEach(exercise => {
        const volume = (session.exercises?.[exercise.id]?.sets || []).reduce((sum, set) => {
          if (!set.done) return sum;
          return sum + parseNumber(set.weight) * parseNumber(set.reps);
        }, 0);
        exercise.muscles.forEach(muscle => totals.set(muscle, (totals.get(muscle) || 0) + volume));
      });
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }

  function getExerciseHistory(exerciseId) {
    return allFinishedSessions().flatMap(session => {
      const ex = session.exercises?.[exerciseId];
      if (!ex) return [];
      const bestSet = ex.sets
        .filter(set => set.done && (parseNumber(set.weight) || parseNumber(set.reps)))
        .sort((a, b) => (parseNumber(b.weight) * parseNumber(b.reps)) - (parseNumber(a.weight) * parseNumber(a.reps)))[0];
      if (!bestSet) return [];
      return [{ date: session.date, set: bestSet, session }];
    });
  }

  function previousExerciseSet(exerciseId, setIndex) {
    const history = getExerciseHistory(exerciseId);
    for (const item of history) {
      const ex = item.session.exercises?.[exerciseId];
      const set = ex?.sets?.[setIndex];
      if (set?.done && (set.weight || set.reps)) return set;
    }
    return null;
  }

  function navigate(page) {
    if (!pages.includes(page)) return;
    state.page = page;
    $$('.page').forEach(item => item.classList.toggle('active', item.id === `page-${page}`));
    $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    const active = $(`#page-${page}`);
    $('#top-title').textContent = active.dataset.title;
    $('#top-eyebrow').textContent = active.dataset.eyebrow;
    render();
  }

  function render() {
    document.documentElement.style.setProperty('--accent', appStore.settings.accent);
    document.body.classList.toggle('compact', Boolean(appStore.settings.compactMode));
    const todayWorkout = getTodayWorkoutId();
    if (!state.selectedDay) state.selectedDay = todayWorkout || appStore.plan.days[0]?.id;

    if (state.page === 'home') renderHome();
    if (state.page === 'train') renderTrain();
    if (state.page === 'progress') renderProgress();
    if (state.page === 'library') renderLibrary();
    if (state.page === 'settings') renderSettings();
    renderQuickAction();
    renderTimer();
  }

  function renderQuickAction() {
    const button = $('#quick-action');
    const labels = {
      home: 'Ir para treino de hoje',
      train: 'Finalizar treino',
      progress: 'Exportar CSV',
      library: 'Adicionar exercício',
      settings: 'Exportar backup'
    };
    button.setAttribute('aria-label', labels[state.page] || 'Ação rápida');
  }

  function renderHome() {
    const page = $('#page-home');
    const todayWorkout = getTodayWorkoutId();
    const todayDay = todayWorkout ? getPlanDay(todayWorkout) : null;
    const sessionsWeek = allFinishedSessions().filter(session => isThisWeek(session.date));
    const trainedThisWeek = new Set(sessionsWeek.map(session => session.date)).size;
    const weekVolume = sessionsWeek.reduce((sum, session) => sum + sessionVolume(session), 0);
    const totalSessions = allFinishedSessions().length;
    const prs = calculatePRs();
    const adherence = Math.round((trainedThisWeek / Math.max(1, appStore.settings.weeklyGoal)) * 100);

    page.innerHTML = `
      <section class="hero-card">
        <div class="hero-gradient"></div>
        <div class="hero-content">
          <p class="eyebrow">${escapeHTML(greeting())}, ${escapeHTML(appStore.settings.athleteName)}</p>
          <h2>${todayDay ? `Hoje é ${escapeHTML(todayDay.label)}` : 'Hoje é recuperação'}</h2>
          <p>${todayDay ? escapeHTML(todayDay.focus) : 'Descanso não é pausa do projeto. É parte da construção.'}</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" data-action="go-train">${todayDay ? 'Abrir treino de hoje' : 'Ver plano'}</button>
            <button class="ghost-btn" type="button" data-action="go-progress">Ver evolução</button>
          </div>
        </div>
      </section>

      <section class="week-card">
        <div class="section-head">
          <div><p class="eyebrow">Semana atual</p><h3>Consistência</h3></div>
          <span class="pill">${trainedThisWeek}/${appStore.settings.weeklyGoal} treinos</span>
        </div>
        ${renderWeekStrip()}
      </section>

      <section class="metric-grid">
        ${metricCard('Sequência', calcStreak(), 'dias', 'Meta: não quebrar o ritmo')}
        ${metricCard('Volume semanal', Math.round(weekVolume).toLocaleString('pt-BR'), appStore.settings.unit, 'Carga × reps concluídas')}
        ${metricCard('Aderência', clamp(adherence, 0, 999), '%', 'Comparado à meta semanal')}
        ${metricCard('Sessões', totalSessions, 'total', 'Treinos finalizados')}
      </section>

      <section class="panel">
        <div class="section-head">
          <div><p class="eyebrow">Operação</p><h3>Próxima sessão</h3></div>
        </div>
        ${renderNextSessionCard(todayDay)}
      </section>

      <section class="panel">
        <div class="section-head">
          <div><p class="eyebrow">Sinais</p><h3>Insights rápidos</h3></div>
        </div>
        ${renderInsights({ trainedThisWeek, weekVolume, prs })}
      </section>
    `;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function metricCard(label, value, suffix, caption) {
    return `<article class="metric-card"><p>${label}</p><strong>${value}<span>${suffix}</span></strong><small>${caption}</small></article>`;
  }

  function renderWeekStrip() {
    const { monday } = weekRange();
    const trainedDates = new Set(allFinishedSessions().map(session => session.date));
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = '<div class="week-strip">';
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = todayISO(date);
      const dow = date.getDay();
      const planned = appStore.plan.schedule?.[dow];
      const trained = trainedDates.has(key);
      const today = key === todayISO();
      html += `<div class="week-day ${today ? 'today' : ''} ${trained ? 'trained' : ''} ${!planned ? 'rest' : ''}">
        <span>${names[dow]}</span>
        <strong>${trained ? '✓' : planned ? planned : '·'}</strong>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  function renderNextSessionCard(todayDay) {
    const nextDay = todayDay || appStore.plan.days[0];
    const existing = todayDay ? findSession(todayDay.id) : null;
    const done = existing ? countDoneSets(existing) : 0;
    const total = todayDay ? countTotalSets(todayDay) : 0;
    const pct = total ? Math.round((done / total) * 100) : 0;

    if (!todayDay) {
      return `<div class="next-card rest-mode"><div><strong>Dia livre</strong><p>Use para alongar, caminhar ou apenas recuperar.</p></div><button class="ghost-btn" data-action="go-train">Abrir treinos</button></div>`;
    }

    return `<div class="next-card" style="--day-color:${todayDay.color}">
      <div class="next-main">
        <span class="day-badge">${escapeHTML(todayDay.day)}</span>
        <h3>${escapeHTML(todayDay.label)}</h3>
        <p>${escapeHTML(todayDay.warmup)}</p>
        <div class="progress-line"><span style="width:${pct}%"></span></div>
        <small>${done}/${total} séries registradas hoje</small>
      </div>
      <button class="primary-btn" data-action="go-train">${pct > 0 ? 'Continuar' : 'Começar'}</button>
    </div>`;
  }

  function renderInsights({ trainedThisWeek, weekVolume, prs }) {
    const insights = [];
    if (trainedThisWeek === 0) insights.push(['Plano parado', 'Comece com uma sessão curta. Abrir o app já removeu metade do atrito.']);
    if (trainedThisWeek >= appStore.settings.weeklyGoal) insights.push(['Meta batida', 'Semana fechada com consistência. Próximo foco: manter carga e técnica.']);
    if (weekVolume > 0) insights.push(['Volume registrado', `${Math.round(weekVolume).toLocaleString('pt-BR')} ${appStore.settings.unit} computados esta semana.`]);
    if (prs.length) insights.push(['Melhor marca estimada', `${prs[0].exercise.name}: ${prs[0].weight}${appStore.settings.unit} × ${prs[0].reps}.`]);
    if (!insights.length) insights.push(['Base pronta', 'Registre carga e repetições para liberar gráficos, PRs e recomendações melhores.']);

    return `<div class="insight-list">${insights.slice(0, 3).map(([title, text]) => `
      <article class="insight"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></article>
    `).join('')}</div>`;
  }

  function renderTrain() {
    const page = $('#page-train');
    const day = getPlanDay(state.selectedDay);
    const session = getOrCreateSession(day.id);
    const done = countDoneSets(session);
    const total = countTotalSets(day);
    const pct = total ? Math.round((done / total) * 100) : 0;

    page.innerHTML = `
      <section class="day-tabs" role="tablist">
        ${appStore.plan.days.map(item => {
          const daySession = findSession(item.id);
          const dayPct = daySession ? Math.round((countDoneSets(daySession) / countTotalSets(item)) * 100) : 0;
          return `<button class="day-tab ${item.id === day.id ? 'active' : ''}" type="button" data-action="select-day" data-day="${item.id}" style="--day-color:${item.color}">
            <span>${escapeHTML(item.id)}</span><strong>${escapeHTML(item.label)}</strong>${dayPct ? `<em>${dayPct}%</em>` : ''}
          </button>`;
        }).join('')}
      </section>

      <section class="workout-hero" style="--day-color:${day.color}">
        <div>
          <p class="eyebrow">${escapeHTML(day.day)}</p>
          <h2>${escapeHTML(day.label)}</h2>
          <p>${escapeHTML(day.focus)}</p>
        </div>
        <strong>${pct}%</strong>
      </section>

      <section class="session-toolbar">
        <div>
          <span>${done}/${total} séries</span>
          <div class="progress-line"><span style="width:${pct}%; background:${day.color}"></span></div>
        </div>
        <button class="primary-btn" type="button" data-action="finish-session" data-day="${day.id}">${pct === 100 ? 'Finalizar' : 'Finalizar parcial'}</button>
      </section>

      <section class="warmup-card">
        <strong>Aquecimento</strong>
        <p>${escapeHTML(day.warmup || 'Faça séries leves e prepare as articulações antes de subir carga.')}</p>
      </section>

      <section class="exercise-list">
        ${day.exercises.map((exercise, index) => renderExerciseCard(day, session, exercise, index)).join('')}
      </section>

      <section class="notes-card">
        <label for="session-notes">Notas da sessão</label>
        <textarea id="session-notes" data-action="session-notes" data-session="${session.id}" placeholder="Como foi o treino? Alguma dor, carga difícil, energia baixa?">${escapeHTML(session.notes || '')}</textarea>
      </section>
    `;
  }

  function renderExerciseCard(day, session, exercise, index) {
    const exData = exerciseSession(session, exercise);
    const done = exData.sets.filter(set => set.done).length;
    const total = exercise.sets;
    const open = state.openExercise === exercise.id;
    const lastHistory = getExerciseHistory(exercise.id)[0];
    const lastText = lastHistory ? `${formatDate(lastHistory.date, { day: '2-digit', month: 'short' })} · ${lastHistory.set.weight || '—'}${appStore.settings.unit} × ${lastHistory.set.reps || '—'}` : 'Sem histórico de carga';

    return `<article class="exercise-card ${done === total ? 'done' : ''}" style="--day-color:${day.color}">
      <button class="exercise-head" type="button" data-action="toggle-exercise" data-exercise="${exercise.id}">
        <div class="exercise-index">${String(index + 1).padStart(2, '0')}</div>
        <div>
          <h3>${escapeHTML(exercise.name)}</h3>
          <p>${escapeHTML(exercise.sets)}×${escapeHTML(exercise.reps)} · ${escapeHTML(exercise.equipment || 'Livre')} · descanso ${exercise.rest || 90}s</p>
          <div class="tag-row">${[...exercise.muscles, ...(exercise.secondary || [])].slice(0, 4).map(muscle => `<span>${escapeHTML(muscle)}</span>`).join('')}</div>
        </div>
        <aside><strong>${done}/${total}</strong><span>${open ? '⌃' : '⌄'}</span></aside>
      </button>
      ${open ? `<div class="exercise-body">
        <div class="technical-grid">
          <div><span>Tempo</span><strong>${escapeHTML(exercise.tempo || 'Controlado')}</strong></div>
          <div><span>Último registro</span><strong>${escapeHTML(lastText)}</strong></div>
        </div>
        <div class="cue-list">${(exercise.cues || []).map(cue => `<p>• ${escapeHTML(cue)}</p>`).join('')}</div>
        <div class="sets-table">
          <div class="set-row set-head"><span>Série</span><span>Carga</span><span>Reps</span><span>RPE</span><span>Ok</span></div>
          ${exData.sets.map((set, setIndex) => renderSetRow(day, session, exercise, set, setIndex)).join('')}
        </div>
        <div class="exercise-actions">
          <button class="ghost-btn" type="button" data-action="start-rest" data-seconds="${exercise.rest || 90}">Descanso ${exercise.rest || 90}s</button>
          <a class="link-btn" href="https://www.google.com/search?q=${encodeURIComponent(exercise.name + ' técnica exercício')}" target="_blank" rel="noopener">Ver técnica</a>
        </div>
      </div>` : ''}
    </article>`;
  }

  function renderSetRow(day, session, exercise, set, setIndex) {
    const previous = previousExerciseSet(exercise.id, setIndex);
    return `<div class="set-row ${set.done ? 'checked' : ''}" data-session="${session.id}" data-exercise="${exercise.id}" data-set="${setIndex}">
      <span class="set-number">${setIndex + 1}</span>
      <label><input inputmode="decimal" aria-label="Carga série ${setIndex + 1}" data-action="set-field" data-field="weight" value="${escapeHTML(set.weight)}" placeholder="${previous?.weight || 'kg'}"></label>
      <label><input inputmode="numeric" aria-label="Repetições série ${setIndex + 1}" data-action="set-field" data-field="reps" value="${escapeHTML(set.reps)}" placeholder="${previous?.reps || exercise.reps}"></label>
      <label><input inputmode="decimal" aria-label="RPE série ${setIndex + 1}" data-action="set-field" data-field="rpe" value="${escapeHTML(set.rpe)}" placeholder="8"></label>
      <button class="check-btn" type="button" data-action="toggle-set" aria-label="Concluir série ${setIndex + 1}">${set.done ? '✓' : ''}</button>
    </div>`;
  }

  function renderProgress() {
    const page = $('#page-progress');
    const sessions = allFinishedSessions();
    const last30 = sessionsInLastDays(30).reverse();
    const weekSessions = sessions.filter(session => isThisWeek(session.date));
    const totalVolume = sessions.reduce((sum, session) => sum + sessionVolume(session), 0);
    const prs = calculatePRs();
    const muscleTotals = totalVolumeByMuscle(sessionsInLastDays(60));

    page.innerHTML = `
      <section class="metric-grid">
        ${metricCard('Treinos', sessions.length, 'finalizados', 'Histórico completo')}
        ${metricCard('Volume total', Math.round(totalVolume).toLocaleString('pt-BR'), appStore.settings.unit, 'Soma registrada')}
        ${metricCard('Esta semana', weekSessions.length, 'sessões', 'Dentro da meta')}
        ${metricCard('PRs', prs.length, 'exercícios', 'Estimativa 1RM')}
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Últimos 30 dias</p><h3>Volume por treino</h3></div><button class="ghost-btn small" data-action="export-csv">CSV</button></div>
        ${renderVolumeChart(last30)}
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Distribuição</p><h3>Volume por músculo</h3></div></div>
        ${renderMuscleBars(muscleTotals)}
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Performance</p><h3>Melhores marcas</h3></div></div>
        ${renderPrList(prs)}
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Log</p><h3>Histórico de sessões</h3></div></div>
        ${renderSessionHistory(sessions)}
      </section>
    `;
  }

  function renderVolumeChart(sessions) {
    if (!sessions.length) return '<p class="empty">Registre carga e repetições para gerar o gráfico.</p>';
    const max = Math.max(...sessions.map(sessionVolume), 1);
    return `<div class="bar-chart">${sessions.slice(-12).map(session => {
      const volume = sessionVolume(session);
      const height = Math.max(6, Math.round((volume / max) * 100));
      return `<div class="bar-item" title="${escapeHTML(session.dayLabel)} · ${volume}${appStore.settings.unit}"><span style="height:${height}%"></span><small>${new Date(`${session.date}T12:00:00`).getDate()}</small></div>`;
    }).join('')}</div>`;
  }

  function renderMuscleBars(items) {
    if (!items.length) return '<p class="empty">Sem volume calculado ainda.</p>';
    const max = Math.max(...items.map(item => item[1]), 1);
    return `<div class="muscle-bars">${items.slice(0, 8).map(([muscle, volume]) => `
      <div class="muscle-line"><span>${escapeHTML(muscle)}</span><div><i style="width:${Math.round((volume / max) * 100)}%"></i></div><strong>${Math.round(volume).toLocaleString('pt-BR')}</strong></div>
    `).join('')}</div>`;
  }

  function renderPrList(prs) {
    if (!prs.length) return '<p class="empty">Ainda não há PRs. Preencha carga e reps nas séries.</p>';
    return `<div class="pr-list">${prs.slice(0, 10).map(pr => `
      <article class="pr-card"><div><strong>${escapeHTML(pr.exercise.name)}</strong><p>${escapeHTML(formatDate(pr.date))}</p></div><span>${escapeHTML(pr.weight)}${appStore.settings.unit} × ${escapeHTML(pr.reps)}</span></article>
    `).join('')}</div>`;
  }

  function renderSessionHistory(sessions) {
    if (!sessions.length) return '<p class="empty">Nenhum treino finalizado.</p>';
    return `<div class="history-list">${sessions.slice(0, 20).map(session => {
      const day = getPlanDay(session.dayId);
      const done = countDoneSets(session);
      const total = countTotalSets(day);
      const volume = sessionVolume(session);
      return `<article class="history-card" style="--day-color:${day.color}">
        <div><strong>${escapeHTML(session.dayLabel || day.label)}</strong><p>${escapeHTML(formatDate(session.date, { weekday: 'long', day: '2-digit', month: 'long' }))} · ${formatTime(session.startedAt)}</p></div>
        <aside><span>${done}/${total}</span><small>${Math.round(volume).toLocaleString('pt-BR')} ${appStore.settings.unit}</small></aside>
      </article>`;
    }).join('')}</div>`;
  }

  function renderLibrary() {
    const page = $('#page-library');
    const selected = getPlanDay(state.selectedDay);
    const allExercises = appStore.plan.days.flatMap(day => day.exercises.map(exercise => ({ ...exercise, day })));
    const filtered = allExercises.filter(item => item.name.toLowerCase().includes(state.libraryQuery.toLowerCase()) || item.muscles.join(' ').toLowerCase().includes(state.libraryQuery.toLowerCase()));

    page.innerHTML = `
      <section class="panel builder-panel">
        <div class="section-head"><div><p class="eyebrow">Sem editar código</p><h3>Construtor de treino</h3></div></div>
        <div class="builder-grid">
          <label>Treino
            <select data-action="builder-day">
              ${appStore.plan.days.map(day => `<option value="${day.id}" ${day.id === selected.id ? 'selected' : ''}>${escapeHTML(day.label)}</option>`).join('')}
            </select>
          </label>
          <label>Nome do exercício<input id="new-ex-name" placeholder="Ex: Rosca Scott"></label>
          <label>Séries<input id="new-ex-sets" inputmode="numeric" value="3"></label>
          <label>Reps<input id="new-ex-reps" value="10–12"></label>
          <label>Descanso em segundos<input id="new-ex-rest" inputmode="numeric" value="90"></label>
          <label>Músculos<input id="new-ex-muscles" placeholder="Bíceps, antebraço"></label>
        </div>
        <button class="primary-btn full" type="button" data-action="add-exercise">Adicionar ao ${escapeHTML(selected.label)}</button>
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">${escapeHTML(selected.label)}</p><h3>Ordem dos exercícios</h3></div></div>
        <div class="sortable-list">
          ${selected.exercises.map((exercise, index) => `
            <article class="sortable-item">
              <span>${index + 1}</span>
              <div><strong>${escapeHTML(exercise.name)}</strong><p>${exercise.sets}×${escapeHTML(exercise.reps)} · ${escapeHTML((exercise.muscles || []).join(', '))}</p></div>
              <aside>
                <button type="button" data-action="move-exercise" data-dir="up" data-day="${selected.id}" data-index="${index}">↑</button>
                <button type="button" data-action="move-exercise" data-dir="down" data-day="${selected.id}" data-index="${index}">↓</button>
                <button type="button" data-action="delete-exercise" data-day="${selected.id}" data-index="${index}">×</button>
              </aside>
            </article>`).join('')}
        </div>
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Catálogo</p><h3>Biblioteca de exercícios</h3></div></div>
        <input class="search-input" data-action="library-search" value="${escapeHTML(state.libraryQuery)}" placeholder="Buscar por nome ou músculo">
        <div class="library-grid">
          ${filtered.map(item => `<article class="library-card" style="--day-color:${item.day.color}"><div><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.day.label)} · ${escapeHTML((item.muscles || []).join(', '))}</p></div><span>${item.sets}×${escapeHTML(item.reps)}</span></article>`).join('') || '<p class="empty">Nenhum exercício encontrado.</p>'}
        </div>
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Guia rápido</p><h3>Princípios</h3></div></div>
        <div class="knowledge-grid">${KNOWLEDGE_CARDS.map(card => `<article><span>${escapeHTML(card.tag)}</span><strong>${escapeHTML(card.title)}</strong><p>${escapeHTML(card.text)}</p></article>`).join('')}</div>
      </section>
    `;
  }

  function renderSettings() {
    const page = $('#page-settings');
    page.innerHTML = `
      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">Identidade</p><h3>Personalização</h3></div></div>
        <div class="settings-grid">
          <label>Nome<input data-action="setting" data-setting="athleteName" value="${escapeHTML(appStore.settings.athleteName)}"></label>
          <label>Meta semanal<input data-action="setting" data-setting="weeklyGoal" inputmode="numeric" value="${escapeHTML(appStore.settings.weeklyGoal)}"></label>
          <label>Unidade<select data-action="setting" data-setting="unit"><option value="kg" ${appStore.settings.unit === 'kg' ? 'selected' : ''}>kg</option><option value="lb" ${appStore.settings.unit === 'lb' ? 'selected' : ''}>lb</option></select></label>
          <label>Cor de destaque<input data-action="setting" data-setting="accent" type="color" value="${escapeHTML(appStore.settings.accent)}"></label>
        </div>
        <label class="switch-row"><input type="checkbox" data-action="setting" data-setting="compactMode" ${appStore.settings.compactMode ? 'checked' : ''}><span>Modo compacto para usar no treino</span></label>
      </section>

      <section class="panel danger-zone">
        <div class="section-head"><div><p class="eyebrow">Dados</p><h3>Backup, importação e reset</h3></div></div>
        <div class="button-grid">
          <button class="ghost-btn" type="button" data-action="export-json">Exportar backup JSON</button>
          <button class="ghost-btn" type="button" data-action="export-csv">Exportar histórico CSV</button>
          <label class="file-btn">Importar backup<input type="file" accept="application/json" data-action="import-json"></label>
          <button class="danger-btn" type="button" data-action="reset-plan">Restaurar plano padrão</button>
          <button class="danger-btn" type="button" data-action="wipe-data">Apagar tudo</button>
        </div>
        <p class="privacy-note">Tudo fica salvo apenas neste navegador via localStorage. Não há servidor, login nem envio de dados.</p>
      </section>

      <section class="panel">
        <div class="section-head"><div><p class="eyebrow">PWA</p><h3>Instalação</h3></div></div>
        <p class="privacy-note">No celular, abra pelo navegador e adicione à tela inicial. O app funciona offline depois do primeiro carregamento.</p>
        <button class="primary-btn full" type="button" data-action="install-app">Instalar se disponível</button>
      </section>
    `;
  }

  function updateSetField(row, field, value) {
    const session = appStore.sessions.find(item => item.id === row.dataset.session);
    const exercise = session?.exercises?.[row.dataset.exercise];
    const set = exercise?.sets?.[Number(row.dataset.set)];
    if (!set) return;
    set[field] = value;
    saveStore();
  }

  function toggleSet(row) {
    const session = appStore.sessions.find(item => item.id === row.dataset.session);
    const exercise = session?.exercises?.[row.dataset.exercise];
    const set = exercise?.sets?.[Number(row.dataset.set)];
    if (!set) return;
    set.done = !set.done;
    set.at = set.done ? new Date().toISOString() : null;
    saveStore();
    renderTrain();
  }

  function finishSession(dayId) {
    const session = getOrCreateSession(dayId);
    if (countDoneSets(session) === 0) {
      toast('Registre pelo menos uma série antes de finalizar.');
      return;
    }
    session.status = 'finished';
    session.endedAt = new Date().toISOString();
    session.dayLabel = getPlanDay(dayId).label;
    saveStore();
    toast('Treino finalizado e salvo no histórico.');
    navigate('progress');
  }

  function addExercise() {
    const day = getPlanDay(state.selectedDay);
    const name = $('#new-ex-name')?.value.trim();
    if (!name) {
      toast('Informe o nome do exercício.');
      return;
    }
    const sets = clamp(parseInt($('#new-ex-sets')?.value || '3', 10) || 3, 1, 12);
    const reps = $('#new-ex-reps')?.value.trim() || '10–12';
    const rest = clamp(parseInt($('#new-ex-rest')?.value || '90', 10) || 90, 15, 600);
    const muscles = ($('#new-ex-muscles')?.value || 'Geral').split(',').map(item => item.trim()).filter(Boolean);
    day.exercises.push({
      id: uid('ex'),
      name,
      sets,
      reps,
      rest,
      muscles,
      secondary: [],
      equipment: 'Livre',
      tempo: 'Controlado',
      cues: ['Execute com amplitude segura', 'Controle a descida', 'Registre carga e reps']
    });
    saveStore();
    toast('Exercício adicionado ao treino.');
    renderLibrary();
  }

  function moveExercise(dayId, index, dir) {
    const day = getPlanDay(dayId);
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= day.exercises.length) return;
    [day.exercises[index], day.exercises[target]] = [day.exercises[target], day.exercises[index]];
    saveStore();
    renderLibrary();
  }

  function deleteExercise(dayId, index) {
    const day = getPlanDay(dayId);
    const [removed] = day.exercises.splice(index, 1);
    saveStore();
    toast(`${removed.name} removido do plano.`);
    renderLibrary();
  }

  function exportJSON() {
    downloadFile(`atlas-fit-backup-${todayISO()}.json`, JSON.stringify(appStore, null, 2), 'application/json');
  }

  function exportCSV() {
    const rows = [['date', 'day', 'exercise', 'set', 'weight', 'reps', 'rpe', 'volume']];
    allFinishedSessions().reverse().forEach(session => {
      const day = getPlanDay(session.dayId);
      day.exercises.forEach(exercise => {
        const ex = session.exercises?.[exercise.id];
        if (!ex) return;
        ex.sets.forEach((set, index) => {
          if (!set.done) return;
          const weight = parseNumber(set.weight);
          const reps = parseNumber(set.reps);
          rows.push([session.date, day.label, exercise.name, index + 1, set.weight || '', set.reps || '', set.rpe || '', weight * reps]);
        });
      });
    });
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    downloadFile(`atlas-fit-historico-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        appStore = normalizeStore(parsed);
        saveStore();
        toast('Backup importado.');
        render();
      } catch {
        toast('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  function resetPlan() {
    if (!confirm('Restaurar apenas o plano padrão? Seu histórico será mantido.')) return;
    appStore.plan = clone(DEFAULT_PLAN);
    appStore.settings.weeklyGoal = DEFAULT_PLAN.weeklyGoal || 4;
    state.selectedDay = getTodayWorkoutId() || appStore.plan.days[0].id;
    saveStore();
    render();
  }

  function wipeData() {
    if (!confirm('Apagar histórico, plano e ajustes deste navegador?')) return;
    localStorage.removeItem(APP_KEY);
    appStore = newStore();
    state.selectedDay = getTodayWorkoutId() || appStore.plan.days[0].id;
    saveStore();
    render();
  }

  function startRest(seconds) {
    state.timer = {
      seconds: Number(seconds) || 90,
      endAt: Date.now() + (Number(seconds) || 90) * 1000
    };
    clearInterval(state.timerTick);
    state.timerTick = setInterval(renderTimer, 250);
    renderTimer();
  }

  function stopRest() {
    state.timer = null;
    clearInterval(state.timerTick);
    renderTimer();
  }

  function renderTimer() {
    const el = $('#rest-timer');
    if (!state.timer) {
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }
    const remaining = Math.ceil((state.timer.endAt - Date.now()) / 1000);
    if (remaining <= 0) {
      stopRest();
      toast('Descanso concluído. Próxima série.');
      if ('vibrate' in navigator) navigator.vibrate([80, 50, 80]);
      return;
    }
    el.classList.remove('hidden');
    el.innerHTML = `<button type="button" data-action="stop-rest">×</button><div><span>Descanso</span><strong>${secondsToClock(remaining)}</strong></div>`;
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function installApp() {
    if (!state.deferredInstallPrompt) {
      toast('Use o menu do navegador para adicionar à tela inicial.');
      return;
    }
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
  }

  function quickAction() {
    if (state.page === 'home') navigate('train');
    else if (state.page === 'train') finishSession(state.selectedDay);
    else if (state.page === 'progress') exportCSV();
    else if (state.page === 'library') addExercise();
    else if (state.page === 'settings') exportJSON();
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'go-train') navigate('train');
    if (action === 'go-progress') navigate('progress');
    if (action === 'select-day') { state.selectedDay = target.dataset.day; state.openExercise = null; renderTrain(); }
    if (action === 'toggle-exercise') { state.openExercise = state.openExercise === target.dataset.exercise ? null : target.dataset.exercise; renderTrain(); }
    if (action === 'toggle-set') toggleSet(target.closest('.set-row'));
    if (action === 'finish-session') finishSession(target.dataset.day);
    if (action === 'start-rest') startRest(target.dataset.seconds);
    if (action === 'stop-rest') stopRest();
    if (action === 'add-exercise') addExercise();
    if (action === 'move-exercise') moveExercise(target.dataset.day, Number(target.dataset.index), target.dataset.dir);
    if (action === 'delete-exercise') deleteExercise(target.dataset.day, Number(target.dataset.index));
    if (action === 'export-json') exportJSON();
    if (action === 'export-csv') exportCSV();
    if (action === 'reset-plan') resetPlan();
    if (action === 'wipe-data') wipeData();
    if (action === 'install-app') installApp();
  });

  document.addEventListener('input', event => {
    const target = event.target;
    const action = target.dataset.action;
    if (action === 'set-field') updateSetField(target.closest('.set-row'), target.dataset.field, target.value);
    if (action === 'session-notes') {
      const session = appStore.sessions.find(item => item.id === target.dataset.session);
      if (session) { session.notes = target.value; saveStore(); }
    }
    if (action === 'library-search') { state.libraryQuery = target.value; renderLibrary(); }
    if (action === 'setting') {
      const key = target.dataset.setting;
      let value = target.type === 'checkbox' ? target.checked : target.value;
      if (key === 'weeklyGoal') value = clamp(parseInt(value, 10) || 1, 1, 7);
      appStore.settings[key] = value;
      if (key === 'weeklyGoal') appStore.plan.weeklyGoal = value;
      saveStore();
      if (key === 'accent' || key === 'compactMode') render();
    }
  });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.dataset.action === 'builder-day') {
      state.selectedDay = target.value;
      renderLibrary();
    }
    if (target.dataset.action === 'import-json') importJSON(target.files?.[0]);
  });

  $$('.nav-item').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
  $('#quick-action').addEventListener('click', quickAction);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
  });

  window.addEventListener('load', () => {
    setTimeout(() => $('#splash').classList.add('hidden'), 500);
    state.selectedDay = getTodayWorkoutId() || appStore.plan.days[0].id;
    navigate('home');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker ignorado', error));
    }
  });
})();
