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

## 서버 렌더링(SSR)

- nanostores의 `store.get()`은 서버에서도 `onMount`를 부른다. `onMount` 안에서 DOM을 쓰면 `typeof document === 'undefined'`로 막는다(`stores/theme.ts`).
- 서버 HTML은 세션 상태(sessionStorage의 탭, localStorage의 테마)를 모른다. React 아일랜드는 `useStore(store, { ssr: () => 서버 스냅샷 })`으로 서버와 첫 하이드레이션이 같은 값을 그리게 하고, 그 뒤 실제 상태로 다시 그린다(`Tabs.tsx`, `Shell.tsx`).

## HTML 공백

Astro 7 기본값 `compressHTML: 'jsx'`는 인라인 요소 사이 공백을 지운다. 보여야 하는 공백은 요소 안에 넣는다(frontmatter의 `<span class="doc-fm-punct">: </span>`). 배경은 `docs/research/astro-7-upgrade.md`.
