"""Build the isolated reading prototype from the existing, unchanged article.

Run: uv run --with markdown python specs/010-blog-renewal/prototype/blog-reading/build.py
"""
from pathlib import Path
import re
import shutil

import markdown

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SLUG = "pro-developer-2023-days"
source = (ROOT / f"src/content/blog/{SLUG}.mdx").read_text()
body = source.split("---", 2)[2].strip()
body = re.sub(r"^(#{1,5}) ", r"\1# ", body, flags=re.MULTILINE)
body = body.replace(f"/images/blog/{SLUG}/", "assets/")
md = markdown.Markdown(extensions=["toc", "fenced_code", "tables"], extension_configs={"toc": {"toc_depth": "2-2"}})
content = md.convert(body)
(HERE / "assets").mkdir(exist_ok=True)
for name in ("hero.png", "rpg-maker.png"):
    shutil.copyfile(ROOT / f"public/images/blog/{SLUG}/{name}", HERE / "assets" / name)

arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>'
footer = '''<footer class="site-footer shell"><a class="author" href="./"><span class="author-mark" aria-hidden="true">w.</span>원성철</a><div class="footer-links"><a href="https://github.com/scwon">GitHub ↗</a><a href="https://github.com/scwon/sclog">소스 ↗</a></div></footer>'''

def page(title, main, kind):
    return f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#FAF8F5"><title>{title}</title><link rel="stylesheet" href="styles.css"><script src="app.js" defer></script></head>
<body class="{kind}"><a class="skip-link" href="#main">본문으로 건너뛰기</a>{main}{footer}</body></html>'''

home = f'''
<header class="home-header shell">
  <div class="topline"><span>원성철</span><a href="https://github.com/scwon" aria-label="원성철 GitHub">GitHub ↗</a></div>
  <h1 class="masthead"><a href="./">scwon’s <span>blog<span class="title-dot">.</span></span></a></h1>
  <p class="home-intro">개발하며 배우고, 일하며 생각한 것들.</p>
</header>
<main class="shell home-main" id="main">
  <div class="list-heading"><h2>모든 글 <span>01</span></h2><span class="list-caption">글에 담긴 생각과 경험</span></div>
  <a class="post-card" href="article.html" aria-labelledby="post-title">
    <div class="post-art"><span class="art-caption" aria-hidden="true">A DEVELOPER’S JOURNEY</span><img src="assets/hero.png" width="357" height="229" alt="2017년 10월 16일부터 2023년 4월 30일까지, 2023일을 계산한 콘솔"><span class="art-bottom" aria-hidden="true">2017 — 2023<span>↗</span></span></div>
    <div class="post-info"><span class="tag">회고</span><h3 id="post-title">프로 개발자<br class="desktop-break"> 2023일 후기</h3><p>개발자로 일하며 배운<br>비즈니스와 팀의 이야기.</p><div class="post-bottom"><time datetime="2023-04-30">2023.04.30</time><span class="read-arrow">{arrow}</span></div></div>
  </a>
</main>'''
(HERE / "index.html").write_text(page("scwon’s blog — 원성철", home, "home"))

article = f'''
<div class="reading-progress" aria-hidden="true"></div>
<header class="article-nav shell"><a class="small-brand" href="./">scwon’s blog<span>.</span></a><a class="all-posts" href="./">← 모든 글</a></header>
<main id="main" class="article-shell">
  <header class="article-heading"><span class="tag">회고</span><h1>프로 개발자<br>2023일 후기</h1><p class="article-deck">개발자로 일하며 배운 비즈니스와 팀의 이야기.</p><div class="byline"><span class="author-mark" aria-hidden="true">w.</span><span>원성철</span><span class="byline-divider" aria-hidden="true"></span><time datetime="2023-04-30">2023.04.30</time></div></header>
  <div class="reading-layout">
    <div class="article-column"><figure class="article-hero"><img src="assets/hero.png" width="357" height="229" alt="첫 출근일부터 2023년 4월 30일까지를 계산하니 2023일이었다."><figcaption>2017.10.16 — 2023.04.30</figcaption></figure>
      <details class="mobile-toc"><summary>이 글의 목차</summary><nav aria-label="모바일 글 목차">{md.toc}</nav></details>
      <article class="prose">{content}</article>
      <div class="article-end"><span>읽어주셔서 감사합니다.</span><a href="./">모든 글 보기 {arrow}</a></div>
    </div>
    <aside class="desktop-toc"><nav aria-label="글 목차"><span class="toc-title">이 글의 목차</span>{md.toc}<a class="back-top" href="#main">맨 위로 ↑</a></nav></aside>
  </div>
</main>'''
(HERE / "article.html").write_text(page("프로 개발자 2023일 후기 · scwon’s blog", article, "article-page"))
print("Built home + complete article with original images.")
