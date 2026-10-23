"""Build the blog-opus prototype (home + full article) from the unchanged source post.

Run from the repository root:
  uv run --with markdown --with fonttools --with brotli python specs/010-blog-renewal/prototype/blog-opus/build.py

Fonts are downloaded once into ~/.cache/sclog-prototype-fonts and subset to the
characters used on these pages, so the prototype works offline afterwards.
"""
from html import escape, unescape
from pathlib import Path
import json
import math
import os
import re
import shutil
import stat
import struct
import urllib.request

import markdown
from markdown.extensions.toc import slugify_unicode

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SLUG = "pro-developer-2023-days"
SOURCE = ROOT / f"src/content/blog/{SLUG}.mdx"
IMAGES = ROOT / f"public/images/blog/{SLUG}"
CACHE = Path(os.environ.get("FONT_CACHE", Path.home() / ".cache/sclog-prototype-fonts"))
GF = "https://github.com/google/fonts/raw/main/ofl"
FONT_SOURCES = {
    "Bricolage.ttf": f"{GF}/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf",
    "Bricolage-OFL.txt": f"{GF}/bricolagegrotesque/OFL.txt",
    "Pretendard.ttf": "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/variable/PretendardVariable.ttf",
    "MaruBuri-Regular.ttf": "https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.ttf",
    "MaruBuri-Bold.ttf": "https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.ttf",
    "JetBrainsMono.ttf": f"{GF}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
    "JetBrainsMono-OFL.txt": f"{GF}/jetbrainsmono/OFL.txt",
}


# ---------- content ----------

raw = SOURCE.read_text()
_, front, body = raw.split("---", 2)
meta = {}
for line in front.strip().splitlines():
    key, value = line.split(":", 1)
    value = value.strip()
    meta[key.strip()] = json.loads(value) if value.startswith(("[", '"')) else value
year, month, day = meta["pubDate"].split("-")


def png_size(path):
    with open(path, "rb") as f:
        return struct.unpack(">II", f.read(24)[16:24])


def to_figure(match):
    src, alt, caption = match.groups()
    name = src.rsplit("/", 1)[-1]
    w, h = png_size(IMAGES / name)
    return (f'<figure class="figure"><img src="assets/{name}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
            f'<figcaption>{caption}</figcaption></figure>')


body = body.strip()
# The page title is the only h1, so every source heading moves down one level.
body = re.sub(r"^(#{1,5}) ", r"\1# ", body, flags=re.MULTILINE)
body = re.sub(r'<p align="center">\s*<img src="([^"]+)" alt="([^"]*)" />\s*<br />\s*<em>(.*?)</em>\s*</p>', to_figure, body, flags=re.S)
first_paragraph = next(p for p in body.split("\n\n") if p and not p.startswith(("#", "<", ">")))
excerpt = re.split(r"(?<=다\.)\s", re.sub(r"\*\*(.+?)\*\*", r"\1", first_paragraph))[0]

md = markdown.Markdown(extensions=["toc", "fenced_code", "tables"],
                       extension_configs={"toc": {"toc_depth": "2-3", "slugify": slugify_unicode}})
content = md.convert(body)

chapters = [t for t in md.toc_tokens if t["level"] == 2]
for no, chapter in enumerate(chapters, 1):
    content = content.replace(f'<h2 id="{chapter["id"]}">',
                              f'<h2 id="{chapter["id"]}"><span class="chapter-no" aria-hidden="true">{no:02d}</span>', 1)
content = content.replace("<hr />", '<hr class="section-break" />')
# The closing note after the rule reads as a postscript.
content = re.sub(r'(<hr class="section-break" />\s*)<p>', r'\1<p class="postscript">', content)

plain = re.sub(r"\s+", "", unescape(re.sub(r"<[^>]+>", "", content)))
minutes = math.ceil(len(plain) / 500)


def toc_html(cls):
    items = []
    for no, chapter in enumerate(chapters, 1):
        subs = "".join(f'<li><a href="#{c["id"]}" data-level="3">{escape(unescape(c["name"]))}</a></li>'
                       for c in chapter["children"])
        items.append(f'<li><a href="#{chapter["id"]}" data-level="2" data-no="{no:02d}">'
                     f'<span class="toc-no" aria-hidden="true">{no:02d}</span><span class="toc-text">{escape(unescape(chapter["name"]))}</span></a>'
                     + (f'<ol class="toc-sub">{subs}</ol>' if subs else "") + "</li>")
    return f'<ol class="{cls}">{"".join(items)}</ol>'


# ---------- markup ----------

ARROW = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
OUT = '<svg class="icon icon-out" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13 13 7m-5 0h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHEVRON = '<svg class="icon chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
BRAND = 'scwon<span class="apos">’</span>s blog'
SIGN = '<span class="sign" aria-hidden="true">’</span>'
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23E9AC9F'/%3E"
           "%3Cpath d='M13.2 8.5h6.3l-3.4 9.6c-.9 2.6-2.4 4.4-4.6 5.4l-1-1.6c1.4-.8 2.3-1.9 2.7-3.4h-2.9z' fill='%23242424'/%3E%3C/svg%3E")
hero_w, hero_h = png_size(IMAGES / meta["heroImage"].rsplit("/", 1)[-1])
date_iso = meta["pubDate"]

footer = f'''<footer class="site-footer">
  <div class="wrap footer-inner">
    <a class="footer-brand" href="./">{BRAND}</a>
    <span class="footer-author">{SIGN}원성철</span>
    <a class="footer-link pen" href="https://github.com/scwon/sclog">이 블로그의 소스{OUT}</a>
  </div>
</footer>'''


def page(title, description, body_class, main):
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#FAF8F5">
<meta name="description" content="{escape(description)}">
<title>{title}</title>
<link rel="icon" href="{FAVICON}">
<link rel="preload" href="fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/pretendard.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<script src="app.js" defer></script>
</head>
<body class="{body_class}">
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
{main}
{footer}
</body>
</html>
'''


masthead = f'''<header class="masthead wrap">
  <h1 class="masthead-title"><a href="./">{BRAND}</a></h1>
  <div class="masthead-meta">
    <span class="masthead-author">{SIGN}원성철</span>
    <a class="masthead-link pen" href="https://github.com/scwon">GitHub{OUT}</a>
  </div>
</header>'''

cards_home = masthead + f'''
<main id="main" class="wrap home-main">
  <section class="year-group" aria-labelledby="year-{year}">
    <h2 class="year-label" id="year-{year}">{year}</h2>
    <ol class="post-list">
      <li>
        <article class="post-card">
          <div class="post-thumb mat"><img src="assets/hero.png" alt="" width="{hero_w}" height="{hero_h}"></div>
          <div class="post-body">
            <h3 class="post-title"><a class="post-link" href="article.html">{escape(meta["title"])}</a></h3>
            <p class="post-date"><time datetime="{date_iso}">{month}.{day}</time></p>
            <p class="post-excerpt">{escape(excerpt)}</p>
            <p class="post-meta"><span>{escape(meta["tags"][0])}</span><span>읽는 시간 {minutes}분</span><span class="post-go">{ARROW}</span></p>
          </div>
        </article>
      </li>
    </ol>
  </section>
</main>'''

# The home list reads like a terminal file manager: year folders, post files, and a preview pane.
# Every value comes from the real post file; nothing is padded with sample entries.
source_stat = SOURCE.stat()
posts = [{
    "id": f"post-{SLUG}",
    "href": "article.html",
    "file": SOURCE.name,
    "title": meta["title"],
    "date": date_iso,
    "year": year,
    "excerpt": excerpt,
    "tags": meta["tags"],
    "minutes": minutes,
    "chapters": len(chapters),
    "images": len(list(IMAGES.iterdir())),
    "stat": f"{stat.filemode(source_stat.st_mode)}  scwon  {source_stat.st_size / 1024:.1f}K  {SOURCE.name}",
}]
years = sorted({p["year"] for p in posts}, reverse=True)


def file_row(post, selected):
    return f'''<li><a class="file{' is-selected' if selected else ''}" href="{post["href"]}" data-post="{post["id"]}" data-stat="{escape(post["stat"])}" aria-describedby="{post["id"]}-excerpt">
            <time class="file-date" datetime="{post["date"]}">{post["date"]}</time>
            <span class="file-title">{escape(post["title"])}</span>
            <span class="file-read">{post["minutes"]}분</span>
          </a></li>'''


def preview(post, shown):
    return f'''<article class="preview" id="{post["id"]}" data-href="{post["href"]}" aria-hidden="true"{'' if shown else ' hidden'}>
          <p class="preview-file">{post["file"]}</p>
          <div class="preview-mat mat"><img src="assets/hero.png" alt="" width="{hero_w}" height="{hero_h}"></div>
          <p class="preview-title">{escape(post["title"])}</p>
          <p class="preview-excerpt" id="{post["id"]}-excerpt">{escape(post["excerpt"])}</p>
          <dl class="preview-stat">
            <div><dt>작성</dt><dd>{post["date"].replace("-", ".")}</dd></div>
            <div><dt>분량</dt><dd>{post["minutes"]}분 · {post["chapters"]}개 장 · 이미지 {post["images"]}</dd></div>
            <div><dt>분류</dt><dd>{" ".join(escape(t) for t in post["tags"])}</dd></div>
          </dl>
        </article>'''


year_dirs = "".join(
    f'<li><a class="dir{" is-open" if i == 0 else ""}" href="#year-{y}"><span>{y}/</span><span class="dir-count">{sum(p["year"] == y for p in posts)}</span></a></li>'
    for i, y in enumerate(years))
file_groups = "".join(
    f'''<h3 class="year-dir" id="year-{y}">{y}/</h3>
        <ol class="file-list">{"".join(file_row(p, p is posts[0]) for p in posts if p["year"] == y)}</ol>'''
    for y in years)
previews = "".join(preview(p, p is posts[0]) for p in posts)

finder_home = masthead + f'''
<main id="main" class="wrap home-main">
  <section class="finder" aria-labelledby="finder-title">
    <header class="finder-bar">
      <h2 class="finder-path" id="finder-title"><span class="prompt">scwon@blog</span>:<span class="cwd">~/posts</span></h2>
      <p class="finder-cmd" aria-hidden="true"><span class="caret">❯</span>ls -t<span class="cursor"></span></p>
      <p class="finder-count">글 {len(posts)}편</p>
    </header>
    <div class="finder-body">
      <nav class="finder-years" aria-label="연도">
        <p class="col-label" aria-hidden="true">폴더</p>
        <ol class="dir-list">{year_dirs}</ol>
      </nav>
      <div class="finder-files">
        <p class="col-label" aria-hidden="true"><span>날짜</span><span>제목</span><span>분량</span></p>
        {file_groups}
      </div>
      <div class="finder-preview">
        {previews}
      </div>
    </div>
    <footer class="finder-status" aria-hidden="true">
      <span class="status-mode">목록</span>
      <span class="status-file">{escape(posts[0]["stat"])}</span>
      <span class="status-keys"><kbd>↑</kbd><kbd>↓</kbd> 이동 <kbd>↵</kbd> 열기</span>
      <span class="status-pos">1/{len(posts)}</span>
    </footer>
  </section>
</main>'''

# The current home: an IDE workspace. The explorer lists post files; the editor draws each post as a
# log entry on a rail, followed by its chapters as a flow of linked steps that can be folded.
FILES_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5h7l4 4V17a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 17V5A1.5 1.5 0 0 1 8 3.5Z M15 3.5V8h4 M4.5 7v12A1.5 1.5 0 0 0 6 20.5h9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
CODE_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 7.5-5 4.5 5 4.5m7-9 5 4.5-5 4.5m-2-11-3 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
BRANCH_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M7 15c0-4 10-3 10-8M7 20a2 2 0 1 0 0-.01M7 6a2 2 0 1 0 0-.01M17 7a2 2 0 1 0 0-.01" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
head_ref = (ROOT / ".git/HEAD").read_text().strip()
branch = head_ref.rsplit("/", 1)[-1] if head_ref.startswith("ref:") else head_ref[:7]
posts[0]["toc"] = chapters


def flow_lines(intro=()):
    lines = []

    numbered = 0

    def add(kind, inner, attrs="", counted=True):
        # The fold placeholder takes no line number, as in an editor's folded region.
        nonlocal numbered
        numbered += counted
        number = numbered if counted else ""
        lines.append(f'<li class="line line-{kind}" data-line="{number}"{attrs}><span class="ln" aria-hidden="true">{number}</span>{inner}</li>')

    for kind, inner in intro:
        add(kind, inner)
    for y in years:
        year_posts = [p for p in posts if p["year"] == y]
        add("dir", f'<h2 class="dir-label"><span aria-hidden="true">{y}/</span><span class="sr-only">{y}년 글</span></h2><span class="dir-rule" aria-hidden="true"></span><span class="dir-count">{len(year_posts)}</span>')
        for post in year_posts:
            group = f'{post["id"]}-steps'
            step_ids = " ".join(f'{group}-{i}' for i in range(1, len(post["toc"]) + 1))
            add("log", f'''<button class="fold" type="button" aria-expanded="true" aria-controls="{step_ids}" aria-label="{escape(post["title"])} 장 흐름 접기"></button>
          <p class="log-head"><time datetime="{post["date"]}">{post["date"]}</time><span class="log-tag">[{escape(post["tags"][0])}]</span><span class="log-file">{post["file"]}</span></p>
          <article class="flow-card">
            <div class="flow-thumb mat"><img src="assets/hero.png" alt="" width="{hero_w}" height="{hero_h}"></div>
            <div class="flow-body">
              <h3 class="flow-title"><a class="flow-link" href="{post["href"]}">{escape(post["title"])}</a></h3>
              <p class="flow-excerpt">{escape(post["excerpt"])}</p>
              <p class="flow-meta"><span>읽는 시간 {post["minutes"]}분</span><span>{post["chapters"]}개 장</span><span>이미지 {post["images"]}</span></p>
            </div>
          </article>''', f' id="{post["id"]}"')
            for i, chapter in enumerate(post["toc"], 1):
                name = escape(unescape(chapter["name"]))
                subs = "".join(f'<li><a href="{post["href"]}#{c["id"]}">{escape(unescape(c["name"]))}</a></li>' for c in chapter["children"])
                sub_html = f'<ol class="subflow" aria-label="{i:02d}장 세부 흐름">{subs}</ol>' if subs else ""
                add("step", f'''<div class="step-wrap"><a class="step" href="{post["href"]}#{chapter["id"]}"><span class="step-no">{i:02d}</span><span class="step-text">{name}</span></a>{sub_html}</div>''',
                    f' id="{group}-{i}" data-group="{post["id"]}"')
            add("folded", f'<button class="folded-label" type="button" data-unfold-post="{post["id"]}">··· {post["chapters"]}개 장 접힘</button>',
                f' data-group-folded="{post["id"]}" hidden', counted=False)
    add("end", f'<span class="end-label">(END)</span><span class="end-count">글 {len(posts)}편</span><span class="cursor" aria-hidden="true"></span>')
    return "\n        ".join(lines)


# ---------- IDE shell: index.html and article.html ----------
# Every route is rendered here in full (the SSR output). app.js then swaps only the page regions on
# navigation, so the window chrome stays put, as Astro's ClientRouter does with persisted elements.
MENU_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
SUN_ICON = '<svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2.2m0 14.6v2.2M2.5 12h2.2m14.6 0h2.2M5.3 5.3l1.6 1.6m10.2 10.2 1.6 1.6m0-13.4-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
MOON_ICON = '<svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
raw_front = {k.strip(): v.strip() for k, v in (line.split(":", 1) for line in front.strip().splitlines())}
sections = sum(len(c["children"]) for c in chapters)
images = [(img.name, *png_size(img)) for img in sorted(IMAGES.iterdir())]
post_path = f"posts/{year}/{SOURCE.name}"


def fm_value(value):
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return f'<span class="fm-num">{value}</span>'
    return re.sub(r"&quot;(.*?)&quot;", r'<span class="fm-str">&quot;\1&quot;</span>', escape(value))


def tab_html(href, label, glyph, active, closable):
    current = ' aria-current="page"' if active else ""
    close = f'<button class="tab-close" type="button" aria-label="{label} 닫기">×</button>' if closable else ""
    return (f'<div class="tab-item{" is-active" if active else ""}" data-href="{href}">'
            f'<a class="tab" href="{href}"{current}><span class="{glyph}" aria-hidden="true"></span>{label}</a>{close}</div>')


def tree_html(active_href):
    return "".join(
        f'''<li><p class="tree-dir"><span class="twisty" aria-hidden="true"></span>{y}<span class="tree-count">{sum(p["year"] == y for p in posts)}</span></p>
          <ul>{"".join(f'<li><a class="tree-file{" is-active" if p["href"] == active_href else ""}" href="{p["href"]}" title="{p["file"]}"><span class="file-dot" aria-hidden="true"></span>{p["file"]}</a></li>' for p in posts if p["year"] == y)}</ul></li>'''
        for y in years)


def log_entry(command, rows):
    items = "".join(f"<div><dt>{escape(k)}</dt><dd>{escape(v)}</dd></div>" for k, v in rows)
    return (f'<li class="log-entry"><p class="log-cmd"><span class="log-time"></span><span class="log-caret" aria-hidden="true">❯</span>{escape(command)}</p>'
            f'<dl class="log-rows">{items}</dl></li>')


def ide_page(*, title, description, kind, href, file, window_title, crumbs, outline, body, status, log, minimap):
    data = {"kind": kind, "href": href, "file": file, "log": log}
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#1A1817">
<meta name="description" content="{escape(description)}">
<title>{title}</title>
<link rel="icon" href="{FAVICON}">
<script>try{{const t=localStorage.getItem("sclog-theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="preload" href="fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/pretendard.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="ide.css">
<script src="app.js" defer></script>
</head>
<body class="ide-app" data-page="{kind}">
<a class="skip-link" href="#editor">본문으로 건너뛰기</a>
<header class="titlebar">
  <button class="tb-btn tb-menu" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="탐색기">{MENU_ICON}</button>
  <a class="tb-brand" href="./">{BRAND}</a>
  <p class="tb-title" aria-hidden="true">{window_title}</p>
  <div class="tb-end">
    <span class="tb-author">{SIGN}원성철</span>
    <a class="tb-link" href="https://github.com/scwon">GitHub{OUT}</a>
    <button class="tb-btn tb-theme" type="button" aria-label="밝은 테마로 전환">{SUN_ICON}{MOON_ICON}</button>
  </div>
</header>
<nav class="activitybar" aria-label="작업 막대">
  <button class="ab-btn ab-explorer" type="button" aria-pressed="true" aria-controls="sidebar" aria-label="탐색기">{FILES_ICON}</button>
  <a class="ab-btn" href="https://github.com/scwon/sclog" aria-label="이 블로그의 소스">{CODE_ICON}</a>
</nav>
<aside class="sidebar" id="sidebar" aria-label="탐색기">
  <p class="side-title">탐색기</p>
  <section class="side-section" aria-labelledby="side-posts">
    <h2 class="side-head" id="side-posts"><span class="twisty" aria-hidden="true"></span>posts</h2>
    <ul class="tree">{tree_html("article.html" if kind == "article" else "")}</ul>
  </section>
  <div class="side-page">{outline}</div>
</aside>
<div class="scrim" hidden></div>
<main class="editor" id="editor" tabindex="-1">
  <div class="editor-head">
    <nav class="tabs" aria-label="열린 파일">{tab_html("./", "posts.log", "log-glyph", kind == "home", False)}{tab_html("article.html", SOURCE.name, "file-dot", True, True) if kind == "article" else ""}</nav>
    <div class="crumbs-bar">{crumbs}</div>
  </div>
  {body}
</main>
<div class="minimap" aria-hidden="true"{"" if minimap else " hidden"}><div class="mm-bars"></div><div class="mm-view"></div></div>
<section class="panel" id="output-panel" aria-label="출력" hidden>
  <div class="panel-head"><span class="panel-tab">출력</span><button class="panel-close" type="button" aria-label="출력 닫기">×</button></div>
  <ol class="panel-log">{log_entry(log["command"], log["rows"])}</ol>
</section>
<footer class="statusbar">
  <span class="sb-branch" aria-hidden="true">{BRANCH_ICON}{branch}</span>
  <button class="sb-output" type="button" aria-controls="output-panel" aria-expanded="false">출력</button>
  <span class="sb-log" aria-hidden="true"></span>
  <div class="sb-page">{status}</div>
</footer>
<p class="sr-only" id="route-status" aria-live="polite"></p>
<script type="application/json" id="page-meta">{json.dumps(data, ensure_ascii=False)}</script>
</body>
</html>
'''


KEYS = '<span class="sb-keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> 이동 <kbd>↵</kbd> 열기</span>'
home_intro = [
    ("banner", f'<h1 class="banner">{BRAND}</h1>'),
    ("comment", '<p class="comment"><span class="c-mark" aria-hidden="true">//</span> 원성철 · <a href="https://github.com/scwon">github.com/scwon</a></p>'),
    ("blank", ""),
]
ide_home = ide_page(
    title="scwon’s blog",
    description="원성철의 블로그",
    kind="home",
    href="./",
    file="posts.log",
    window_title="posts.log — scwon’s blog",
    crumbs='<nav class="crumbs" aria-label="위치"><span>posts</span><span class="crumb-sep" aria-hidden="true">›</span><span class="crumb-file" aria-current="page">posts.log</span></nav>',
    outline="",
    body=f'''<div class="editor-body home-body">
    <ol class="flow">
        {flow_lines(home_intro)}
    </ol>
  </div>''',
    status=f'<span class="sb-item" aria-hidden="true">글 {len(posts)}편</span><span class="sb-item" data-ln aria-hidden="true">Ln 1</span><span class="sb-spacer"></span>{KEYS}<span class="sb-item" aria-hidden="true">Log</span><span class="sb-item" aria-hidden="true">UTF-8</span>',
    log={"command": "open posts.log", "rows": [
        (f"{y}/", " · ".join(p["file"] for p in posts if p["year"] == y)) for y in years] + [("완료", f"글 {len(posts)}편")]},
    minimap=False,
)

fm_lines = ['<span class="fm-line"><span class="fm-dash">---</span></span>']
fm_lines += [f'<span class="fm-line"><span class="fm-key">{k}</span><span class="fm-punct">:</span> {fm_value(raw_front[k])}</span>'
             for k in ("title", "pubDate", "tags", "heroImage")]
fm_lines += ['<span class="fm-line"><span class="fm-dash">---</span></span>']
ide_tags = "".join(f"<li>{escape(t)}</li>" for t in meta["tags"])
ide_article = ide_page(
    title=f"{escape(meta['title'])} — scwon’s blog",
    description=meta["description"],
    kind="article",
    href="article.html",
    file=SOURCE.name,
    window_title=f"{SOURCE.name} — scwon’s blog",
    crumbs=f'''<nav class="crumbs" aria-label="위치"><a href="./">posts</a><span class="crumb-sep" aria-hidden="true">›</span><span class="crumb-dir">{year}</span><span class="crumb-sep crumb-dir" aria-hidden="true">›</span><span class="crumb-file" aria-current="page">{SOURCE.name}</span><span class="crumb-symbol" data-symbol="crumb"></span></nav>
      <button class="crumb-outline" type="button" aria-controls="sidebar" aria-expanded="false">개요</button>
      <span class="crumbs-progress" aria-hidden="true"></span>''',
    outline=f'''<section class="side-section side-outline" aria-labelledby="side-outline">
    <h2 class="side-head" id="side-outline"><span class="twisty" aria-hidden="true"></span>개요</h2>
    <nav class="outline" aria-label="글 목차"><div class="toc-track">{toc_html("toc-list")}<span class="toc-progress" aria-hidden="true"></span></div></nav>
  </section>''',
    body=f'''<div class="editor-body article-body">
    <article class="doc">
      <pre class="frontmatter" aria-hidden="true"><code>{"".join(fm_lines)}</code></pre>
      <header class="doc-head">
        <h1 class="doc-title">{escape(meta["title"])}</h1>
        <p class="doc-byline">{SIGN}<span class="byline-author">원성철</span><span class="byline-sep" aria-hidden="true"></span><time datetime="{date_iso}">{date_iso.replace("-", ".")}</time><span class="byline-sep" aria-hidden="true"></span><span>읽는 시간 {minutes}분</span></p>
      </header>
      <figure class="doc-hero mat"><img src="assets/hero.png" alt="개발자 도구 콘솔에서 2017년 10월 16일부터 2023년 4월 30일까지의 날짜를 세어 2023이 출력된 화면" width="{hero_w}" height="{hero_h}"></figure>
      <div class="prose" id="content">
{content}
      </div>
      <footer class="doc-foot">
        <ul class="tags" aria-label="태그">{ide_tags}</ul>
        <div class="author-card">{SIGN}<div><p class="author-name">원성철</p><a class="pen" href="https://github.com/scwon">github.com/scwon{OUT}</a></div></div>
        <nav class="end-nav" aria-label="글 끝 이동">
          <a class="end-back pen" href="./">{ARROW}posts.log</a>
          <a class="end-top pen" href="#editor">맨 위로</a>
        </nav>
      </footer>
    </article>
  </div>''',
    status=f'<span class="sb-item" data-ln aria-hidden="true">Ln 1</span><span class="sb-item sb-symbol" data-symbol="status" aria-hidden="true">{escape(meta["title"])}</span><span class="sb-spacer"></span><span class="sb-item sb-percent" data-percent aria-hidden="true">0%</span><span class="sb-item" aria-hidden="true">MDX</span><span class="sb-item" aria-hidden="true">UTF-8</span>',
    log={"command": f"open {post_path}", "rows": [
        ("frontmatter", " · ".join(("title", "pubDate", "tags", "heroImage"))),
        ("구조", f"{len(chapters)}개 장 · {sections}개 절"),
        ("이미지", " · ".join(f"{name} {w}×{h}" for name, w, h in images)),
        ("완료", f"{source_stat.st_size / 1024:.1f}K · 읽는 시간 {minutes}분"),
    ]},
    minimap=True,
)

tags = "".join(f"<li>{escape(t)}</li>" for t in meta["tags"])
article = f'''<header class="site-bar wrap">
  <a class="brand" href="./">{BRAND}</a>
  <nav class="site-nav" aria-label="사이트">
    <a class="pen" href="./">모든 글</a>
    <a class="pen" href="https://github.com/scwon">GitHub{OUT}</a>
  </nav>
</header>
<div class="editor-strip wrap">
  <span class="editor-tab"><span class="file-dot" aria-hidden="true"></span>{SOURCE.name}</span>
  <nav class="crumbs" aria-label="위치"><a href="./">posts</a><span class="crumb-sep" aria-hidden="true">›</span><span>{year}</span><span class="crumb-sep" aria-hidden="true">›</span><span aria-current="page">{SOURCE.name}</span></nav>
</div>
<main id="main" class="wrap">
  <article class="article">
    <header class="article-head">
      <p class="rail-date"><time datetime="{date_iso}"><span class="rail-year">{year}</span><span class="rail-md">{month}.{day}</span></time></p>
      <div class="head-main">
        <h1 class="article-title">{escape(meta["title"])}</h1>
        <p class="byline">{SIGN}<span class="byline-author">원성철</span><span class="byline-sep" aria-hidden="true"></span><span>읽는 시간 {minutes}분</span></p>
      </div>
    </header>
    <figure class="article-hero mat"><img src="assets/hero.png" alt="개발자 도구 콘솔에서 2017년 10월 16일부터 2023년 4월 30일까지의 날짜를 세어 2023이 출력된 화면" width="{hero_w}" height="{hero_h}"></figure>
    <div class="article-grid">
      <aside class="toc-rail">
        <nav class="toc" aria-label="글 목차">
          <p class="toc-label">목차</p>
          <div class="toc-track">{toc_html("toc-list")}<span class="toc-progress" aria-hidden="true"></span></div>
          <a class="toc-top" href="#main">맨 위로</a>
        </nav>
      </aside>
      <div class="article-col">
        <div class="chapter-bar">
          <button class="chapter-toggle" type="button" aria-expanded="false" aria-controls="chapter-panel">
            <span class="chapter-label">목차</span>
            <span class="chapter-current"><span class="chapter-current-no"></span><span class="chapter-current-text">처음부터 읽기</span></span>
            {CHEVRON}
          </button>
          <nav class="chapter-panel" id="chapter-panel" aria-label="모바일 글 목차">{toc_html("toc-list")}</nav>
          <span class="chapter-progress" aria-hidden="true"></span>
        </div>
        <div class="prose" id="content">
{content}
        </div>
        <footer class="article-foot">
          <ul class="tags" aria-label="태그">{tags}</ul>
          <div class="author-card">{SIGN}<div><p class="author-name">원성철</p><a class="pen" href="https://github.com/scwon">github.com/scwon{OUT}</a></div></div>
          <nav class="end-nav" aria-label="글 끝 이동">
            <a class="end-back pen" href="./">{ARROW}모든 글</a>
            <a class="end-top pen" href="#main">맨 위로</a>
          </nav>
        </footer>
      </div>
    </div>
  </article>
</main>
<div class="read-status" aria-hidden="true">
  <span class="status-branch">{BRANCH_ICON}{branch}</span>
  <span class="rs-file">{SOURCE.name}</span>
  <span class="rs-chapter" data-symbol="status">처음</span>
  <span class="rs-percent" data-percent>0%</span>
  <span class="status-lang">MDX</span>
</div>'''

(HERE / "index.html").write_text(ide_home)
(HERE / "finder.html").write_text(page("scwon’s blog — 파일 관리자 목록(이전안)", "원성철의 블로그", "home", finder_home))
(HERE / "cards.html").write_text(page("scwon’s blog — 카드 목록(이전안)", "원성철의 블로그", "home", cards_home))
(HERE / "article.html").write_text(ide_article)
(HERE / "article-classic.html").write_text(page(f"{escape(meta['title'])} — scwon’s blog (이전안)", meta["description"], "article-page", article))

(HERE / "assets").mkdir(exist_ok=True)
for image in IMAGES.iterdir():
    shutil.copyfile(image, HERE / "assets" / image.name)


# ---------- fonts ----------

def fetch(name):
    target = CACHE / name
    if not target.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        print(f"download {name}")
        with urllib.request.urlopen(FONT_SOURCES[name]) as r:
            target.write_bytes(r.read())
    return target


from fontTools import subset  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib import instancer  # noqa: E402

text = "".join(unescape(re.sub(r"<[^>]+>", " ", (HERE / f).read_text()))
               for f in ("index.html", "finder.html", "cards.html", "article.html", "article-classic.html"))
text += "".join((HERE / f).read_text() for f in ("app.js", "styles.css", "ide.css"))
text += "".join(chr(c) for c in range(0x20, 0x7F)) + "’‘“”·…—–→←↑↓↗↵❯▸▾›×✓"
fonts_dir = HERE / "fonts"
fonts_dir.mkdir(exist_ok=True)


def build_font(source, out, axes=None):
    font = TTFont(fetch(source))
    if axes:
        font = instancer.instantiateVariableFont(font, axes)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(fonts_dir / out)
    print(f"{out}: {(fonts_dir / out).stat().st_size // 1024} KB")


build_font("Bricolage.ttf", "bricolage.woff2", {"wdth": 100, "wght": (500, 800), "opsz": (12, 96)})
build_font("Pretendard.ttf", "pretendard.woff2")
build_font("MaruBuri-Regular.ttf", "maruburi-regular.woff2")
build_font("MaruBuri-Bold.ttf", "maruburi-bold.woff2")
build_font("JetBrainsMono.ttf", "jetbrains-mono.woff2")
for license_file in ("Bricolage-OFL.txt", "JetBrainsMono-OFL.txt"):
    shutil.copyfile(fetch(license_file), fonts_dir / license_file)
print(f"Built home + article ({minutes} min read, {len(chapters)} chapters).")
