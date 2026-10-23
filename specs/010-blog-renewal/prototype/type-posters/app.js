const NAMES = { A: '교차', B: '속공간', C: '겹인쇄', D: '타일', E: '한 줄' };
const KEYS = Object.keys(NAMES);

const posters = document.querySelectorAll('.poster');
const links = document.querySelectorAll('.pick a');
const nowKey = document.getElementById('now-key');
const nowName = document.getElementById('now-name');

function current() {
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'all') return 'all';
  const v = (params.get('variant') || 'A').toUpperCase();
  return KEYS.includes(v) ? v : 'A';
}

function render() {
  const v = current();
  document.body.classList.toggle('all', v === 'all');
  posters.forEach((p) => { p.hidden = v !== 'all' && p.dataset.variant !== v; });
  links.forEach((a) => {
    if (a.dataset.v === v) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  nowKey.textContent = v === 'all' ? 'A–E' : v;
  nowName.textContent = v === 'all' ? '전체 보기' : NAMES[v];
}

function go(v) {
  if (v === current()) return;
  history.pushState(null, '', v === 'all' ? '?view=all' : `?variant=${v}`);
  render();
}

function step(delta) {
  const v = current();
  const i = v === 'all' ? -1 : KEYS.indexOf(v);
  go(KEYS[(i + delta + KEYS.length) % KEYS.length]);
}

links.forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  go(a.dataset.v);
}));

document.querySelectorAll('.step').forEach((b) => {
  b.addEventListener('click', () => step(Number(b.dataset.step)));
});

document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

window.addEventListener('popstate', render);
render();
