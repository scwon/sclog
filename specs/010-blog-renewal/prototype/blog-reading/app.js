const prose = document.querySelector('.prose');
if (prose) {
  const progress = document.querySelector('.reading-progress');
  const headings = [...prose.querySelectorAll('h2')];
  const links = [...document.querySelectorAll('.toc a')];
  let scheduled = false;
  function updateReading() {
    const start = prose.getBoundingClientRect().top + window.scrollY;
    const end = prose.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    const amount = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
    progress.style.transform = `scaleX(${amount})`;
    const current = headings.filter(h => h.getBoundingClientRect().top < 160).at(-1);
    links.forEach(link => {
      if (current && decodeURIComponent(link.hash.slice(1)) === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateReading);
    }
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', updateReading);
  document.querySelectorAll('.mobile-toc a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.mobile-toc').open = false;
  }));
  updateReading();
}
