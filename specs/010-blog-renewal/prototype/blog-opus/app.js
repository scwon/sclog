// Prototype scripts.
// The IDE pages (index.html, article.html) keep one window shell and use a small client router that
// swaps only the page regions, printing an open log as each file unfolds. Comparison pages
// (cards, finder, article-classic) mount the same page modules without the shell.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const NUMBERED = '.doc :is(.fm-line, .doc-title, .doc-byline, .prose > *)';

/* ---------- page modules: mounted per page, removed on navigation ---------- */

// Reading state: current chapter and section, progress, and every view that shows them.
function mountReading(signal) {
  const prose = $('.prose');
  if (!prose) return;
  const root = document.documentElement;
  const headings = $$('h2[id], h3[id]', prose);
  const tocLinks = $$('.toc-list a');
  const barNo = $('.chapter-current-no');
  const barText = $('.chapter-current-text');
  const barStart = barText?.textContent;
  const symbols = $$('[data-symbol]');
  const symbolStart = new Map(symbols.map(element => [element, element.textContent]));
  const percents = $$('[data-percent]');
  const lineLabel = $('[data-ln]');
  const blocks = $$(NUMBERED);

  const chapterOf = new Map();
  let lastChapter = null;
  headings.forEach(heading => {
    if (heading.tagName === 'H2') lastChapter = heading;
    chapterOf.set(heading, lastChapter);
  });
  const linkFor = heading => tocLinks.find(link => decodeURIComponent(link.hash.slice(1)) === heading.id);

  let currentBlock = null;
  let frame = 0;

  function update() {
    frame = 0;
    const top = prose.getBoundingClientRect().top + window.scrollY;
    const span = Math.max(1, prose.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - top) / span));
    root.style.setProperty('--progress', progress.toFixed(4));

    // A heading becomes current once it reaches the band just below the sticky offset.
    const line = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 100;
    const current = headings.filter(heading => heading.getBoundingClientRect().top <= line).at(-1);
    const chapter = current ? chapterOf.get(current) : null;
    tocLinks.forEach(link => {
      const id = decodeURIComponent(link.hash.slice(1));
      if (current && id === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      link.classList.toggle('in-chapter', Boolean(chapter) && id === chapter.id);
    });

    const chapterLink = chapter && linkFor(chapter);
    const chapterText = chapterLink ? chapterLink.querySelector('.toc-text').textContent : '';
    if (barText) {
      barNo.textContent = chapterLink ? chapterLink.dataset.no : '';
      barText.textContent = chapterLink ? chapterText : barStart;
    }
    // Like an editor breadcrumb: the chapter, then the section inside it.
    const section = current && current !== chapter ? ` › ${current.textContent}` : '';
    symbols.forEach(element => {
      element.textContent = chapterLink
        ? `${element.dataset.symbol === 'crumb' ? '› ' : ''}${chapterLink.dataset.no} ${chapterText}${section}`
        : symbolStart.get(element);
    });
    percents.forEach(element => { element.textContent = `${Math.round(progress * 100)}%`; });

    // The editor's current line: the last numbered block that has reached the reading band.
    if (blocks.length) {
      const index = Math.max(0, blocks.findLastIndex(block => block.getBoundingClientRect().top <= line));
      if (blocks[index] !== currentBlock) {
        currentBlock?.classList.remove('is-current');
        currentBlock = blocks[index];
        currentBlock.classList.add('is-current');
      }
      if (lineLabel) lineLabel.textContent = `Ln ${index + 1}`;
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { signal });
  window.addEventListener('load', update, { signal });
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    root.style.removeProperty('--progress');
  });
  update();
  mountChapterPanel(signal);
  mountMinimap(signal);
}

// Classic article only: the compact chapter panel on narrow screens.
function mountChapterPanel(signal) {
  const toggle = $('.chapter-toggle');
  const panel = $('#chapter-panel');
  if (!toggle || !panel) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  setOpen(false);
  toggle.addEventListener('click', () => setOpen(panel.hidden), { signal });
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  }, { signal });
  document.addEventListener('click', event => {
    if (!panel.hidden && !event.target.closest('.chapter-bar')) setOpen(false);
  }, { signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  }, { signal });
}

// Minimap: one thin bar per text line of each block, headings and images in coral.
function mountMinimap(signal) {
  const map = $('.minimap');
  const doc = $('.doc');
  if (!map || map.hidden || !doc) return;
  const bars = $('.mm-bars', map);
  const view = $('.mm-view', map);
  let scale = 1;
  let docTop = 0;

  function sync() {
    view.style.top = `${(window.scrollY - docTop) * scale}px`;
    view.style.height = `${window.innerHeight * scale}px`;
  }

  function layout() {
    if (!map.offsetHeight) return;
    docTop = doc.getBoundingClientRect().top + window.scrollY;
    scale = map.clientHeight / doc.offsetHeight;
    const parts = [];
    $$('.frontmatter, .doc-title, .doc-byline, .doc-hero, .prose > *', doc).forEach(block => {
      const top = block.getBoundingClientRect().top + window.scrollY - docTop;
      if (block.matches('h2, h3, h4, .doc-title')) {
        parts.push(`<span class="mm-bar is-heading" style="top:${top * scale}px;width:${block.matches('h2, .doc-title') ? 40 : 28}px"></span>`);
      } else if (block.matches('.doc-hero, .figure')) {
        parts.push(`<span class="mm-bar is-figure" style="top:${top * scale}px;height:${Math.max(4, block.offsetHeight * scale)}px;width:46px"></span>`);
      } else {
        const lines = Math.max(1, Math.round(block.offsetHeight / 32));
        const length = block.textContent.length;
        for (let i = 0; i < lines; i += 1) {
          const width = i === lines - 1 && lines > 1 ? 12 + (length * 7) % 30 : 44 + (length + i * 13) % 9;
          parts.push(`<span class="mm-bar" style="top:${(top + i * 32) * scale}px;width:${width}px"></span>`);
        }
      }
    });
    bars.innerHTML = parts.join('');
    sync();
  }

  map.addEventListener('click', event => {
    const y = event.clientY - map.getBoundingClientRect().top;
    window.scrollTo({ top: docTop + y / scale - window.innerHeight / 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }, { signal });
  window.addEventListener('scroll', sync, { passive: true, signal });
  window.addEventListener('resize', layout, { signal });
  document.fonts.ready.then(() => { if (!signal.aborted) layout(); });
  layout();
}

// Home flow: fold a post's chapter flow, move between nodes with arrow keys, track the line.
function mountFlow(signal) {
  const flow = $('.flow');
  if (!flow) return;
  const lineLabel = $('[data-ln]');
  const steps = { ArrowDown: 1, j: 1, ArrowUp: -1, k: -1 };

  function setFold(postId, open) {
    flow.querySelectorAll(`[data-group="${postId}"]`).forEach(line => { line.hidden = !open; });
    flow.querySelector(`[data-group-folded="${postId}"]`).hidden = open;
    flow.querySelector(`#${CSS.escape(postId)} .fold`).setAttribute('aria-expanded', String(open));
  }

  flow.addEventListener('click', event => {
    const fold = event.target.closest('.fold');
    if (fold) setFold(fold.closest('.line').id, fold.getAttribute('aria-expanded') !== 'true');
    const unfold = event.target.closest('[data-unfold-post]');
    if (unfold) {
      setFold(unfold.dataset.unfoldPost, true);
      flow.querySelector(`#${CSS.escape(unfold.dataset.unfoldPost)} .flow-link`).focus();
    }
  }, { signal });

  flow.addEventListener('focusin', event => {
    const line = event.target.closest('.line');
    if (line && lineLabel && line.dataset.line) lineLabel.textContent = `Ln ${line.dataset.line}`;
  }, { signal });

  flow.addEventListener('keydown', event => {
    const { key } = event;
    if (!(key in steps)) return;
    const stops = $$('a', flow).filter(link => !link.closest('.line[hidden]'));
    const index = stops.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    stops[Math.max(0, Math.min(stops.length - 1, index + steps[key]))].focus();
  }, { signal });
}

// Comparison page finder.html: hover or focus selects a file, arrow keys move.
function mountFinder(signal) {
  const finder = $('.finder');
  if (!finder) return;
  const files = $$('.file', finder);
  const previews = $$('.preview', finder);
  const statusFile = $('.status-file', finder);
  const statusPos = $('.status-pos', finder);
  const steps = { ArrowDown: 1, j: 1, ArrowUp: -1, k: -1 };

  function select(file) {
    files.forEach(item => item.classList.toggle('is-selected', item === file));
    previews.forEach(preview => { preview.hidden = preview.id !== file.dataset.post; });
    statusFile.textContent = file.dataset.stat;
    statusPos.textContent = `${files.indexOf(file) + 1}/${files.length}`;
  }

  files.forEach(file => {
    file.addEventListener('mouseenter', () => select(file), { signal });
    file.addEventListener('focus', () => select(file), { signal });
  });
  $('.finder-files', finder).addEventListener('keydown', event => {
    const index = files.indexOf(document.activeElement);
    if (index < 0) return;
    const { key } = event;
    let next;
    if (key in steps) next = index + steps[key];
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = files.length - 1;
    else return;
    event.preventDefault();
    files[Math.max(0, Math.min(files.length - 1, next))].focus();
  }, { signal });
  // The preview repeats the selected row, so a click on it opens that same post.
  $('.finder-preview', finder).addEventListener('click', event => {
    const preview = event.target.closest('.preview');
    if (preview) window.location.href = preview.dataset.href;
  }, { signal });
}

function mountPage() {
  const controller = new AbortController();
  mountReading(controller.signal);
  mountFlow(controller.signal);
  mountFinder(controller.signal);
  return () => controller.abort();
}

/* ---------- IDE shell: mounted once, survives navigation ---------- */

function initShell() {
  const app = document.body;
  const root = document.documentElement;
  const wide = window.matchMedia('(min-width: 1100px)');
  const sidebar = $('#sidebar');
  const scrim = $('.scrim');
  const explorerButton = $('.ab-explorer');
  const menuButton = $('.tb-menu');
  const panel = $('#output-panel');
  const panelLog = $('.panel-log', panel);
  const outputButton = $('.sb-output');
  const routeStatus = $('#route-status');
  const pageMeta = () => JSON.parse($('#page-meta').textContent);
  const normalize = path => path.replace(/index\.html$/, '');
  const scope = normalize(new URL('./', window.location.href).pathname);
  const currentHref = () => (normalize(window.location.pathname) === scope ? './' : window.location.pathname.slice(scope.length));
  history.scrollRestoration = 'manual';

  // Explorer: docked on wide screens, an overlay below 1100px, a drawer on phones.
  const sideOpen = () => (wide.matches ? app.dataset.side !== 'closed' : app.dataset.side === 'open');
  function syncSide() {
    const open = sideOpen();
    explorerButton.setAttribute('aria-pressed', String(open));
    menuButton.setAttribute('aria-expanded', String(open));
    $$('.crumb-outline').forEach(button => button.setAttribute('aria-expanded', String(open)));
    scrim.hidden = !(open && !wide.matches);
  }
  function setSide(open) {
    if (wide.matches ? open : !open) delete app.dataset.side;
    else app.dataset.side = wide.matches ? 'closed' : 'open';
    syncSide();
  }
  explorerButton.addEventListener('click', () => setSide(!sideOpen()));
  menuButton.addEventListener('click', () => setSide(!sideOpen()));
  scrim.addEventListener('click', () => setSide(false));
  sidebar.addEventListener('click', event => {
    if (!wide.matches && event.target.closest('a')) setSide(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.crumb-outline')) return;
    setSide(true);
    $('.side-outline', sidebar)?.scrollIntoView({ block: 'start' });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || wide.matches || !sideOpen()) return;
    setSide(false);
    (explorerButton.offsetParent ? explorerButton : menuButton).focus();
  });
  wide.addEventListener('change', () => {
    delete app.dataset.side;
    syncSide();
  });
  syncSide();

  // Theme: dark by default, ivory light on request, remembered per browser.
  const themeButton = $('.tb-theme');
  const themeColor = $('meta[name="theme-color"]');
  function syncTheme() {
    const light = root.dataset.theme === 'light';
    themeButton.setAttribute('aria-label', light ? '어두운 테마로 전환' : '밝은 테마로 전환');
    themeColor.content = light ? '#EEE9E3' : '#1A1817';
  }
  themeButton.addEventListener('click', () => {
    // Swap every color at once instead of letting hover transitions fade through the old theme.
    root.classList.add('theme-switching');
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
    try { localStorage.setItem('sclog-theme', root.dataset.theme); } catch { /* storage unavailable */ }
    syncTheme();
  });
  syncTheme();

  // Output panel: the open log of every file opened in this session.
  function setPanel(open) {
    panel.hidden = !open;
    outputButton.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-entering', open);
  }
  outputButton.addEventListener('click', () => setPanel(panel.hidden));
  $('.panel-close', panel).addEventListener('click', () => setPanel(false));
  const stamp = entry => { $('.log-time', entry).textContent = new Date().toTimeString().slice(0, 8); };
  stamp($('.log-entry', panelLog));

  function printEntry({ log }) {
    const entry = document.createElement('li');
    entry.className = 'log-entry is-printing';
    const command = document.createElement('p');
    command.className = 'log-cmd';
    command.style.setProperty('--i', 0);
    command.innerHTML = '<span class="log-time"></span><span class="log-caret" aria-hidden="true">❯</span>';
    command.append(log.command);
    const rows = document.createElement('dl');
    rows.className = 'log-rows';
    log.rows.forEach(([label, value], index) => {
      const row = document.createElement('div');
      row.style.setProperty('--i', index + 1);
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      detail.textContent = value;
      row.append(term, detail);
      rows.append(row);
    });
    entry.append(command, rows);
    panelLog.append(entry);
    stamp(entry);
    panelLog.scrollTop = panelLog.scrollHeight;
    return log.rows.length + 1;
  }

  // Tabs: posts.log is pinned; opened files stay as tabs for the session and can be closed.
  const TABS = 'sclog-open-tabs';
  const readTabs = () => { try { return JSON.parse(sessionStorage.getItem(TABS)) || []; } catch { return []; } };
  const writeTabs = list => { try { sessionStorage.setItem(TABS, JSON.stringify(list)); } catch { /* storage unavailable */ } };
  const tabs = $('.tabs');

  function tabItem({ href, file, glyph }, active, closable, opening) {
    const item = document.createElement('div');
    item.className = `tab-item${active ? ' is-active' : ''}${opening ? ' is-opening' : ''}`;
    item.dataset.href = href;
    const link = document.createElement('a');
    link.className = 'tab';
    link.href = href;
    if (active) link.setAttribute('aria-current', 'page');
    link.innerHTML = `<span class="${glyph}" aria-hidden="true"></span>`;
    link.append(file);
    item.append(link);
    if (closable) {
      const close = document.createElement('button');
      close.className = 'tab-close';
      close.type = 'button';
      close.setAttribute('aria-label', `${file} 닫기`);
      close.textContent = '×';
      item.append(close);
    }
    return item;
  }

  function renderTabs(animate = false) {
    const meta = pageMeta();
    const here = currentHref();
    const shown = $$('.tab-item', tabs).map(item => item.dataset.href);
    const list = readTabs().filter(tab => tab.href !== './');
    if (meta.kind === 'article' && !list.some(tab => tab.href === here)) list.push({ href: here, file: meta.file, glyph: 'file-dot' });
    writeTabs(list);
    tabs.replaceChildren(
      tabItem({ href: './', file: 'posts.log', glyph: 'log-glyph' }, here === './', false, false),
      ...list.map(tab => tabItem(tab, tab.href === here, true, animate && !shown.includes(tab.href))),
    );
  }

  tabs.addEventListener('click', event => {
    const close = event.target.closest('.tab-close');
    if (!close) return;
    const href = close.closest('.tab-item').dataset.href;
    writeTabs(readTabs().filter(tab => tab.href !== href));
    if (href === currentHref()) navigate(new URL('./', window.location.href), true);
    else renderTabs();
  });

  // Opening a file: print its log, then let the first screens of content unfold from the top.
  // The open log stays in the output panel; the status bar only flashes a one-line summary.
  const statusbar = $('.statusbar');
  const statusLog = $('.sb-log', statusbar);
  let statusTimers = [];
  function flashStatus({ log }) {
    statusTimers.forEach(clearTimeout);
    const done = log.rows.at(-1)[1];
    statusLog.textContent = `❯ ${log.command}`;
    statusbar.classList.add('is-logging');
    statusTimers = [
      setTimeout(() => { statusLog.textContent = `✓ 열림 · ${done}`; }, reduceMotion.matches ? 0 : 450),
      setTimeout(() => statusbar.classList.remove('is-logging'), 2200),
    ];
  }

  function openFile(meta) {
    printEntry(meta);
    flashStatus(meta);
    if (reduceMotion.matches) return;
    const body = $('.editor-body');
    const selector = body.classList.contains('home-body')
      ? '.flow > .line:not([hidden])'
      : '.frontmatter .fm-line, .doc-head > *, .doc-hero, .prose > *';
    const targets = $$(selector, body).filter(element => element.getBoundingClientRect().top < window.innerHeight * 1.4);
    targets.forEach((element, index) => {
      element.dataset.unfold = '';
      element.style.setProperty('--i', index);
    });
    body.classList.add('is-unfolding');
    const duration = targets.length * 34 + 420;
    setTimeout(() => {
      body.classList.remove('is-unfolding');
      targets.forEach(element => {
        delete element.dataset.unfold;
        element.style.removeProperty('--i');
      });
    }, duration + 60);
  }

  // Router: every route is a complete server-rendered page; navigation swaps only the page regions.
  const cache = new Map();
  let currentPath = normalize(window.location.pathname);
  let unmount = mountPage();

  function swap(next) {
    document.title = next.title;
    app.dataset.page = next.body.dataset.page;
    $('meta[name="description"]').content = $('meta[name="description"]', next).content;
    ['.tb-title', '.crumbs-bar', '.side-page', '.sb-page'].forEach(selector => {
      $(selector).innerHTML = $(selector, next).innerHTML;
    });
    $('.editor-body').replaceWith(document.adoptNode($('.editor-body', next)));
    $('.minimap').hidden = $('.minimap', next).hidden;
    $('.mm-bars').replaceChildren();
    $('#page-meta').textContent = $('#page-meta', next).textContent;
    $$('.tree-file', sidebar).forEach(link => {
      link.classList.toggle('is-active', normalize(new URL(link.href).pathname) === currentPath);
    });
  }

  async function navigate(url, push) {
    const key = normalize(url.pathname);
    let html = cache.get(key);
    try {
      if (!html) {
        const response = await fetch(url.pathname);
        if (!response.ok) throw new Error(String(response.status));
        html = await response.text();
        cache.set(key, html);
      }
    } catch {
      window.location.href = url.href;
      return;
    }
    const next = new DOMParser().parseFromString(html, 'text/html');
    if (!next.body.classList.contains('ide-app')) {
      window.location.href = url.href;
      return;
    }
    if (push) history.pushState(null, '', url.href);
    currentPath = key;
    unmount();
    swap(next);
    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    renderTabs(true);
    syncSide();
    unmount = mountPage();
    const meta = pageMeta();
    openFile(meta);
    $('#editor').focus({ preventScroll: true });
    routeStatus.textContent = `${meta.file} 열림`;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || !normalize(url.pathname).startsWith(scope) || !/(\/|\.html)$/.test(url.pathname)) return;
    if (normalize(url.pathname) === currentPath) {
      // Same file: hash links scroll natively; a bare link to the open file only returns to the top.
      if (!url.hash) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      return;
    }
    event.preventDefault();
    navigate(url, true);
  });

  window.addEventListener('popstate', () => {
    if (normalize(window.location.pathname) !== currentPath) navigate(new URL(window.location.href), false);
  });

  renderTabs();
}

if (document.body.classList.contains('ide-app')) initShell();
else mountPage();
