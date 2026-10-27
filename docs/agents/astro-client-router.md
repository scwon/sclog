# Astro 화면 이동과 아일랜드 스크립트의 함정

화면 이동(`<ClientRouter />`), 창 틀 아일랜드(`transition:persist`), 페이지 스크립트를 고칠 때 읽는다. 설정 파일에는 드러나지 않고 디버깅으로 알아낸 것들이다. 구조 결정은 ADR 0001, 계약은 `src/layouts/BaseLayout.astro` 머리 주석에 있다.

## 이벤트 순서

화면을 옮기면 `astro:before-swap`(새 문서가 준비됐고 아직 바꾸기 전) → `astro:after-swap`(DOM 교체 직후) → `astro:page-load`(새 화면 준비 끝) 순서로 온다. 첫 로드에는 `page-load`만 온다.

- `<html>`의 속성(`data-theme`, `data-panel`)은 새 문서 것으로 바뀐다. 이어 가야 하는 속성은 `before-swap`에서 `event.newDocument.documentElement`에 옮긴다. BaseLayout의 인라인 테마 스크립트가 이 일을 하고, 리스너가 화면마다 쌓이지 않게 `window.sclogThemeCarry`로 한 번만 등록한다.
- 이전 화면의 상태를 비우는 일은 `after-swap`, 새 화면의 상태를 채우는 일은 `page-load`에 둔다. 둘을 한 이벤트에 두면 비우기와 채우기가 경쟁한다(읽기 위치 `resetReading`이 이렇게 나뉘어 있다).

## 스크립트는 한 번만 실행된다

- 번들되는 `<script>`(기본값)는 사이트 전체에서 한 번만 실행된다. 화면을 옮긴 뒤 새로 생긴 요소에 직접 붙인 리스너는 없으므로, 클릭 같은 이벤트는 `document`에 위임하고 `event.target.closest(…)`로 고른다(`FlowLog.astro`, `Shell.tsx`).
- 화면마다 다시 해야 하는 초기화는 `document.addEventListener('astro:page-load', …)`에 둔다. scroll·IntersectionObserver처럼 화면에 묶인 것은 `before-swap`에서 해제한다(`BlogPost.astro`).
- 작은 스크립트는 HTML에 인라인되므로 빌드 결과물 테스트는 외부 파일이 아니라 HTML 안의 스크립트를 본다.
- `</html>` 뒤에 둔 `<script>`는 빌드에서 사라진다. `<body>` 안에 둔다.

## 본문 위에 겹치는 층

- `.doc-prose`의 직계 자식은 줄 번호(`ide.css`), 읽는 위치 블록(`BlogPost.astro`), 펼침 대상(`BaseLayout.astro`의 `TARGETS`), 검색 색인 단위(`src/utils/search-index.ts`)로 세어진다. 본문 위에 그리는 층·포털·`<script>`는 본문 안에 넣지 않고 `article.doc[data-doc]` 아래에 둔다(선택 툴바가 이렇게 한다).

## 처음 쓸 때 불러오는 청크

- 동적 `import()`는 디자인 시스템 안에 둔다: 컴포넌트는 `lazy(() => import('./X'))`(`Shell.tsx`의 팔레트·찾기 줄, `ToastHost.tsx`), 페이지 스크립트가 부르는 어댑터는 모듈 안의 `import('./X')`(`SelectionToolbar/selection.ts`). 작은 페이지 스크립트는 HTML에 인라인되므로 거기에 `import()`를 쓰면 청크 이름이 HTML에 들어가 빌드 결과물 테스트(`*-chunk.test.ts`)가 실패한다.
- 청크로 뺄 컴포넌트는 `index.ts`에서 내보내지 않는다. 내보내면 첫 화면 청크(`design-system.*.js`)에 정적으로 묶인다(Popover를 내보냈을 때 19KB 늘었다).
- 새 청크는 `src/test/build-output/<이름>-chunk.test.ts`로 "페이지가 불러오지 않고 동적 import로만 불린다"를 확인한다.

## 서버 렌더링(SSR)

- nanostores의 `store.get()`은 서버에서도 `onMount`를 부른다. `onMount` 안에서 DOM을 쓰면 `typeof document === 'undefined'`로 막는다(`stores/theme.ts`).
- 서버 HTML은 세션 상태(sessionStorage의 탭, localStorage의 테마)를 모른다. React 아일랜드는 `useStore(store, { ssr: () => 서버 스냅샷 })`으로 서버와 첫 하이드레이션이 같은 값을 그리게 하고, 그 뒤 실제 상태로 다시 그린다(`Tabs.tsx`, `Shell.tsx`).

## HTML 공백

Astro 7 기본값 `compressHTML: 'jsx'`는 인라인 요소 사이 공백을 지운다. 보여야 하는 공백은 요소 안에 넣는다(frontmatter의 `<span class="doc-fm-punct">: </span>`). 배경은 `docs/research/astro-7-upgrade.md`.
