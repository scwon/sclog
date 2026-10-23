(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const VARIANTS = { A: '날의 직물', B: '뒤집히는 글자', C: '끊기지 않는 한 줄' };
  const KEYS = Object.keys(VARIANTS);
  const requested = (new URLSearchParams(location.search).get('variant') || 'A').toUpperCase();
  const variant = KEYS.includes(requested) ? requested : 'A';
  document.documentElement.dataset.variant = variant;

  const CORAL = '#E9AC9F';
  const INK = '#242424';

  const hero = document.querySelector('.hero');

  // motion: 시스템 설정이 모션을 허용하는가 / userPaused: 컨트롤로 멈췄는가 / heroVisible: hero가 화면 안인가
  const state = { motion: false, userPaused: false, heroVisible: true, scene: null };

  function sync() {
    const scene = state.scene;
    if (!scene) return;
    if (state.motion && !state.userPaused && state.heroVisible) scene.play();
    else scene.pause();
  }

  /* ---------- 공통 도구 ---------- */

  // 캔버스를 CSS 크기에 맞춘다. DPR 상한 2. 크기가 바뀔 때마다 onResize 호출.
  function setupCanvas(canvas, extraTargets, onResize) {
    const ctx = canvas.getContext('2d');
    const s = { ctx, w: 0, h: 0 };
    const fit = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = w;
      s.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize(s);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    extraTargets.forEach((el) => ro.observe(el));
    fit();
    return { s, destroy: () => ro.disconnect() };
  }

  // gsap.ticker에 붙는 그리기 루프. 자체 시계를 써서 재생을 재개해도 튀지 않는다.
  function createLoop(render, t0) {
    let t = t0;
    let running = false;
    const tick = (time, deltaTime) => {
      t += Math.min(deltaTime, 50) / 1000;
      render(t);
    };
    return {
      play() {
        if (running) return;
        running = true;
        gsap.ticker.add(tick);
      },
      pause() {
        if (!running) return;
        running = false;
        gsap.ticker.remove(tick);
      },
      frame() { render(t); },
    };
  }

  // hero 기준 포인터 좌표. step()으로 매 프레임 부드럽게 따라간다.
  function trackPointer(el) {
    const p = { x: -9999, y: -9999, tx: 0, ty: 0, a: 0, ta: 0 };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      p.tx = e.clientX - r.left;
      p.ty = e.clientY - r.top;
      p.ta = 1;
      if (p.a < 0.02) { p.x = p.tx; p.y = p.ty; }
    };
    const leave = () => { p.ta = 0; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    p.step = () => {
      p.x += (p.tx - p.x) * 0.12;
      p.y += (p.ty - p.y) * 0.12;
      p.a += (p.ta - p.a) * 0.06;
    };
    p.destroy = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
    };
    return p;
  }

  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function ramp(from, to, steps) {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return Array.from({ length: steps }, (_, i) => {
      const k = i / (steps - 1);
      return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
    });
  }

  /* ---------- A: 날의 직물 ---------- */

  function fabric(opts) {
    const canvas = hero.querySelector('.hero-art--back canvas');
    const copy = hero.querySelector('.hero-copy');
    const pointer = trackPointer(hero);
    const box = { left: 0, right: 0, top: 0, bottom: 0 };
    const gap = opts.mobile ? 8 : 10;
    const rows = opts.mobile ? 36 : 56;
    let loop = null;

    // 직물은 제목 위 영역에만 짠다. 제목 주변은 비워 둔다.
    const view = setupCanvas(canvas, [copy], (s) => {
      const cs = getComputedStyle(hero);
      box.left = parseFloat(cs.paddingLeft);
      box.right = s.w - parseFloat(cs.paddingRight);
      box.top = parseFloat(cs.paddingTop) + (opts.mobile ? 4 : 12);
      box.bottom = Math.max(box.top + 120, copy.offsetTop - (opts.mobile ? 32 : 52));
      if (loop) loop.frame();
    });

    function render(t) {
      const { ctx, w, h } = view.s;
      if (!w) return;
      pointer.step();
      ctx.clearRect(0, 0, w, h);

      const { left, right, top, bottom } = box;
      const fh = bottom - top;
      const cols = Math.floor((right - left) / gap);
      const startX = left + (right - left - cols * gap) / 2;
      const amp = Math.min(34, fh * 0.1);
      const R = opts.mobile ? 80 : 150;
      const { x: px, y: py, a: pa } = pointer;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';

      for (let i = 0; i <= cols; i++) {
        const x0 = startX + i * gap;
        // 굵기 파동: 실 굵기가 옆으로 흘러가며 곡면의 명암처럼 보인다
        const ripple = 0.5 + 0.5 * Math.sin(x0 * 0.017 - t * 2.0);
        const swell = ripple * ripple;
        // 코랄 띠의 중심과 폭
        const bandC = top + fh * (0.5 + 0.28 * Math.sin(x0 * 0.0031 - t * 0.55) + 0.1 * Math.sin(x0 * 0.0087 + t * 0.8));
        const bandH = fh * (0.075 + 0.035 * Math.sin(x0 * 0.0052 - t * 0.9));
        const coralPath = new Path2D();
        let mode = 0;
        let prevX = 0;
        let prevY = 0;

        ctx.beginPath();
        for (let j = 0; j <= rows; j++) {
          const u = j / rows;
          const y = top + u * fh;
          const env = Math.sin(Math.PI * u); // 위아래 끝은 고정된 실
          let x = x0 + amp * env * (
            0.7 * Math.sin(x0 * 0.011 - t * 1.3 + u * 2.8) +
            0.45 * Math.sin(x0 * 0.0045 + t * 0.75 - u * 3.6)
          );
          if (pa > 0.01) {
            const dx = x - px;
            const dy = y - py;
            const f = Math.exp(-(dx * dx + dy * dy) / (R * R)) * pa * env;
            x += (dx / (Math.abs(dx) + 18)) * f * R * 0.5;
          }
          if (j > 0) {
            if (Math.abs((y + prevY) / 2 - bandC) < bandH) {
              if (mode !== 2) coralPath.moveTo(prevX, prevY);
              coralPath.lineTo(x, y);
              mode = 2;
            } else {
              if (mode !== 1) ctx.moveTo(prevX, prevY);
              ctx.lineTo(x, y);
              mode = 1;
            }
          }
          prevX = x;
          prevY = y;
        }
        ctx.globalAlpha = 0.3 + 0.62 * swell;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.6 + 2.0 * swell;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 1.6 + 2.6 * swell;
        ctx.stroke(coralPath);
      }
    }

    loop = createLoop(render, 2.4);
    loop.frame();

    return {
      play: loop.play,
      pause: loop.pause,
      destroy() {
        loop.pause();
        view.destroy();
        pointer.destroy();
      },
    };
  }

  /* ---------- B: 뒤집히는 글자 ---------- */

  function flipTitle(opts) {
    const noop = { play() {}, pause() {}, destroy() {} };
    if (!opts.motion) return noop; // 모션 꺼짐: 일반 텍스트 제목 그대로

    const title = hero.querySelector('.title-visual');
    const n = opts.mobile ? 8 : 12;
    const linesHTML = Array.from(title.querySelectorAll(':scope > .title-line'))
      .map((el) => el.outerHTML).join('');

    const wrap = document.createElement('span');
    wrap.className = 'slats';
    wrap.style.setProperty('--n', n);
    for (let k = 0; k < n; k++) {
      const face = (side) => `<span class="face face--${side}"><span class="face-text">${linesHTML}</span></span>`;
      wrap.insertAdjacentHTML('beforeend',
        `<span class="slat" style="--k:${k}"><span class="slat-inner">${face('front')}${face('back')}</span></span>`);
    }
    title.appendChild(wrap);
    title.classList.add('is-slatted');

    const slats = Array.from(wrap.children);
    const inners = slats.map((s) => s.firstElementChild);
    const odd = inners.filter((_, i) => i % 2);
    const even = inners.filter((_, i) => !(i % 2));

    // 차콜 정렬 → 코랄로 넘어가는 파동 → 줄무늬(교대) → 다시 차콜 정렬
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { duration: 0.95, ease: 'power3.inOut' } })
      .to(inners, { rotationX: 180, stagger: 0.07 }, 1.8)
      .to(odd, { rotationX: 360, stagger: { each: 0.09, from: 'end' } }, '+=1.4')
      .to(even, { rotationX: 360, stagger: { each: 0.09, from: 'end' } }, '+=1.1')
      .set(inners, { rotationX: 0 }, '+=0.01');

    // 포인터 근처 슬랫이 위아래로 벌어진다 (inner의 뒤집기와 별도 요소에 적용)
    const tilt = slats.map((s) => gsap.quickTo(s, 'rotationX', { duration: 0.7, ease: 'power3.out' }));
    let active = false;
    const move = (e) => {
      if (!active) return;
      const r = title.getBoundingClientRect();
      const y = e.clientY - r.top;
      const R = r.height * 0.22;
      slats.forEach((s, i) => {
        const d = (y - (i + 0.5) * (r.height / n)) / R;
        tilt[i](d * Math.exp(-d * d) * 70);
      });
      const ox = gsap.utils.clamp(20, 80, 50 + ((e.clientX - r.left) / r.width - 0.5) * 40);
      wrap.style.perspectiveOrigin = `${ox}% 50%`;
    };
    const reset = () => {
      tilt.forEach((f) => f(0));
      wrap.style.perspectiveOrigin = '';
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', reset);

    return {
      play() {
        active = true;
        tl.play();
      },
      pause() {
        active = false;
        tl.pause();
        reset();
      },
      destroy() {
        active = false;
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', reset);
        tl.kill();
        gsap.killTweensOf(slats);
        wrap.remove();
        title.classList.remove('is-slatted');
      },
    };
  }

  /* ---------- C: 끊기지 않는 한 줄 ---------- */

  function ribbon(opts) {
    const backCanvas = hero.querySelector('.hero-art--back canvas');
    const frontCanvas = hero.querySelector('.hero-art--front canvas');
    const pointer = trackPointer(hero);
    const N = opts.mobile ? 96 : 160;
    const LEVELS = 6;
    // [앞면, 뒷면] 각각 비스듬함(어두움) → 정면(밝음)
    const PALETTE = [ramp('#C98778', '#F5CDC2', LEVELS), ramp('#A9685B', '#DD9C8E', LEVELS)];
    const sx = new Float32Array(N + 1);
    const sy = new Float32Array(N + 1);
    const nx = new Float32Array(N + 1);
    const ny = new Float32Array(N + 1);
    const th = new Float32Array(N + 1);
    const hw = new Float32Array(N + 1);
    let loop = null;

    const back = setupCanvas(backCanvas, [], () => loop && loop.frame());
    const front = setupCanvas(frontCanvas, [], () => loop && loop.frame());

    function strand(ctx, offsetAt, color, alpha, width) {
      ctx.beginPath();
      for (let k = 0; k <= N; k++) {
        const off = offsetAt(k);
        const x = sx[k] + nx[k] * off;
        const y = sy[k] + ny[k] * off;
        if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function render(t) {
      const { w, h } = back.s;
      if (!w || !front.s.w) return;
      const bctx = back.s.ctx;
      const fctx = front.s.ctx;
      pointer.step();
      const pa = pointer.a;

      // 1) 척추 곡선: 두 개의 사인파 + 포인터 쪽으로 당김
      const cy = h * (opts.mobile ? 0.4 : 0.45);
      const amp1 = h * (opts.mobile ? 0.12 : 0.17);
      const amp2 = h * 0.05;
      const base = Math.max(16, Math.min(58, Math.min(w, h) * 0.06));
      const sig = w * (opts.mobile ? 0.32 : 0.17);
      for (let k = 0; k <= N; k++) {
        const s = k / N;
        const x = -0.08 * w + s * 1.16 * w;
        let y = cy + amp1 * Math.sin(s * 5.2 + t * 0.48) + amp2 * Math.sin(s * 12.4 - t * 0.9 + 1.3);
        const g = Math.exp(-((x - pointer.x) ** 2) / (sig * sig)) * pa;
        y += (pointer.y - y) * 0.6 * g;
        sx[k] = x;
        sy[k] = y;
        th[k] = s * 9.4 - t * 1.1 + g * 1.4; // 비틀림 각
        hw[k] = base * (0.7 + 0.3 * Math.sin(s * 4.1 + t * 0.66)) * (1 + 0.4 * g); // 반폭
      }
      for (let k = 0; k <= N; k++) {
        const a = Math.max(k - 1, 0);
        const b = Math.min(k + 1, N);
        const tx = sx[b] - sx[a];
        const ty = sy[b] - sy[a];
        const len = Math.hypot(tx, ty) || 1;
        nx[k] = -ty / len;
        ny[k] = tx / len;
      }

      bctx.clearRect(0, 0, w, h);
      fctx.clearRect(0, 0, w, h);
      bctx.lineJoin = 'round';

      // 2) 리본을 따라가는 가는 실 (뒤 레이어)
      for (let e = 0; e < 3; e++) {
        strand(bctx, (k) => (hw[k] * 1.55 + 10 + e * 13) * Math.sin(th[k] * 0.5 + e * 1.9 + t * 0.4),
          CORAL, 0.6 - e * 0.17, 1.6 - e * 0.4);
      }
      strand(bctx, (k) => -(hw[k] * 2.2 + 8) * Math.cos(th[k] * 0.45 - t * 0.25), INK, 0.22, 0.8);

      // 3) 비틀리는 리본: 조각마다 앞/뒷면과 명암 단계로 묶어서 채운다
      const paths = [0, 1].map(() => [0, 1].map(() => Array.from({ length: LEVELS }, () => new Path2D())));
      const silhouettes = [new Path2D(), new Path2D()];
      for (let k = 0; k < N; k++) {
        const c0 = Math.cos(th[k]);
        const c1 = Math.cos(th[k + 1]);
        const cm = (c0 + c1) / 2;
        const face = cm >= 0 ? 0 : 1;
        const level = Math.min(LEVELS - 1, Math.floor(Math.abs(cm) * LEVELS));
        const z = Math.sin((k / N) * 6.2 - t * 0.4 + 0.8);
        const layer = z > 0.45 ? 1 : 0; // 1이면 제목 앞을 지난다
        const o0 = hw[k] * c0;
        const o1 = hw[k + 1] * c1;
        const quad = (p) => {
          p.moveTo(sx[k] + nx[k] * o0, sy[k] + ny[k] * o0);
          p.lineTo(sx[k + 1] + nx[k + 1] * o1, sy[k + 1] + ny[k + 1] * o1);
          p.lineTo(sx[k + 1] - nx[k + 1] * o1, sy[k + 1] - ny[k + 1] * o1);
          p.lineTo(sx[k] - nx[k] * o0, sy[k] - ny[k] * o0);
          p.closePath();
        };
        quad(paths[layer][face][level]);
        quad(silhouettes[layer]);
      }

      [bctx, fctx].forEach((ctx, layer) => {
        if (!opts.mobile) {
          // 리본 아래 부드러운 그림자 한 번 (앞 레이어는 제목 위에 깊이감을 준다)
          ctx.save();
          ctx.shadowColor = layer ? 'rgba(36,36,36,0.24)' : 'rgba(36,36,36,0.12)';
          ctx.shadowBlur = layer ? 26 : 18;
          ctx.shadowOffsetY = layer ? 14 : 8;
          ctx.fillStyle = CORAL;
          ctx.fill(silhouettes[layer]);
          ctx.restore();
        }
        ctx.lineWidth = 0.75;
        for (let face = 0; face < 2; face++) {
          for (let lv = 0; lv < LEVELS; lv++) {
            ctx.fillStyle = ctx.strokeStyle = PALETTE[face][lv];
            ctx.fill(paths[layer][face][lv]);
            ctx.stroke(paths[layer][face][lv]);
          }
        }
      });
    }

    loop = createLoop(render, 3.2);
    loop.frame();

    return {
      play: loop.play,
      pause: loop.pause,
      destroy() {
        loop.pause();
        back.destroy();
        front.destroy();
        pointer.destroy();
      },
    };
  }

  const SCENES = { A: fabric, B: flipTitle, C: ribbon };

  /* ---------- 스크롤 연출 ---------- */

  function setupScrollMotion() {
    ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        state.heroVisible = self.isActive;
        sync();
      },
    });

    // hero 그래픽은 소개로 넘어가며 작아지고 흐려진다
    gsap.to('.hero-art', {
      scale: 0.84,
      yPercent: -8,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
    // 제목은 바깥 래퍼(.hero-copy)만 움직인다. B의 슬랫 변형과 겹치지 않는다.
    gsap.to('.hero-copy', {
      y: () => -hero.offsetHeight * 0.14,
      scale: variant === 'B' ? 0.9 : 1,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top+=8% top', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true },
    });

    gsap.utils.toArray('.rule').forEach((el) => {
      gsap.from(el, {
        scaleX: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 50%', scrub: 0.5 },
      });
    });

    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    gsap.from('.work li', {
      x: -24,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.work', start: 'top 88%', once: true },
    });

    gsap.from('.post-thumb', {
      clipPath: 'inset(0% 100% 0% 0%)',
      duration: 1.1,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: '.post-card', start: 'top 85%', once: true },
    });
    gsap.from('.post-thumb img', {
      scale: 1.18,
      duration: 1.4,
      ease: 'power3.out',
      clearProps: 'transform', // 끝나면 CSS hover 확대가 다시 동작하게
      scrollTrigger: { trigger: '.post-card', start: 'top 85%', once: true },
    });
  }

  /* ---------- 미디어 조건별 초기화 ---------- */

  // mm.add는 즉시 실행되어 renderControls를 부르므로 그보다 먼저 잡아 둔다.
  const toggle = document.querySelector('.proto-toggle');

  const mm = gsap.matchMedia();
  mm.add({
    always: '(min-width: 0px)',
    motion: '(prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 640px)',
  }, (ctx) => {
    const { motion, mobile } = ctx.conditions;
    state.motion = motion;
    state.heroVisible = true;
    const scene = SCENES[variant]({ motion, mobile });
    state.scene = scene;
    if (motion) setupScrollMotion();
    renderControls();
    sync();
    return () => {
      scene.destroy();
      state.scene = null;
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 프로토타입 비교 컨트롤 ---------- */

  document.querySelector('.proto-name').textContent = `${variant} · ${VARIANTS[variant]}`;
  document.querySelectorAll('.proto-variants [data-variant]').forEach((a) => {
    if (a.dataset.variant === variant) a.setAttribute('aria-current', 'page');
  });

  function renderControls() {
    toggle.disabled = !state.motion;
    if (!state.motion) toggle.innerHTML = '모션 꺼짐';
    else if (state.userPaused) toggle.innerHTML = '<span aria-hidden="true">▶</span> 재생';
    else toggle.innerHTML = '<span aria-hidden="true">❚❚</span> 일시정지';
  }

  toggle.addEventListener('click', () => {
    state.userPaused = !state.userPaused;
    renderControls();
    sync();
  });

  function goTo(key) {
    const url = new URL(location.href);
    url.searchParams.set('variant', key);
    url.hash = '';
    location.href = url.toString();
  }

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const target = e.target;
    if (target instanceof Element &&
        (target.isContentEditable || target.closest('input, textarea, select, [contenteditable]'))) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    const i = KEYS.indexOf(variant);
    goTo(KEYS[(i + (e.key === 'ArrowRight' ? 1 : KEYS.length - 1)) % KEYS.length]);
  });

  /* ---------- 글 발췌 패널 ---------- */

  const dialog = document.getElementById('post-excerpt');
  document.querySelectorAll('[data-excerpt]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (typeof dialog.showModal !== 'function') return;
      e.preventDefault();
      dialog.showModal();
    });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // 바깥(backdrop) 클릭
  });
})();
