// 모션 스터디 컨트롤러: 시안 선택(URL ?variant=A–E), 단일 캔버스 수명주기, 재생 시간 관리.
(() => {
  const { variants } = window.MS;
  const KEYS = ['A', 'B', 'C', 'D', 'E'];
  const SNAPSHOT_T = 4.2; // prefers-reduced-motion 정지 화면 시점

  const hero = document.querySelector('[data-hero]');
  const art = document.querySelector('[data-art]');
  const copy = document.querySelector('[data-copy]');
  const keysWrap = document.querySelector('[data-keys]');
  const nameEl = document.querySelector('[data-name]');
  const statusEl = document.querySelector('[data-status]');
  const playBtn = document.querySelector('[data-play]');
  const prevBtn = document.querySelector('[data-prev]');
  const nextBtn = document.querySelector('[data-next]');

  const state = {
    key: null,
    inst: null,
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    dpr: 1,
    elapsed: 0, // 실제로 재생된 시간만 누적
    userPaused: false,
    hidden: document.hidden,
    offscreen: false,
    reduced: false,
    ticking: false,
  };

  const keyButtons = KEYS.map((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw-key';
    b.textContent = k;
    b.setAttribute('aria-label', `시안 ${k} · ${variants[k].name}`);
    b.addEventListener('click', () => select(k, true));
    keysWrap.append(b);
    return b;
  });

  const isRunning = () => !state.userPaused && !state.hidden && !state.offscreen && !state.reduced;

  function draw() {
    if (!state.inst || !state.w) return;
    state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.inst.draw(state.ctx, state.reduced ? SNAPSHOT_T : state.elapsed);
  }

  function tick(_time, deltaMs) {
    state.elapsed += Math.min(deltaMs, 50) / 1000;
    draw();
  }

  function sync() {
    const run = isRunning();
    if (run !== state.ticking) {
      if (run) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
      state.ticking = run;
    }
    renderUI();
  }

  function renderUI() {
    keyButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(KEYS[i] === state.key)));
    nameEl.textContent = `${state.key} · ${variants[state.key].name}`;
    statusEl.textContent = state.reduced ? '정지 화면' : state.userPaused ? '일시정지' : '재생 중';
    playBtn.disabled = state.reduced;
    playBtn.textContent = state.userPaused || state.reduced ? '▶︎' : '❚❚';
    playBtn.setAttribute('aria-label', state.userPaused ? '재생' : '일시정지');
    playBtn.setAttribute('aria-pressed', String(state.userPaused));
  }

  // 캔버스 크기와 제목 영역(clear)을 다시 재고 즉시 한 프레임 그린다 → 빈 캔버스 없음.
  function measure() {
    if (!state.inst) return;
    const a = art.getBoundingClientRect();
    const c = copy.getBoundingClientRect();
    const w = Math.round(a.width);
    const h = Math.round(a.height);
    if (!w || !h) return;
    state.w = w;
    state.h = h;
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.canvas.width = Math.round(w * state.dpr);
    state.canvas.height = Math.round(h * state.dpr);
    state.inst.resize(w, h, { x: c.left - a.left, y: c.top - a.top, w: c.width, h: c.height });
    draw();
  }

  function select(key, push) {
    if (!variants[key] || key === state.key) return;
    state.canvas?.remove(); // 시안은 리스너/타이머를 갖지 않으므로 캔버스 교체로 정리 끝
    const v = variants[key];
    state.key = key;
    hero.dataset.layout = v.layout;
    document.body.dataset.variant = key;
    state.canvas = document.createElement('canvas');
    state.canvas.setAttribute('aria-hidden', 'true');
    art.append(state.canvas);
    state.ctx = state.canvas.getContext('2d');
    state.inst = v.create();
    state.elapsed = 0;
    measure();
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('variant', key);
      history.pushState({ variant: key }, '', url);
    }
    renderUI();
  }

  const step = (d) => select(KEYS[(KEYS.indexOf(state.key) + d + KEYS.length) % KEYS.length], true);

  function readKey() {
    const k = (new URLSearchParams(location.search).get('variant') || '').toUpperCase();
    return KEYS.includes(k) ? k : 'A';
  }

  // ---- init ----
  const initial = readKey();
  select(initial, false);
  if (new URLSearchParams(location.search).get('variant') !== initial) {
    const url = new URL(location.href);
    url.searchParams.set('variant', initial);
    history.replaceState({ variant: initial }, '', url);
  }

  const ro = new ResizeObserver(measure);
  ro.observe(art);
  ro.observe(copy);
  document.fonts?.ready.then(measure);

  new IntersectionObserver(([entry]) => {
    state.offscreen = !entry.isIntersecting;
    sync();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    state.hidden = document.hidden;
    sync();
  });

  window.addEventListener('popstate', () => select(readKey(), false));

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target;
    if (t instanceof Element && (t.closest('input, textarea, select') || t.isContentEditable)) return;
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  playBtn.addEventListener('click', () => {
    state.userPaused = !state.userPaused;
    sync();
  });

  // matchMedia 콜백은 add() 안에서 동기 실행되므로 모든 참조/상태가 준비된 뒤 등록한다.
  gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
    state.reduced = true;
    sync();
    draw();
    return () => {
      state.reduced = false;
      sync();
      draw();
    };
  });

  sync();
})();
