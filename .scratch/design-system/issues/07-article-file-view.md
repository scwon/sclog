# 07: 글 파일 화면과 읽기 진행

**What to build:** 글이 시안 `article.html`처럼 "연 파일"로 보인다. frontmatter(title·pubDate·tags·heroImage)가 코드 색으로 먼저 나오고, 제목과 세리프 본문의 모든 블록에 줄 번호가 있으며, 읽는 위치의 줄 번호는 코랄이다. 탐색기 개요의 세로선이 읽은 만큼 채워지고, 경로 표시줄 끝과 상태줄에 `04 개발자란? › 3~4년차` 같은 현재 장·절, 상태줄에 `Ln N`과 읽은 비율이 따라온다. 파일을 열면 첫 1.4화면의 줄이 위에서부터 펼쳐진다.

**Blocked by:** 05 (창 틀과 레이아웃 교체)

**Status:** done

참고: DESIGN.md "전체 화면 IDE" 글 파일·탐색기·경로·펼침 항목, 시안 `article.html`, `ide.css` "article"·"opening a file" 절, `styles.css` prose 타이포, `app.js` 읽기 상태·펼침. 미니맵과 출력 패널은 범위 밖.

- [x] 글 페이지 에디터가 frontmatter 블록(키는 보조색, 문자열은 `code-string` 토큰), 제목, 본문 순이며 모든 블록(문단·제목·이미지·코드·인용)에 줄 번호가 붙는다. 인용 따옴표는 본문 칸 안에 둔다. MDX 원본과 글 URL은 바뀌지 않는다
- [x] 본문은 `font-serif` 18.5px/행간 1.92(모바일 17px/1.9), 폭 680px, `keep-all`. 본문 이미지는 매트 없이 얇은 테두리, 대표 이미지는 코랄 매트
- [x] `reading` 스토어(nanostores)가 현재 줄 번호·현재 장·절·읽은 비율을 갖고, 에디터 쪽 스크립트가 `IntersectionObserver`로 갱신한다. 비율 계산은 순수 함수로 분리되고 Vitest 테스트가 있다(맨 위 0%, 맨 아래 100%, 중간값)
- [x] `Shell`이 `reading`을 구독해 탐색기 개요의 현재 항목과 세로선 채움, 상태줄 `Ln N`·비율, 경로 표시줄 끝의 현재 장·절을 바꾼다. 개요 항목은 해당 제목으로 가는 링크다
- [x] 1180px 미만에서는 개요가 경로 표시줄의 `개요` 버튼으로 펼쳐지는 고정 막대(현재 장 + 진행선)로 보인다
- [x] 펼침: 에디터 루트의 `data-unfold`로 첫 1.4화면 안 줄·블록이 34ms 간격, 420ms(위→아래 잘라내기 + 6px 이동)로 나타난다. `prefers-reduced-motion`에서는 즉시 표시. 모든 시간은 모션 토큰
- [x] 댓글 등 기존 글 페이지 기능이 본문 아래 에디터 안에 그대로 있고 줄 번호 열과 정렬된다
- [x] 글 열림 상태의 `Shell` 스토리가 개요·상태줄 값을 보여 주며 두 테마에서 a11y 위반이 없다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 구현 (브랜치 `design-system`)

**결정**

- 글 레이아웃 `src/layouts/BlogPost.astro`를 시안 `article.html` 구조로 바꿨다. 순서는 frontmatter(코드 색, 키 `--accent-text`·문자열 `--code-string`·숫자 `--text`) → 제목·작성 정보 → 대표 이미지(코랄 매트) → 본문 → 꼬리(태그 `Badge` 링크·작성자 카드·`← posts.log`/`맨 위로`) → 댓글(기존 Giscus)이다. 댓글도 같은 칸 안에 있어 줄 번호 열과 맞는다.
- 본문 제목 단계: MDX 원본의 장 제목이 `#`(h1)이라 문서 제목 `<h1>`과 겹친다.
  - 처음에는 remark 플러그인으로 내리려 했다. 그런데 Astro 7은 기본 마크다운 처리기가 바뀌어 remark 플러그인에 `@astrojs/markdown-remark`가 필요하다. 티켓에 없는 라이브러리라 들이지 않았다.
  - 대신 `<Content components={{ h1: Chapter, h2: Section, h3: Subsection }} />`로 렌더링만 한 단계씩 내린다(`src/components/blog/headings/`). 원본 MDX와 제목 앵커(id)는 그대로다.
- 줄 번호는 `.doc :is(.doc-fm-line, .doc-title, .doc-byline, .doc-prose > *)::after`의 CSS 카운터다. 블록 첫 줄 높이 `--lh`(본문은 `--type-body × --type-body-leading`)에 맞춰 세로 위치를 정한다. 장 번호 `01`…은 `h2::before`의 CSS 카운터(`decimal-leading-zero`)와 짧은 코랄 선이다.
- 본문 타이포는 2층 `styles/prose.css`(`.doc-prose`)다.
  - 마루 부리 `--type-body`/`--type-body-leading`(18.5px/1.92, 760px 미만 17px/1.9), 폭 680px, `keep-all`.
  - 인용 따옴표는 본문 칸 안(`padding-left: 1.4em`)에 둔다.
  - 본문 이미지(MDX의 `<p><img><br><em>설명</em></p>`)는 `p:has(> img)`로 매트 없이 얇은 테두리와 설명 줄을 입힌다. `---` 뒤 문단은 맺음말 크기다.
- 글 제목 토큰: 스펙의 "제목 68/38"은 시안의 옛 글 화면 값이고, IDE 글 화면은 54/34다. `--type-title`·`--type-title-sm`과 원시 `--font-size-54`·`--font-size-34`로 맞췄다(토큰 주석이 "구현 중 조정 가능").
- 읽기 진행
  - 순수 로직은 `stores/reading.logic.ts`의 `readingPercent`(맨 위 0%, 맨 아래 100%, 스크롤할 것이 없으면 100%)와 `currentBlock`(읽는 선을 지난 마지막 블록)이다. 테스트는 `stores/reading.test.ts` 5개다.
  - 에디터 쪽 스크립트(`BlogPost.astro`)가 맡는 일:
    - 블록이 읽는 선(탭·경로 표시줄 바로 아래, `scroll-padding-top`)을 지나는 것을 IntersectionObserver로, 비율은 스크롤로 받는다.
    - 현재 줄 번호에 `.is-current`(코랄)를 붙이고, 현재 장(h2)·절(h3)과 함께 `reading` 스토어에 쓴다.
    - 경로 표시줄 끝의 현재 장·절과 진행선(`--progress`)을 바꾼다.
    - 페이지가 열릴 때마다 다시 붙이고, 떠날 때(`astro:before-swap`) 뗀다.
  - `Shell`은 `reading`을 구독해 다음을 바꾼다.
    - 탐색기 개요: 현재 장 번호 코랄, 현재 항목 `aria-current="location"`, 읽은 만큼 채워지는 세로선
    - 상태줄: `04 개발자란? › 3~4년차 · Ln N · N%`
  - 개요 번호는 명암비 때문에 `--text-faint` 대신 `--text-muted`를 쓴다.
- 1180px 미만: 경로 표시줄이 현재 장 + 코랄 진행선을 보이는 고정 막대가 되고, `개요` 버튼이 탐색기(개요)를 연다. 760px 미만에서는 경로 대신 현재 위치만 보인다.
- 펼침
  - 레이아웃 스크립트가 페이지가 열릴 때마다(`astro:page-load`) 첫 1.4화면 안의 블록에 `data-unfold-item`과 순서 `--i`를 붙인다. 대상은 흐름 로그 줄, frontmatter, 제목·작성 정보, 대표 이미지, 본문 블록이다.
  - 에디터 루트에는 `data-unfold`를 붙인다. 그러면 2층 `motion.css`가 `--motion-unfold-stagger`(34ms) 간격으로 `--motion-unfold`(420ms) 동안 위→아래 잘라내기 + 6px 이동으로 보인다.
  - 움직임 줄이기 설정에서는 붙이지 않는다. 마지막 항목의 애니메이션이 끝나면 걷어 낸다.
  - 처음에 이 스크립트를 `</html>` 뒤에 둬서 Astro가 빌드에서 빼 버렸다. `<body>` 안으로 옮겼다.
- `CodeBlock`(복사 버튼)의 대상 선택자를 `.doc-prose pre`로 바꿨다. 지금 글에는 코드 블록이 없다.

**확인**

- ego-browser(1440·1024·390px, 두 테마)
  - 시안과 같은 구성이다.
  - 3~4년차로 스크롤하면 줄 번호 28이 코랄, 경로 끝과 상태줄이 `04 개발자란? › 3~4년차`, `Ln 28`, `53%`, 개요 `3~4년차`가 강조된다. 맨 아래에서는 `05 마치며 › 목표`, `Ln 55`, `100%`다.
  - 탐색기에서 글을 열면 첫 화면 8개 블록이 펼쳐지고 끝나면 표시가 걷힌다. 움직임 줄이기에서는 펼침이 없다.
- 접근성: axe-core 4.14.0으로 글 화면(1440 맨 위·맨 아래, 1024·390 스크롤 중)과 홈을 두 테마에서 모든 규칙으로 검사했고 위반 0건이다. 글 열림 `Shell` 스토리(개요·상태줄 값 표시)도 두 테마에서 위반 0건이다.
- 테스트 108개 통과. `CI=1`에서 lint·format:check·build·test·build-storybook 모두 통과했다.
