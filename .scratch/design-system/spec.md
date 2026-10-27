# 디자인 시스템과 전체 화면 IDE 교체

Status: done

1차 자료: `DESIGN.md`("사이트 방향", "전체 화면 IDE와 파일 열기 로그", "IDE 작업 화면과 흐름 로그"), 시안 `specs/010-blog-renewal/prototype/blog-opus/`(`index.html`·`article.html`·`ide.css`·`styles.css`·`app.js`), `docs/adr/0001`~`0003`, `docs/research/design-system-tokens.md`, 용어는 `GLOSSARY.md`. 이 문서는 결정만 담고 값은 시안과 DESIGN.md를 가리킨다.

## Problem Statement

scwon.me는 옛 Astro 템플릿 스타일 위에 세 가지 토큰 체계(레이아웃 인라인 변수, shadcn 무채색 변수, 시안 CSS)가 따로 놓여 있고, 어느 것도 확정된 디자인(전체 화면 IDE, 코랄 팔레트, 네 글꼴)을 담고 있지 않다. 디자인은 시안 HTML로만 존재해 Astro 사이트와 이어지지 않으며, 컴포넌트를 추가할 때마다 어떤 색·글꼴·간격을 써야 하는지 참조할 곳이 없다. 다른 프로젝트에서 재사용할 범용 디자인 시스템을 만들려는 목표(ADR 0002)도 시작점이 없다.

## Solution

토큰 → CSS → React 컴포넌트 → Storybook 네 층의 디자인 시스템을 `src/design-system/`에 만들고, 그 위에 시안 그대로의 전체 화면 IDE(창 틀 + 홈 흐름 로그 + 글 파일 화면)를 올려 사이트를 한 번에 바꾼다. 옛 토큰·스타일·shadcn 컴포넌트는 첫 티켓에서 제거하고, 모든 티켓은 통합 브랜치 `design-system`에 쌓아 마지막 티켓이 끝났을 때만 main에 합쳐 배포한다. 중간 상태는 배포하지 않는다. 글 URL과 글 원본(MDX)은 바꾸지 않는다.

## User Stories

### 독자

1. 독자로서, scwon.me에 들어가면 어두운 테마의 IDE 창 안에 `posts.log` 탭이 열려 있고 글이 로그 줄로 쌓여 있어, 블로그가 어떤 성격인지 첫 화면에서 안다.
2. 독자로서, 홈의 글 로그 줄·카드·장 노드를 눌러 글 또는 글의 특정 장으로 바로 이동한다.
3. 독자로서, 글을 열면 같은 창에서 파일이 열린 것처럼 탭이 추가되고 창 틀(제목 표시줄·활동 막대·탐색기·상태줄)은 그대로 남아 화면이 통째로 깜빡이지 않는다.
4. 독자로서, 글 파일은 frontmatter가 코드 색으로 보이고 모든 블록에 줄 번호가 있으며 본문은 세리프(마루 부리)로 읽기 편하게 보인다.
5. 독자로서, 읽는 위치의 줄 번호가 코랄로 바뀌고 탐색기 개요의 세로선과 상태줄의 읽은 비율이 따라와 어디까지 읽었는지 안다.
6. 독자로서, 글을 열 때 상태줄에 `❯ open …` → `✓ 열림 · 용량 · 읽는 시간` 요약이 약 2초 보였다가 원래대로 돌아가고, 본문을 가리는 패널은 뜨지 않는다.
7. 독자로서, 파일을 열면 첫 화면의 줄·블록이 위에서부터 짧게 펼쳐지지만 움직임 줄이기 설정에서는 바로 나타난다.
8. 독자로서, 제목 표시줄 버튼으로 밝은 테마로 바꾸면 창 전체가 밝은 팔레트로 바뀌고, 다음 방문에도 그 선택이 유지된다.
9. 독자로서, 테마를 고른 적이 없으면 운영체제 설정을 따른다.
10. 독자로서, 탭을 `×`로 닫으면 왼쪽 탭(없으면 `posts.log`)으로 이동하고, 새로고침해도 같은 브라우저 세션 동안 열린 탭이 남는다.
11. 독자로서, `posts.log` 탭은 닫히지 않는다.
12. 독자로서, 탐색기의 `posts/2023/…mdx` 트리에서 글을 고르고, 글을 연 뒤에는 그 아래 개요(목차)로 장을 오간다.
13. 독자로서, 경로 표시줄과 상태줄에서 현재 글의 장과 절(`04 개발자란? › 3~4년차`)을 본다.
14. 독자로서, 1100px 미만에서는 탐색기가 겹침 패널로 열리고, 760px 미만에서는 제목 표시줄 메뉴로 여는 서랍과 경로 표시줄의 `개요` 버튼으로 같은 기능을 쓴다.
15. 독자로서, 키보드만으로 창 틀의 모든 버튼·탭·링크를 다루고 포커스 위치가 색 외의 단서(외곽선)로 보인다.
16. 독자로서, 글꼴이 외부 서비스가 아닌 사이트에서 제공돼 네트워크 차단 환경에서도 같은 글꼴로 본다.
17. 독자로서, 글 주소 `/blog/<slug>/`, 태그 페이지, 404 페이지의 주소가 전과 같아 기존 링크가 깨지지 않는다.
18. 독자로서, 글 페이지의 댓글 등 기존 기능은 에디터 영역 안에서 그대로 쓴다.
19. 독자로서, 모든 주소를 직접 열어도 완성된 HTML이 바로 보이고, JS가 꺼져 있어도 글을 읽는다.

### 작성자(원성철)

20. 작성자로서, MDX 글을 추가하면 홈 로그·탐색기 트리·탭·frontmatter 표시가 자동으로 생기고 글 원본은 손대지 않는다.
21. 작성자로서, 색·글꼴·간격을 바꾸고 싶을 때 토큰 파일 한 곳만 고치면 사이트와 Storybook이 함께 바뀐다.
22. 작성자로서, 두 테마의 토큰이 서로 빠진 것 없이 맞고 글자·바탕 명암비가 AA를 넘는지 테스트가 알려 준다.
23. 작성자로서, Storybook에서 토큰 문서 페이지(색·글꼴·반경·모션)와 모든 컴포넌트를 두 테마로 바꿔 가며 본다.
24. 작성자로서, 다른 React 프로젝트에 디자인 시스템 폴더를 옮겨도 Provider 없이 컴포넌트가 동작한다.

### 구현 에이전트

25. 구현 에이전트로서, 토큰·CSS·컴포넌트·스토리가 어느 폴더에 어떤 경계로 놓이는지 스펙에서 읽고 티켓마다 세로로 관통한다.
26. 구현 에이전트로서, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook`이 티켓마다 통과함을 확인한다.
27. 구현 에이전트로서, 옛 토큰 이름이나 `.dark` 클래스를 쓰면 빌드 결과물 테스트가 실패해 바로 안다.

## Implementation Decisions

### 진행 방식

- 통합 브랜치 `design-system` 하나에 모든 티켓을 쌓는다. 티켓마다 CI 다섯 검사를 통과해야 하지만 화면이 완성돼 보일 필요는 없다. 마지막 티켓이 홈·글·태그·404 네 화면을 두 테마로 ego-browser에서 확인한 뒤에만 main에 합친다.
- 첫 티켓이 옛 것을 지운다: 레이아웃의 인라인 토큰과 Google Fonts 링크, shadcn `button`·`badge`·`card`와 그 스토리, `.dark` 클래스 선택자와 `@custom-variant dark (&:is(.dark *))`, 옛 Astro 컴포넌트의 개별 스타일 중 토큰과 겹치는 것.
- 시안은 `specs/010-blog-renewal/prototype/blog-opus/`에 그대로 두고 1차 자료로 가리킨다. 별도 프로토타입 브랜치는 만들지 않는다.
- 새 의존성: `nanostores`, `@nanostores/react`, `@storybook/addon-docs`, `@storybook/addon-themes`, `pretendard`, `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`. 버전·배포일은 `docs/research/design-system-tokens.md` 부록에 있다. `pretendard` npm 패키지는 2023-11이 마지막 배포이지만 글꼴 자체가 1.3.9에서 멈춘 것이라 쓴다.

### 1층: 토큰

- 원시 토큰과 의미 토큰 2단계(ADR 0003). 원시 토큰은 팔레트·글꼴 묶음·치수 값이고 테마와 무관하다. 의미 토큰은 역할 이름이며 값은 반드시 원시 토큰 참조다. 컴포넌트 토큰은 만들지 않는다.
- 의미 토큰 이름은 Tailwind 네임스페이스에 맞춘 범용 역할이다. 색 역할과 시안 변수 대응:
  - 바탕 `surface`(에디터), `surface-sunken`(창 테두리 영역), `surface-panel`(탐색기), `surface-raised`(카드·노드)
  - 글자 `text`, `text-soft`, `text-muted`, `text-faint`
  - 선 `border`, `border-subtle`(10% 선), `border-strong`(26~30% 선)
  - 강조 `accent`, `accent-text`(작은 코랄 글자), `on-accent`
  - 본문 `prose`, `prose-strong`; 코드 `code-string`
  - 상태 `state-hover`, `state-current`, `state-selected`; 형광 띠 `marker`; 가림막 `scrim`
- 글꼴 토큰 `font-display`(Bricolage Grotesque), `font-sans`(Pretendard Variable), `font-serif`(마루 부리), `font-mono`(JetBrains Mono). 폴백은 시안 `styles.css`를 따른다.
- 반경 6·8·12·14px, 모션 이징 `cubic-bezier(.2,.7,.2,1)`과 지속 시간 160·300·320·420·450ms, 펼침 간격 34ms, 창 치수(제목 38·상태줄 24·활동 48·탐색기 272·탭 38·경로 32·미니맵 76·줄 번호 열 56/38/34·레일 28), 타이포 스케일(본문 18.5/17, 제목 54/34, 블로그 이름 최대 116, 행간 1.92/1.9. 제목은 구현 중 시안 IDE 글 화면 값으로 조정, 티켓 07)을 모두 토큰으로 둔다. 창 치수와 타이포 스케일은 "구현 중 조정 가능"으로 주석한다.
- 값 표기는 색 HEX, 투명도 `rgb(r g b / a)`, 길이 px. 두 테마 값은 시안 `ide.css`의 `:root`와 `[data-theme="light"]` 블록이 출처다.
- 테마는 `<html data-theme="dark|light">`로만 바꾼다. 속성이 없으면 어두운 테마. 첫 페인트 전 인라인 스크립트가 `localStorage` `theme` 키를 읽고, 없으면 `prefers-color-scheme`을 따라 속성을 붙인다. 속성은 Radix Portal 때문에 반드시 `html`에 둔다(ADR 0002).

### 2층: CSS

- 의미 토큰·글꼴·반경·이징만 `@theme inline`으로 Tailwind에 노출해 `bg-surface-panel`, `text-prose`, `font-display`, `rounded-…`, `ease-…` 유틸리티를 만든다. 원시 토큰은 노출하지 않는다. Tailwind 기본 색 팔레트는 `--color-*: initial`로 끈다.
- 다크 변형은 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- 글꼴은 전부 셀프호스팅한다. Pretendard는 패키지의 동적 서브셋 CSS, Bricolage와 JetBrains Mono는 fontsource 가변 woff2(라틴), 마루 부리는 KS X 1001 한글 2,350자 + 라틴 서브셋 woff2(Regular·Bold)를 한 번 만들어 `public/fonts/`에 OFL 전문과 함께 둔다. 서브셋 생성 명령은 `scripts/`에 남기되 빌드에 넣지 않는다. 2,350자 밖 글자는 시스템 명조로 떨어지는 것을 감수한다.
- 본문 타이포그래피(prose)와 IDE 틀의 공용 CSS는 2층의 `@layer components`에 둔다. 한 요소짜리 유틸리티가 필요하면 `@utility`.
- 소비자(`src/layouts`, `src/components`, `src/pages`)는 2층 진입점 하나만 import한다. 전역 CSS 파일은 그 import 한 줄로 줄인다. shadcn 설정의 CSS 진입점도 같은 파일을 가리킨다.

### 3층: React 컴포넌트

- 폴더는 컴포넌트마다 하나(`<Name>/<Name>.tsx`, `<Name>.stories.tsx`, 순수 로직이 있으면 `<Name>.test.ts`). 컴포넌트는 2층이 만든 유틸리티만 쓰고 원시 토큰 변수를 직접 참조하지 않는다. 클래스 합치기는 `@/lib/utils`의 `cn`.
- Provider 없이 동작한다(ADR 0002). Tooltip은 `TooltipProvider`를 컴포넌트 안에 내장한다. Sidebar 등 전역 Provider가 필요한 shadcn 컴포넌트는 들이지 않고 자체 구현한다.
- 상태 공유는 nanostores. 스토어는 "순수 로직(현재 상태와 입력 → 다음 상태)"과 "DOM·storage 바인딩"을 나눈 두 모듈로 둔다.
  - 테마 스토어: `atom<'dark'|'light'>`. 초기값은 `html[data-theme]`에서 읽는다. `setTheme`은 속성과 `localStorage`를 함께 바꾼다. 초기값 결정 규칙(저장값 → 시스템 설정 → dark)은 순수 함수.
  - 탭 스토어: `map`(키 = 글 URL, 값 = 제목·경로). `posts.log`는 항상 첫 탭이며 닫지 못한다. 추가는 중복 없이, 닫기는 활성 탭이었을 때 왼쪽 탭(없으면 `posts.log`)을 다음 활성 탭으로 돌려준다. `sessionStorage`에 거울처럼 저장한다.
- 원자 컴포넌트: `ThemeToggle`, `Button`·`IconButton`, `Badge`(태그·분류), `Tabs`(에디터 탭), `Tooltip`. shadcn CLI로 들여온 것은 토큰을 의미 토큰으로 바꾸고 `ui` alias를 `src/design-system/components`로 돌린다.
- 창 틀 컴포넌트 `Shell` 하나가 제목 표시줄·활동 막대·탐색기(트리 + 개요)·탭·상태줄을 모두 `position: fixed`로 그린다(ADR 0001). Astro 레이아웃이 `client:load`와 `transition:persist`로 올린다. 에디터 내용(흐름 로그, 글 본문, 경로 표시줄)은 아일랜드 밖 정적 HTML이고 창 치수 토큰만큼 여백을 둔다.
- 페이지 ↔ 창 틀 계약: 에디터 루트 요소가 `data-file` 묶음 속성(제목, 경로 `posts/2023/….mdx`, URL, 용량, 읽는 시간)과 개요용 제목 목록을 HTML에 적는다. `Shell`은 `astro:page-load`마다 이를 읽어 탭 추가·활성화, 개요 갱신, 상태줄 2초 요약을 수행한다. 탐색기 트리는 빌드 시 글 목록에서 만든 데이터를 props로 받는다.
- 읽기 진행(현재 줄 번호 코랄, 개요 세로선, 상태줄 `Ln N`·읽은 비율, 경로 표시줄의 현재 장·절)은 에디터 쪽 작은 스크립트가 `IntersectionObserver`로 계산해 nanostores `reading` 스토어에 쓰고 `Shell`이 구독한다.
- 화면 이동은 `<ClientRouter />`. 펼침은 에디터 루트에 `data-unfold`를 붙여 CSS 애니메이션(34ms 간격, 420ms)으로 하고 `prefers-reduced-motion`에서는 끈다.
- 반응형 1100px·760px·1180px·1280px 분기는 시안 표를 따른다. 미니맵과 출력 패널은 이번 범위 밖.

### 4층: Storybook

- `.storybook/main.ts`에 `@storybook/addon-docs`, `@storybook/addon-themes`를 추가하고 `stories`에 `**/*.mdx`를 넣는다. `preview.ts`에서 `withThemeByDataAttribute`(기본값이 `data-theme`·`html`)로 툴바 테마 전환.
- 토큰 문서는 `src/design-system/docs/*.mdx`에 `@storybook/addon-docs/blocks`의 `ColorPalette`·`Typeset`을 써서 색·글꼴·반경·모션·창 치수를 보여 준다. 색 견본은 CSS 변수를 런타임에 읽어 테마 툴바와 함께 바뀐다.
- 모든 컴포넌트 스토리는 두 테마에서 a11y 애드온을 통과한다.

### 폴더와 경계

```
src/design-system/
  tokens/      primitives.css · semantic.css(두 테마) · index.css        1층: 값만, 다른 층 import 금지
  styles/      fonts.css · base.css · motion.css · prose.css · ide.css · index.css   2층: @theme inline·@custom-variant·@layer components·@utility, 1층만 import
  stores/      theme.ts · tabs.ts · reading.ts (+ *.logic.ts, *.test.ts)   3층 공용 상태
  components/  <Name>/…                                                    3층: 2층 유틸리티만 사용
  docs/        Tokens.mdx 등                                               4층
  index.ts     컴포넌트·스토어 export
```

Astro 페이지·레이아웃·콘텐츠 컴포넌트는 소비자다. 소비자는 2층 진입점과 `index.ts`만 import한다.

### 문서 갱신

- DESIGN.md "미정 항목" 중 이번에 토큰으로 확정한 것(다크 팔레트, 글꼴, 반경, 모션)을 확정 절로 옮긴다. 시안 수치 표는 역사로 두고 고치지 않는다.
- CLAUDE.md Tech Stack에 nanostores와 디자인 시스템 폴더 포인터를 추가한다. 토큰 값은 CLAUDE.md에 적지 않고 토큰 파일을 가리킨다.

## Testing Decisions

좋은 테스트는 바깥에서 보이는 결과만 본다: 빌드된 HTML, 토큰 파일의 내용, 스토어의 다음 상태. 컴포넌트 내부 구조나 클래스 이름은 보지 않는다. 선례는 `src/utils/blog.test.ts`(Vitest node 환경, `vi.mock`).

1. **빌드 결과물**: Vitest가 `dist/`의 HTML을 읽는다. `dist/`가 없으면 건너뛴다(CI는 build 뒤 test). 검사: `/blog/pro-developer-2023-days/`·태그·404 경로 존재, 모든 페이지에 테마 초기 스크립트와 에디터 `data-file` 속성, `.dark` 클래스와 `fonts.googleapis.com` 없음, 글꼴 참조가 로컬 경로.
2. **토큰 파일**: 토큰 CSS를 텍스트로 파싱한다. 두 테마의 의미 토큰 이름 집합 일치, 의미 토큰 값은 전부 원시 토큰 참조(리터럴 금지), 글자/바탕 쌍의 명암비가 본문 4.5:1·보조 글자 3:1 이상(두 테마 모두, 쌍 목록은 테스트가 가진다).
3. **스토어 순수 로직**: 탭 추가·중복·닫기 뒤 활성 탭, `posts.log` 닫기 거부, 테마 초기값 규칙, 읽기 진행 비율 계산.
4. **컴포넌트**: Vitest DOM 테스트 없음(jsdom 재도입 안 함, Playwright 기반 애드온 금지). 스토리 + a11y 애드온 + `pnpm build-storybook`이 자동 검사. 두 테마 화면은 마지막 티켓이 ego-browser로 확인하고 Orca 탭으로 연다.

## Out of Scope

- 미니맵(1280px 이상)과 출력 패널(파일 열기 전체 기록). 후속 스펙.
- 디자인 시스템의 패키지 분리. 쓰는 프로젝트가 둘이 될 때(ADR 0002).
- 컴포넌트 토큰(3단계).
- 명령 팔레트, 창 분할, 전역 단축키 등 ADR 0001이 "다시 검토" 조건으로 둔 IDE 기능.
- 글 원본 MDX와 콘텐츠 스키마 변경, 글 URL 변경.
- 마루 부리 2,350자 밖 글자의 서브셋 확장.

## Further Notes

- 완료 기준(티켓마다): `PATH=$HOME/.volta/bin:$PATH CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과. 셸의 node는 Volta보다 `~/.local/bin/node`가 앞서므로 명령마다 Volta 경로를 앞세운다.
- 새 라이브러리는 위 목록 밖이면 사용자와 논의 뒤 추가한다(CLAUDE.md).
- 용어는 `GLOSSARY.md`를 따른다. 특히 다크 모드 → 어두운 테마, 사이드바 → 탐색기, 변수 → 토큰.
