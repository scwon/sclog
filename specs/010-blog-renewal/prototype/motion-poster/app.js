(() => {
  'use strict';

  // ---------- DOM 참조 & 상태: setup 이전에 전부 선언 (TDZ 방지) ----------
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('[data-stage]');
  const paper = document.querySelector('.paper');
  const blob = document.querySelector('[data-blob]');
  const seed = document.querySelector('[data-seed]');
  const cut = document.querySelector('[data-cut]');
  const layerDark = document.querySelector('.layer-dark');
  const giantLight = document.querySelector('.giant-light');
  const giantDark = document.querySelector('.giant-dark');
  const giantCoral = document.querySelector('.giant-coral');
  const lightLetters = Array.from(giantLight.children);
  const darkLetters = Array.from(giantDark.children);
  const coralLetters = Array.from(giantCoral.children);
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const toggleBtn = document.querySelector('[data-toggle]');
  const restartBtn = document.querySelector('[data-restart]');
  const ctrlLabel = document.querySelector('[data-ctrl-label]');
  const dialog = document.querySelector('[data-dialog]');
  const openBtn = document.querySelector('[data-open]');
  const closeBtn = document.querySelector('[data-close]');

  const state = {
    tl: null,
    motion: false,
    userPaused: false,
    inView: true,
    tabVisible: !document.hidden,
  };
  const px = { tx: 0, ty: 0, x: 0, y: 0, items: [] };

  // ---------- 형태 정의 (결정적, 랜덤 없음) ----------
  // 같은 노드 수의 닫힌 곡선을 만든다 → path d 를 숫자 보간으로 morph.
  const R_BLOB = [1, 0.78, 1.06, 0.7, 0.98, 1.12, 0.66, 0.94, 0.86];
  const R_BLOB_B = [0.88, 1.04, 0.76, 1.0, 0.82, 1.1, 0.9, 0.72, 1.02];
  const R_BLOB_C = [1.1, 0.74, 0.96, 1.06, 0.7, 0.9, 1.08, 0.8, 0.94];
  const R_SEED = [1, 0.7, 1.1, 0.8, 1.05, 0.62, 0.95];
  const R_CUT = [1, 0.72, 1.08, 0.86, 0.64, 1.04, 0.9, 0.7, 1.12, 0.8];

  const BLOB = {
    rest: blobPath(690, 430, 360, 470, R_BLOB, -0.35, 0.8),
    lean: blobPath(640, 480, 410, 430, R_BLOB_B, 0.15, 0.8),
    shift: blobPath(300, 380, 330, 420, R_BLOB_C, 0.55, 0.8),
  };
  const SEED = {
    rest: blobPath(880, 210, 80, 110, R_SEED, 0.3, 0.55),
    lean: blobPath(800, 170, 130, 80, R_SEED, 1.1, 0.55),
    shift: blobPath(150, 260, 90, 120, R_SEED, -0.4, 0.55),
  };
  const CUT = {
    in: blobPath(-60, 1060, 30, 30, R_CUT, 0, 0.5),
    open: blobPath(300, 720, 420, 420, R_CUT, 0.2, 0.5),
    wide: blobPath(520, 520, 760, 720, R_CUT, 0.6, 0.5),
    tight: blobPath(660, 400, 420, 500, R_CUT, 1.0, 0.5),
    out: blobPath(1060, -60, 30, 30, R_CUT, 1.4, 0.5),
  };
  const MASK = {
    closed: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    wedge: 'polygon(0% 0%, 58% 0%, 38% 100%, 0% 100%)',
    full: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    slant: 'polygon(64% 0%, 100% 0%, 100% 100%, 86% 100%)',
    gone: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
  };

  function blobPath(cx, cy, rx, ry, radii, rot, tension) {
    const n = radii.length;
    const pts = radii.map((r, i) => {
      const a = rot + (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
    });
    const k = tension / 6;
    const f = (v) => v.toFixed(1);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) * k;
      const c1y = p1[1] + (p2[1] - p0[1]) * k;
      const c2x = p2[0] - (p3[0] - p1[0]) * k;
      const c2y = p2[1] - (p3[1] - p1[1]) * k;
      d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return `${d} Z`;
  }

  // ---------- 재생 상태 ----------
  function shouldPlay() {
    return state.motion && !state.userPaused && state.inView && state.tabVisible;
  }

  function sync() {
    if (state.tl) {
      if (shouldPlay()) state.tl.play();
      else state.tl.pause();
    }
    updateControls();
  }

  function updateControls() {
    toggleBtn.disabled = !state.motion;
    restartBtn.disabled = !state.motion;
    toggleBtn.textContent = state.userPaused ? '재생' : '일시정지';
    toggleBtn.setAttribute('aria-pressed', String(state.userPaused));
    ctrlLabel.textContent = state.motion ? '모션 시안' : '모션 시안 · 정적';
  }

  // ---------- 12초 시퀀스 ----------
  function buildTimeline() {
    gsap.set(blob, { attr: { d: BLOB.rest } });
    gsap.set(seed, { attr: { d: SEED.rest } });
    gsap.set(cut, { attr: { d: CUT.in } });
    gsap.set(layerDark, { clipPath: MASK.closed });
    gsap.set(lightLetters, { yPercent: 0 });
    gsap.set(darkLetters, { yPercent: 108 });
    gsap.set(coralLetters, { xPercent: (i) => (i % 2 ? 40 : -40) });

    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'expo.inOut' } });

    // 전환 사이에도 움직임을 이어가고, 12초 끝에는 시작 위치로 돌아온다.
    // 포인터 parallax의 x/y와 겹치지 않는 속성을 사용한다.
    tl.fromTo([giantLight, giantDark, giantCoral], { xPercent: 0 }, {
      xPercent: (i) => [-3, 2, -2][i],
      duration: 6, repeat: 1, yoyo: true, ease: 'sine.inOut',
    }, 0).fromTo(paper, { rotation: -2 }, {
      rotation: 2,
      duration: 6, repeat: 1, yoyo: true, ease: 'sine.inOut',
    }, 0);

    // 1. 타이틀은 고정, 코랄 컷아웃이 기울며 변형된다
    tl.to(blob, { attr: { d: BLOB.lean }, duration: 1.1, ease: 'power3.inOut' }, 0.5)
      .to(seed, { attr: { d: SEED.lean }, duration: 1.0, ease: 'back.out(1.6)' }, 0.65)
      .to(lightLetters, { yPercent: (i) => (i ? 9 : -7), duration: 1.0, stagger: 0.08, ease: 'power3.inOut' }, 0.6)

    // 2. 차콜 마스크가 사선으로 열리고, 띠 안에서 WON 이 올라온다 → 전면 차콜
      .to(layerDark, { clipPath: MASK.wedge, duration: 1.1 }, 2.4)
      .to(darkLetters, { yPercent: 0, duration: 0.9, stagger: 0.09, ease: 'expo.out' }, 2.6)
      .to(layerDark, { clipPath: MASK.full, duration: 0.8 }, 4.2)

    // 3. 코랄 종이가 아래에서 찢겨 들어와 확장/수축, 글자들은 엇갈려 이동
      .to(cut, { attr: { d: CUT.open }, duration: 1.2, ease: 'expo.out' }, 5.0)
      .to(coralLetters, { xPercent: 0, duration: 1.0, stagger: 0.07, ease: 'expo.out' }, 5.2)
      .set(blob, { attr: { d: BLOB.shift } }, 5.6) // 차콜 아래에서 몰래 재배치
      .set(seed, { attr: { d: SEED.shift } }, 5.6)
      .to(darkLetters, { yPercent: (i) => [-10, 12, -16][i], duration: 0.9, stagger: 0.06, ease: 'power3.inOut' }, 5.6)
      .to(cut, { attr: { d: CUT.wide }, duration: 1.0, ease: 'power4.inOut' }, 6.6)
      .to(coralLetters, { xPercent: (i) => (i % 2 ? -12 : 10), duration: 1.0, stagger: 0.05, ease: 'power3.inOut' }, 6.7)
      .to(cut, { attr: { d: CUT.tight }, duration: 0.8, ease: 'power3.inOut' }, 7.9)
      .to(darkLetters, { yPercent: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' }, 7.9)

    // 4. 같은 방향으로 빠져나가며 처음 구도로 (역재생 아님)
      .to(layerDark, { clipPath: MASK.slant, duration: 0.55, ease: 'power3.in' }, 8.6)
      .to(layerDark, { clipPath: MASK.gone, duration: 0.45, ease: 'power3.out' }, 9.15)
      .to(cut, { attr: { d: CUT.out }, duration: 0.9, ease: 'expo.in' }, 9.6)
      .to(blob, { attr: { d: BLOB.rest }, duration: 1.2 }, 10.1)
      .to(seed, { attr: { d: SEED.rest }, duration: 1.0, ease: 'power3.inOut' }, 10.3)
      .to(lightLetters, { yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power3.inOut' }, 10.3);

    return tl;
  }

  function setStatic() {
    gsap.set(blob, { attr: { d: BLOB.lean } });
    gsap.set(seed, { attr: { d: SEED.lean } });
    gsap.set(cut, { attr: { d: CUT.tight } });
    gsap.set(layerDark, { clipPath: MASK.wedge });
    gsap.set(darkLetters, { yPercent: 0 });
    gsap.set(coralLetters, { xPercent: 0 });
  }

  // ---------- 포인터 parallax (재생 중일 때만 따라감) ----------
  function setupParallax() {
    px.items = [[paper, 10], [giantLight, -16], [giantDark, 20], [giantCoral, -24]].map(([el, depth]) => ({
      depth,
      setX: gsap.quickSetter(el, 'x', 'px'),
      setY: gsap.quickSetter(el, 'y', 'px'),
    }));
    window.addEventListener('pointermove', onPointer, { passive: true });
    gsap.ticker.add(parallaxTick);
  }

  function teardownParallax() {
    window.removeEventListener('pointermove', onPointer);
    gsap.ticker.remove(parallaxTick);
    px.tx = px.ty = px.x = px.y = 0;
    px.items = [];
  }

  function onPointer(e) {
    if (!shouldPlay() || e.pointerType === 'touch') return;
    px.tx = e.clientX / window.innerWidth - 0.5;
    px.ty = e.clientY / window.innerHeight - 0.5;
  }

  function parallaxTick() {
    if (!shouldPlay()) return;
    px.x += (px.tx - px.x) * 0.06;
    px.y += (px.ty - px.y) * 0.06;
    px.items.forEach((item) => {
      item.setX(px.x * item.depth);
      item.setY(px.y * item.depth);
    });
  }

  // ---------- 스크롤: hero 장면이 물러나고 경력/글 등장 ----------
  function setupScroll() {
    gsap.to(stage, {
      scale: 0.88,
      yPercent: 6,
      borderRadius: 28,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 },
    });
    reveals.forEach((el) => {
      gsap.from(el, {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  // ---------- 이벤트 ----------
  toggleBtn.addEventListener('click', () => {
    if (!state.motion) return;
    state.userPaused = !state.userPaused;
    sync();
  });

  restartBtn.addEventListener('click', () => {
    if (!state.tl) return;
    state.userPaused = false;
    state.tl.pause(0);
    sync();
  });

  openBtn.addEventListener('click', () => dialog.showModal());
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => openBtn.focus());

  document.addEventListener('visibilitychange', () => {
    state.tabVisible = !document.hidden;
    sync();
  });

  new IntersectionObserver(([entry]) => {
    state.inView = entry.isIntersecting;
    sync();
  }, { threshold: 0.02 }).observe(hero);

  // ---------- setup (모든 선언 이후) ----------
  if (!window.gsap) {
    updateControls();
    return;
  }
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add(
    { motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' },
    (ctx) => {
      if (ctx.conditions.motion) {
        state.motion = true;
        state.tl = buildTimeline();
        if (window.ScrollTrigger) setupScroll();
        setupParallax();
      } else {
        state.motion = false;
        setStatic();
      }
      sync();

      return () => {
        if (state.tl) state.tl.kill();
        state.tl = null;
        state.motion = false;
        teardownParallax();
        updateControls();
      };
    }
  );
})();
