# 05: 창 틀 `Shell`을 올리고 모든 페이지를 IDE 창 안으로 옮긴다

**What to build:** 홈·글·태그·404 모든 주소가 전체 화면 IDE 창(제목 표시줄·활동 막대·탐색기 트리·탭·경로 표시줄·코랄 상태줄)으로 열리고, 링크로 이동할 때 창 틀은 그대로 남고 에디터 내용만 바뀐다. 글을 열면 탭이 추가되고 상태줄에 2초 열기 요약이 나온다. 에디터 안의 내용은 아직 옛 마크업이어도 된다(06·07이 바꾼다).

**Blocked by:** 02 (글꼴), 03 (테마 스토어·원자), 04 (탭 스토어·Tabs)

**Status:** done

참고: 스펙 "3층" `Shell`·페이지 ↔ 창 틀 계약·반응형, ADR 0001(아일랜드 하나, `transition:persist`), DESIGN.md "전체 화면 IDE와 파일 열기 로그" 표(창 치수·반응형·탭·파일 열기 로그), 시안 `ide.css` title bar/activity bar/sidebar/status bar/responsive 절, `app.js` 라우터·탐색기·상태줄 부분.

- [x] `Shell` 컴포넌트가 제목 표시줄(블로그 이름의 코랄 아포스트로피, 창 제목, 원성철, GitHub, `ThemeToggle`)·활동 막대·탐색기(글 트리 `posts/<연도>/<파일>.mdx`, 글 페이지에서는 그 아래 개요 영역)·`Tabs`·상태줄을 `position: fixed`로 그린다. 모든 치수는 창 치수 토큰에서 온다
- [x] 레이아웃이 `<ClientRouter />`를 쓰고 `Shell`을 `client:load transition:persist`로 올린다. 에디터 내용은 아일랜드 밖 정적 HTML이며 창 치수 토큰만큼 여백을 둬 고정 요소와 겹치지 않는다
- [x] 에디터 루트가 `data-file-*` 속성(제목, 경로, URL, 용량, 읽는 시간)을 갖고, `Shell`은 `astro:page-load`마다 이를 읽어 탭 스토어에 추가·활성화하고 상태줄에 `❯ open <경로>` → `✓ 열림 · <용량> · 읽는 시간 <N>분`을 약 2초 보인 뒤 원래 상태로 돌아간다. 홈은 `posts.log`가 활성
- [x] 탐색기 트리 데이터는 빌드 시 글 컬렉션에서 만들어 props로 넘긴다. 현재 글은 트리에서 강조된다
- [x] 1100px 미만: 탐색기는 활동 막대 버튼으로 여는 겹침 패널(가림막 포함, Esc로 닫힘). 760px 미만: 활동 막대 대신 제목 표시줄 메뉴로 여는 서랍, 경로 표시줄에 `개요` 버튼
- [x] 태그 페이지와 404도 같은 창 안 에디터로 열리고 탭 제목이 각각 `tags/…`, `404`다. 글 페이지의 댓글 등 기존 기능은 에디터 안에 그대로 있다
- [x] 키보드만으로 창 틀의 모든 버튼·탭·링크에 닿고 포커스 외곽선이 보인다. 건너뛰기 링크가 에디터로 간다
- [x] 빌드 결과물 테스트에 "모든 HTML에 `data-file-url`이 있고 그 값이 파일 경로와 일치, 글 URL 변경 없음" 검사가 추가된다
- [x] `Shell` 스토리(홈 상태·글 열림 상태)가 두 테마에서 a11y 위반 없이 렌더링된다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 구현 (브랜치 `design-system`)

**결정**

- `Shell`(디자인 시스템 3층, `components/Shell/`)은 아일랜드 하나다. 제목 표시줄·활동 막대·탐색기·탭·상태줄을 모두 `position: fixed`로 그린다. 레이아웃이 `<Shell client:load transition:persist="shell" />`로 올리고, `<html transition:animate="none">`로 페이지 전체 교차 페이드를 끈다(펼침은 티켓 07).
- 페이지 ↔ 창 틀 계약
  - 에디터 루트 `<main id="editor" class="ide-editor">`의 `data-file-title`·`-path`·`-url`·`-kind`(log·post·page)·`-size`(원본 바이트)·`-reading`(분)·`-summary`, 그리고 글의 개요 `<script type="application/json" id="editor-outline">`이 계약이다.
  - 읽기·요약 로직은 순수 함수 `stores/file.logic.ts`(`parseEditorFile`, `formatSize`, `openLog`)에 두었다. 테스트는 `stores/file.test.ts` 7개다.
  - `Shell`은 처음 하이드레이션 때와 `astro:page-load`마다 이를 읽어 탭을 열고 활성화한다. 상태줄에는 `❯ open <경로>`을 0.45초, 이어서 `✓ 열림 · <용량> · 읽는 시간 <N>분`을 보이다가 2.2초에 원래 상태로 돌아간다(시안 타이밍, 움직임 줄이기에서는 바로 결과). 두 번 불리면 0.5초 안의 같은 URL은 한 번만 처리한다.
- 경로: 글 `posts/<연도>/<slug>.mdx`, 홈 `posts.log`, 글 목록 `posts/`, 태그 목록 `tags/`, 태그 `tags/<태그>`, 404 `404`(`data-file-url="/404"`).
  - 탭 제목은 글이면 파일 이름만, 나머지는 경로 그대로다(티켓 04의 `Tabs` 규칙을 고침).
  - 글 URL은 그대로 `/blog/<slug>/`다.
- 탐색기 트리는 빌드 시 `src/utils/ide.ts`의 `buildTree`가 글 컬렉션에서 연도별로 만들어 props로 넘긴다. 현재 글은 선택 바탕과 코랄 왼선으로 강조한다. 글의 개요는 `buildOutline`이 `headings`의 가장 얕은 단계를 장, 그 아래 단계를 절로 만든다.
- 반응형 탐색기
  - 상태는 `auto | open | closed`이고, 그 상태를 정한 화면 폭(1100px 경계)과 함께 둔다. 경계를 넘으면 다시 `auto`(화면 폭에 맡김)가 된다.
  - 1100px 이상에서는 보이고 활동 막대 버튼으로 닫는다. 1100px 미만에서는 버튼으로 여는 겹침 패널이고 가림막과 Esc로 닫는다. 760px 미만에서는 활동 막대 대신 제목 표시줄 메뉴로 여는 서랍이고, 글 페이지의 경로 표시줄 `개요` 버튼(`data-explorer-toggle`)도 연다.
  - 패널을 열면 패널로 포커스를 옮기고, 닫으면 연 버튼으로 돌려준다.
  - 상태는 `<html data-explorer>`로 알린다. 2층 `styles/ide.css`의 `--editor-left`가 에디터 여백과 탭 위치를 맞춘다. 화면 이동으로 `<html>` 속성이 바뀌므로 `astro:before-swap`에서 새 문서로 옮겨 붙인다.
- 테마도 같은 이유로 `<head>` 인라인 스크립트가 `astro:before-swap`에서 지금 테마를 새 문서로 옮긴다(Astro 문서 권장 방식). 빌드 결과물 테스트에 그 검사를 하나 더했다.
- 활성 탭을 닫았을 때의 이동은 숨긴 `<a>`를 눌러 처리한다. `<ClientRouter />`가 있으면 클라이언트 이동이 되고, 없으면 보통 이동이 된다. 디자인 시스템이 Astro를 import하지 않게 하기 위해서다.
- 서버 렌더링: nanostores는 서버에서도 `get()` 때 스토어를 잠깐 마운트한다. 그래서 테마 스토어의 `onMount`는 DOM이 없으면 아무것도 하지 않게 했다(빌드가 `MutationObserver is not defined`로 멈췄던 문제). 화면 폭은 `useSyncExternalStore`로 읽고, 서버 스냅샷은 넓은 화면이다.
- 시안의 출력 패널·미니맵은 스펙대로 범위 밖이라 상태줄에 `출력` 버튼을 두지 않았다.
- 옛 `Header`·`TableOfContents`·`ProgressBar`·`ScrollToTop`은 지웠다. 홈·목록·태그·404·글의 에디터 안 내용은 아직 옛 마크업이다(티켓 06·07).

**확인**

- 빌드 결과물 테스트 추가
  - 모든 HTML의 에디터 루트 `data-file-url`이 그 파일의 URL과 같다.
  - 글 원본(`src/content/blog/*.mdx`)마다 `/blog/<slug>/index.html`이 있다.
  - 화면 이동 직전에 테마를 새 문서로 옮긴다.
- ego-browser(1440·1024·390px)
  - 탐색기에서 글을 열면 탭 추가, 개요 표시, 상태줄 요약 순서가 맞다.
  - 활성 탭을 닫으면 `posts.log`로 이동한다.
  - 데스크톱에서 탐색기를 닫으면 에디터 여백이 활동 막대만큼 줄고, 화면을 옮겨도 닫힌 채 유지된다.
  - 1024px 겹침 패널과 390px 서랍은 Esc로 닫히고 포커스가 돌아온다.
  - 키보드 Tab 순서: 건너뛰기 → 블로그 이름 → GitHub → 테마 → 탐색기 → 소스 → 트리 → 개요 → 탭 → 에디터. 모두 외곽선이 보이고, 건너뛰기 링크는 `#editor`로 간다.
- 접근성: axe-core 4.14.0으로 `Shell` 스토리 2개(페이지 단위 규칙 제외)와 사이트 네 화면(`/`, 글, 태그, 404, 모든 규칙)을 두 테마에서 검사했고 위반 0건이다.
- 테스트 103개 통과. `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.
- 코드 리뷰는 05~07이 서로 이어진 작업이라 07을 마친 뒤 세 티켓 변경분에 한 번 돌린다.
