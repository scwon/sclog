# 움직임 디테일과 ClientRouter의 View Transitions

- 작성일: 2026-10-26
- 질문: Astro 7 `<ClientRouter />`는 화면 이동에 View Transitions를 쓴다. 이와 부딪히지 않고 다음 움직임을 만들 수 있는가, 있다면 어떻게 만드는가. (1) 페이지 사이 에디터 내용 전환과 기존 펼침(`data-unfold`)의 관계, (2) 테마 전환 버튼에서 새 색이 원형으로 번지는 효과와 라우터 이동·`suppressThemeTransitions`의 상호작용, (3) React 아일랜드(`Tabs`) 안에서 탭을 닫을 때 접히는 퇴장 애니메이션, (4) 공통: 2026-10 기준 브라우저 지원, 미지원 시 대체 동작, `prefers-reduced-motion` 처리.
- 조사 범위: Astro 공식 문서(v7, `astro-docs` MCP), 설치된 `astro@7.4.2` 소스(`node_modules/astro/dist/transitions/router.js`, `swap-functions.js`, `dist/runtime/server/transition.js`, `components/viewtransitions.css`), 로컬 빌드 결과물(`dist/`의 HTML), CSS View Transitions Level 1 편집자 초안, Chrome for Developers 문서, MDN, MDN browser-compat-data 8.1.7(2026-10-22 생성)과 web-features 3.44.0의 Baseline 값, react.dev(19.3 블로그·`<ViewTransition>`·`useSyncExternalStore` 문서), 설치된 `@nanostores/react` 소스. 브라우저에서 애니메이션 시간을 재지 않았다. 추측은 "미확인/불확실"에 따로 모았다.
- 조사 시점의 버전: astro 7.4.2, react·react-dom 19.3.1(`ViewTransition`·`addTransitionType`를 내보냄).
- 이 저장소의 현재 상태: `BaseLayout.astro`의 `<html transition:animate="none">`이 모든 화면 이동 애니메이션을 끄고 에디터 내용의 등장은 `astro:page-load`에서 시작하는 펼침(`motion.css`의 `[data-unfold] [data-unfold-item]`)이 맡는다. 테마는 `stores/theme.ts`의 `applyTheme`이 `suppressThemeTransitions()`(두 프레임 동안 `[data-theme-switching]`로 CSS transition 끄기) 뒤에 `data-theme`을 바꾼다. 탭은 nanostores `map`에 있고 `Tabs.tsx`가 `useStore`로 그리며 닫으면 `closeTab()`이 바로 항목을 지우고 활성 탭이었다면 `navigateLikeLink()`로 라우터 이동을 시작한다.

## 결론 요약

1. **세 가지 모두 만들 수 있다. 다만 문서 단위 View Transition은 한 번에 하나만 돌기 때문에 라우터와 같은 통로를 쓰는 움직임은 서로를 끊는다.** 새 `document.startViewTransition()`은 진행 중인 전환을 건너뛰게(skip) 한다. 그래도 DOM 갱신 콜백은 반드시 실행되므로 상태(테마 값, 새 페이지)는 깨지지 않고 애니메이션만 끝으로 건너뛴다. Astro 라우터도 이동마다 `document.startViewTransition`을 부른다.
2. **에디터 내용 전환: 가능하다. 다만 새 쪽(new)에 VT 애니메이션을 더하면 펼침과 겹친다.** 펼침은 `astro:page-load`에서 시작하는데 이 이벤트는 라우터 VT의 DOM 갱신이 끝난 직후, 즉 VT 애니메이션이 막 시작될 때 온다. 들어오는 쪽은 펼침에 맡기고 원하면 나가는 쪽(old)만 짧게 사라지게 하는 역할 분담을 권한다. `transition:animate`로 만들 수 있지만 에디터처럼 스크롤되는 큰 요소에 이름을 붙이면 group의 위치·크기 보간이 끼어드는 위험이 있다.
3. **테마 원형 번짐: 가능하다. 별도 `document.startViewTransition`으로 만들고 시간·이징 토큰을 쓰려면 Web Animations API 대신 CSS 키프레임으로 그린다.** 지금 `<html>`의 view-transition-name은 `root`가 아니라 해시 이름(`astro-nfpogox7-1`)이라 흔한 예제의 `::view-transition-new(root)`가 맞지 않는다. `transition:name="root"`를 함께 주고, Astro가 `@layer astro`에 넣는 "old 숨김·애니메이션 없음" 규칙을 이기도록 덮어쓰는 규칙은 레이어 밖에 둔다. 라우터 전환이 진행 중이면 번짐 없이 바로 바꾼다. `suppressThemeTransitions`는 갱신 콜백 안에서 그대로 부르면 된다.
4. **탭 접힘: 가능하다. 다만 순수 CSS만으로는 안 되고 VT도 맞지 않는다. "닫는 중" 상태를 JS로 두고 CSS 애니메이션으로 접은 뒤 `animationend`에서 실제로 지우는 방식을 권한다.** `@starting-style`은 등장 전용이고 `transition-behavior: allow-discrete`는 요소가 DOM에 남아 `display: none`으로 바뀔 때만 퇴장을 그린다(Firefox는 `display` 전환을 지원하지 않는다). React가 지우는 노드는 CSS로 붙잡을 수 없다. React 19.3의 `<ViewTransition>`은 안정판이지만 nanostores(`useSyncExternalStore`) 갱신은 Transition이 될 수 없어 발동하지 않는다. 문서 VT로 만들면 활성 탭을 닫을 때 바로 이어지는 라우터 VT가 접힘을 끊는다.
5. **지원과 대체 동작: 같은 문서 View Transitions는 2025-10-14에 Baseline(새로 사용 가능)이 됐다**(Chrome 111, Firefox 144, Safari 18). 다만 `startViewTransition({ update, types })` 객체 형식과 `:active-view-transition-type()`은 Firefox 147부터라서 타입 대신 `<html>` 데이터 속성으로 구분하는 쪽이 범위가 넓다. 미지원 브라우저에서는 바로 바꾸면 된다. 움직임 줄이기 설정에서는 Astro가 모든 `::view-transition-*` 애니메이션을 `!important`로 끄지만, Web Animations API와 `animationend`에 기대는 JS 흐름은 직접 막는다.

## 0. 라우터가 View Transition을 다루는 방식 (설치된 7.4.2 기준)

| 사실 | 근거 |
| --- | --- |
| 이동할 때마다 다음 페이지를 먼저 가져오고 그 뒤 `document.startViewTransition(async () => await updateDOM(...))`을 부른다. 콜백 안에서 `<head>`·`<body>` 교체, `transition:persist` 요소 이동, `astro:after-swap`이 일어난다. | [Client-side navigation process](https://docs.astro.build/en/guides/view-transitions/#client-side-navigation-process), `router.js` 373행 |
| 새 이동을 시작할 때 직전 이동의 `viewTransition.skipTransition()`을 부르고 `updateCallbackDone`을 기다린다. | `router.js` `abortAndRecreateMostRecentTransition()`(348–363행) |
| `astro:page-load`는 VT가 끝날 때가 아니라 `updateCallbackDone`이 정해질 때(`runScripts()` → `onPageLoad()`) 온다. 애니메이션은 그 직후부터 돈다. | `router.js` 412–416행. 문서 주석: "Scripts that depend on the view transition pseudo elements should hook on viewTransition.ready" |
| `astro:before-swap` 이벤트는 그 이동의 `viewTransition` 객체를 준다. | [viewTransition 속성](https://docs.astro.build/en/reference/modules/astro-transitions/#viewtransition) |
| VT 미지원 브라우저에서는 `fallback`(기본 `animate`)에 따라 `data-astro-transition-fallback` 속성으로 흉내 내거나(`animate`), 바로 바꾸거나(`swap`), 전체 페이지 이동을 한다(`none`). | [Fallback control](https://docs.astro.build/en/guides/view-transitions/#fallback-control), `router.js` 374–410행 |
| `transition:animate="none"`(이름 없이 `<html>`에)은 `<html>`에 `data-astro-transition-scope="astro-<해시>-1"`과 `view-transition-name: astro-<해시>-1`을 주고 `@layer astro` 안에 `::view-transition-old(이름) { animation: none; opacity: 0 }`, `::view-transition-new(이름) { animation: none }`, `::view-transition-group(이름) { animation: none }`을 만든다. 로컬 빌드에서 이름은 모든 페이지가 `astro-nfpogox7-1`이었다. 이 해시는 레이아웃 파일이 바뀌면 달라질 수 있다. | `dist/runtime/server/transition.js` `renderTransition()`·`ViewTransitionStyleSheet`; `dist/index.html` 등의 `<html data-astro-transition-scope="astro-nfpogox7-1">` |
| 이 `<style>`은 `<head>`에서 전역 CSS `<link>`보다 뒤에 오므로 `astro` 레이어가 Tailwind 레이어(`properties`·`theme`·`base`·`components`·`utilities`)보다 나중에 선언된다. 그래서 `@layer components`에 둔 규칙은 Astro 규칙을 이기지 못하고 레이어 밖 규칙만 이긴다. | 로컬 빌드 `dist/blog/pro-developer-2023-days/index.html`의 `<head>` 순서, `dist/_astro/BaseLayout.*.css`의 레이어 순서; [CSS cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) |
| 움직임 줄이기 설정에서는 `@media (prefers-reduced-motion) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important } [data-astro-transition-scope] { animation: none !important } }`가 적용된다. 이 CSS는 전역이라 라우터 이동이 아닌 VT에도 적용된다. | `components/viewtransitions.css`; [prefers-reduced-motion](https://docs.astro.build/en/guides/view-transitions/#prefers-reduced-motion) |
| `transition:persist` 요소는 `moveBefore()`가 있으면(Chrome 133+, Firefox 144+) 그것으로, 없으면(Safari) `appendChild`로 옮긴다. 문서는 "The restart of CSS animations ... cannot be avoided during view transitions even when using `transition:persist`"라고 적는다. | `swap-functions.js` `swapBodyElement()`; [Maintaining State](https://docs.astro.build/en/guides/view-transitions/#maintaining-state); BCD `api.Element.moveBefore` |

### View Transition 공통 규칙 (명세·Chrome 문서)

- "Starts a new view transition (canceling the document's existing active view transition, if any)." 메서드 단계 5: "If document's active view transition is not null, then skip that view transition with an "AbortError" DOMException". 출처: [CSS View Transitions 1 — startViewTransition()](https://drafts.csswg.org/css-view-transitions-1/).
- 건너뛰어도 갱신 콜백은 실행된다: "updateCallback, if provided, is always called, even if the transition cannot happen", "This never prevents updateCallback being called, as the DOM change is independent of the transition." 같은 출처.
- "Only one view transition is allowed to run at a time. If a new view transition starts while one is already running, the old transition skips to the end." 출처: [Same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document).
- 애니메이션 단계에서 캡처된 요소는 그려지지 않고 hit-test에도 응답하지 않는다("as if they had pointer-events: none"). 갱신 콜백을 기다리는 동안(rendering suppression)에는 모든 포인터 hit-test가 문서 요소로 간다. `<html>` 전체가 캡처되므로 VT가 도는 동안 페이지 링크·버튼은 눌리지 않는다. 출처: 명세 §4.2, §7.1.1.
- 기본 UA 스타일은 `:root { view-transition-name: root; }`이고 기본 교차 페이드는 0.25초다. 출처: 명세 §5.

## 1. 에디터 내용 전환과 펼침

### 겹치는 지점

- 지금은 `<html transition:animate="none">` 덕분에 라우터 VT가 "옛 화면 정지 → 새 화면 즉시"로만 동작하고 눈에 보이는 전환은 펼침뿐이다.
- 펼침은 `astro:page-load`에서 시작한다(`BaseLayout.astro`의 `unfold()`). 위 표대로 이 이벤트는 VT의 `updateCallbackDone` 직후, 애니메이션 시작과 거의 같은 때에 온다. `::view-transition-new()`는 새 상태를 실시간으로 그리는 이미지라서 펼침은 VT 도중에도 보인다.
- 따라서 에디터에 `transition:name` + `transition:animate="fade"`(또는 `slide`)를 주면, 새 쪽 이미지 전체의 투명도·위치 애니메이션 안에서 줄 단위 펼침이 동시에 돈다. 같은 내용에 들어오는 움직임이 두 번 겹친다. 기술적인 충돌(오류·끊김)은 아니지만 DESIGN.md의 펼침(위→아래 잘라내기 + 6px 이동)이 의도한 모양과 어긋난다.

### `transition:name` / `transition:animate`로 할 수 있는 것과 위험

- Astro 문서의 예시는 바로 이 구조다: `<html transition:name="root" transition:animate="none">`로 페이지 기본값을 끄고 `<main transition:animate="slide">`처럼 한 요소만 움직인다. 출처: [Built-in Animation Directives](https://docs.astro.build/en/guides/view-transitions/#built-in-animation-directives).
- 사용자 정의 애니메이션은 frontmatter의 `{ forwards: { old, new }, backwards: { old, new } }` 객체로 주고 각 항목에 `name`·`duration`·`easing`·`fillMode`를 둔다. 출처: [Customizing Animations](https://docs.astro.build/en/guides/view-transitions/#customizing-animations). Astro는 이 값을 `animation-duration: …` 같은 선언으로 그대로 옮기므로(`stringifyAnimation()`) `duration: 'var(--motion-fast)'`처럼 토큰을 문자열로 넘길 수 있다. 다만 old/new 이미지 애니메이션만 정하고 group 애니메이션은 UA 기본값(위치·크기 보간)으로 남는다.
- **위험: 스크롤되는 에디터.** `#editor`는 글 전체 높이를 가진 큰 요소이고 문서가 스크롤된다. 옛 페이지에서 스크롤한 상태로 이동하면 옛 상자와 새 상자(라우터가 맨 위로 스크롤)의 위치가 크게 다르다. 그러면 UA 기본 group 애니메이션이 그 차이만큼 이미지를 미끄러뜨린다. `::view-transition-group(editor) { animation: none }`으로 막아도, old 이미지는 group 위쪽에 맞춰 놓이므로 스크롤했던 위치가 아니라 옛 글의 머리 부분이 잠깐 보일 수 있다. 큰 요소의 스냅숏을 브라우저가 어디까지 잘라 담는지는 명세가 UA에 맡기는 부분이라 확인하지 못했다("미확인" 참고).

### 권장안

- **들어오는 쪽은 펼침이 맡는다.** 새 쪽에는 VT 애니메이션을 두지 않는다(`new`는 `animation: none`).
- **나가는 쪽을 부드럽게 하고 싶을 때만** 옛 화면이 `--motion-fast` 동안 사라지게 한다. 에디터에 이름을 붙이기보다 이미 캡처되는 `root`의 old 이미지에 짧은 페이드아웃을 주는 편이 위 스크롤 위험을 피한다. 창 틀은 옛·새 화면에서 픽셀이 거의 같아 겹쳐도 거의 티가 나지 않는다. 기본 순서에서는 new 이미지가 old 위에 그려지므로, old가 보이게 하려면 old에 `z-index`를 주거나 new를 함께 다룬다. 어느 쪽이 나은지는 시안에서 본다.
- 규칙은 `motion.css`의 **레이어 밖**에 `::view-transition-old(root)`로 쓰고 `<html>`에 `transition:name="root"`를 더해 이름을 고정한다(해시 이름은 레이아웃이 바뀌면 달라진다). Astro의 움직임 줄이기 규칙이 `!important`로 이 애니메이션도 끈다.
- 첫 로드(라우터 이동 없음)에는 VT가 없으므로 지금처럼 펼침만 보인다.
- 펼침 대상에 `[data-doc] .doc-prose > *`(글 본문 블록)가 들어 있다. "글 본문에는 움직임을 두지 않는다"는 제약과 맞는지는 이 조사와 별개로 확인할 일이다. 지금은 "페이지 전환"의 일부로 보고 있는 것으로 읽힌다.

## 2. 테마 원형 번짐

### 만드는 방법

Chrome 문서의 원형 번짐 예제는 클릭 좌표에서 가장 먼 모서리까지의 반지름을 `Math.hypot`으로 구하고 `transition.ready` 뒤에 `document.documentElement.animate({ clipPath: [circle(0 at x y), circle(r at x y)] }, { pseudoElement: '::view-transition-new(root)' })`를 부른다. 출처: [Same-document view transitions — JavaScript animations](https://developer.chrome.com/docs/web-platform/view-transitions/same-document).

이 저장소에서는 다음 세 가지를 바꿔 적용해야 한다.

1. **이름이 `root`가 아니다.** `<html>`의 view-transition-name은 Astro가 준 해시 이름이라 `::view-transition-new(root)`가 아무것도 고르지 않는다. `<html transition:name="root" transition:animate="none">`으로 이름을 고정한다(Astro 문서 예시와 같은 형태).
2. **Astro의 `none` 규칙을 덮어써야 한다.** `@layer astro`에 `::view-transition-old(root) { opacity: 0 }`이 있어서 그대로면 원 밖이 옛 테마가 아니라 빈 화면이 된다. 테마 전환일 때만 old를 보이게(`opacity: 1`) 하고 new에 원형 잘라내기를 거는 규칙을 레이어 밖에 둔다.
3. **토큰을 쓰려면 CSS 키프레임으로 그린다.** Web Animations API의 `duration`은 숫자(ms)라서 `var(--motion-slow)`를 쓸 수 없고, Astro의 움직임 줄이기 규칙(`animation: none !important`)은 CSS 애니메이션만 끄고 WAAPI 애니메이션은 끄지 못한다. 클릭 좌표와 반지름을 `<html>`의 사용자 정의 속성(예: `--reveal-x`, `--reveal-y`, `--reveal-r`)으로 넘긴다. 그러면 `animation: theme-reveal var(--motion-slow) var(--motion-easing)`와 `clip-path: circle(0 at var(--reveal-x) var(--reveal-y))` → `circle(var(--reveal-r) at …)` 키프레임으로 그릴 수 있다. `::view-transition` 의사 요소의 원본 요소(originating element)는 문서 요소이므로(명세 §3.2.2) `:root`의 사용자 정의 속성을 상속받는다.

흐름(의사 코드):

```ts
// ThemeToggle의 onClick에서 버튼 중심 좌표를 넘긴다.
function toggleThemeFrom(x: number, y: number) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const busy = document.activeViewTransition != null || routerNavigating; // 아래 "라우터와 겹칠 때"
  if (!document.startViewTransition || reduce || busy) return toggleTheme(); // 바로 바꾼다
  const root = document.documentElement;
  root.style.setProperty('--reveal-x', `${x}px`); /* y, r도 같은 식 */
  root.dataset.themeReveal = '';                    // CSS가 이 속성으로 번짐 규칙을 켠다
  const t = document.startViewTransition(() => toggleTheme()); // 콜백 형식: Firefox 144+
  t.ready.catch(() => {});                          // 건너뛰면 ready가 AbortError로 거부된다
  t.finished.finally(() => { delete root.dataset.themeReveal; /* 사용자 정의 속성 정리 */ });
}
```

- 구분자로 `types: ['theme']` + `:active-view-transition-type(theme)`도 쓸 수 있지만 객체 형식 인자와 타입 선택자는 Firefox 147부터다. Firefox 144–146에서 객체를 넘기면 콜백 자리에 객체가 들어가 오류가 날 수 있으므로(미확인), 데이터 속성이 지원 범위가 더 넓다.
- `toggleTheme()`은 `nanostores` → `applyTheme()` → `suppressThemeTransitions()` 순서를 그대로 탄다. 갱신 콜백은 옛 화면을 캡처한 뒤 실행되고 새 이미지는 실시간 DOM이다. 그래서 `data-theme`과 `data-theme-switching`이 같은 작업 안에서 붙어야 호버 transition이 새 이미지 안에서 옛 색을 거쳐 번지지 않는다. 지금 구현이 이미 그렇게 하므로 **바꿀 것이 없다.** `[data-theme-switching]`이 두 프레임 뒤에 걷혀도 그때는 속성 값이 바뀌지 않으므로 transition이 새로 시작되지 않는다.
- 번짐 시간 동안 `<html>`이 캡처돼 있어 페이지가 눌리지 않는다(위 "공통 규칙"). `--motion-slow`(450ms)보다 길게 잡지 않는다.

### 라우터와 겹칠 때

| 상황 | 일어나는 일 | 판단 |
| --- | --- | --- |
| 번짐 도중 링크를 누름 | 클릭은 VT 도중이라 문서 요소로 간다(위 hit-test 규칙). 키보드나 `navigate()`로 이동이 시작되면 Astro의 `startViewTransition`이 번짐 VT를 건너뛰게 한다. 테마 콜백은 이미 실행됐거나 건너뛰기 단계에서 실행되므로 테마 값은 바뀐 채로 남는다. 번짐만 끝으로 튄다. `astro:before-swap`의 테마 이어 붙이기는 그 순간의 `data-theme`을 읽으므로 새 테마가 이어진다. | 허용 가능. `ready` 거부만 잡는다 |
| 라우터 VT 도중 테마 버튼을 누름 | 포인터 클릭은 문서 요소로 가므로 주로 키보드(포커스된 버튼에서 Enter·Space)로 생긴다. 번짐 VT가 라우터 VT를 건너뛰게 한다. Astro의 갱신 콜백(본문 교체)은 여전히 끝까지 실행되고 `astro:page-load`도 `updateCallbackDone` 기준이라 온다. 다만 Astro가 본문을 바꾸는 도중에 번짐의 옛 화면 캡처가 끼어들 수 있다. | 피한다: 이동 중에는 번짐 없이 바로 바꾼다 |
| 페이지를 가져오는 중(VT 시작 전) 테마 버튼을 누름 | 번짐 VT가 먼저 돌고 가져오기가 끝나면 Astro VT가 번짐을 건너뛰게 한다. | 위와 같이 바로 바꾸는 쪽이 단순하다 |

- 이동 중인지는 `document.activeViewTransition`(Chrome 142, Firefox 147, Safari 26.2)으로 알 수 있다. 다만 이 속성은 VT가 시작된 뒤만 알려 준다. 가져오는 구간까지 막으려면 `astro:before-preparation`에서 켜고 `astro:page-load`에서 끄는 플래그를 둔다. 라우터의 내부 속성(`data-astro-transition`)에 기대지 않는다.
- 미지원 브라우저(`document.startViewTransition` 없음)와 움직임 줄이기 설정에서는 VT를 시작하지 않고 바로 바꾼다. VT를 시작해도 Astro CSS가 애니메이션을 끄긴 하지만 캡처·갱신 대기 동안 한 박자 멈추는 일 자체가 불필요하다.
- 번짐 경계가 글 본문 위를 지나간다. 본문 내용이 움직이는 것은 아니고 색만 바뀌지만 "글 본문에는 움직임을 두지 않는다"는 제약을 어떻게 읽을지는 디자인 판단으로 남긴다.

## 3. 탭이 닫히며 접히기

### 방식 비교

| 방식 | 동작 여부 | 이유 | 출처 |
| --- | --- | --- | --- |
| `@starting-style` | 아니오(퇴장) | 첫 스타일 갱신·`display: none`에서 보일 때의 시작값만 정한다. "When it transitions back … it will no longer use the @starting-style styles". 등장(지금의 `animate-unroll`) 대체용으로는 쓸 수 있다. | [MDN @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) |
| `transition-behavior: allow-discrete` + `display: none` | 부분적 | 요소가 DOM에 남은 채 `display: none`으로 바뀔 때만 퇴장이 보인다. 보이는 값 → `none`은 100% 지점에서 뒤집힌다. React가 `<li>`를 지우면 붙잡을 수 없어 결국 "닫는 중" 상태가 필요하다. Firefox는 `display` 전환을 지원하지 않는다(BCD: "Transitioning the display property with allow-discrete … is not supported", bug 1882408). | [MDN transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior), BCD `css.properties.transition-behavior` |
| 문서 VT(`document.startViewTransition` + 탭마다 `view-transition-name` 또는 `view-transition-class`) | 가능하지만 권하지 않음 | 활성 탭을 닫으면 `onNavigate`가 곧바로 라우터 이동을 시작하고 그 `startViewTransition`이 탭 VT를 건너뛰게 한다. VT 동안 페이지 전체가 눌리지 않는다. 탭 이름이 창 틀(유지 아일랜드)에 남아 라우터 VT에도 참여한다. | 위 "공통 규칙" |
| 요소 단위 VT(`ul.startViewTransition`) | 나중에 | 범위 밖은 계속 상호작용할 수 있고 동시 실행도 된다. 그러나 Chrome 147만 지원하고 Baseline이 아니다. 문서 VT와 동시에 시작될 때의 동작은 문서에 없다. | [Element-scoped view transitions](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions), web-features `view-transitions-element-scoped` |
| React 19.3 `<ViewTransition exit>` | 이 구조에선 아니오 | 19.3에서 안정판이지만 "Updates outside of a Transition don't trigger animations". 탭 목록은 `@nanostores/react`의 `useStore` → `useSyncExternalStore`로 읽는데 "mutations to the external store cannot be marked as non-blocking Transition updates". React는 자기가 유일한 `startViewTransition` 호출자여야 한다고 하고 다른 VT를 중단시킨다. Astro 라우터와 충돌한다. | [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [`<ViewTransition>`](https://react.dev/reference/react/ViewTransition), [`useSyncExternalStore` caveats](https://react.dev/reference/react/useSyncExternalStore), `node_modules/@nanostores/react/index.js` |
| JS "닫는 중" 상태 + CSS 애니메이션 | **권장** | 시간·이징은 CSS 토큰으로 두고 JS는 시작·끝만 다룬다. VT를 쓰지 않아 라우터와 부딪히지 않는다. 지금 펼침(`animationend` + 시간 제한 대비책)과 같은 방식이다. | 아래 |

### 권장안

- 닫기 버튼을 누르면 `<li>`에 `data-closing`을 붙이고(로컬 React 상태 또는 DOM 속성), `inert`를 줘서 포커스·보조 기술에서 바로 뺀다. 포커스는 지금처럼 닫은 뒤의 활성 탭으로 옮긴다.
- 접힘은 `motion.css`에 키프레임으로 둔다. 너비를 줄이려면 `width: auto`에서 0으로 보간해야 하는데 `interpolate-size`·`calc-size()`는 Chrome 129+에만 있다. 대신 JS가 누르는 순간 `<li>`의 현재 너비를 px로 인라인 지정하고 `to { width: 0; padding-inline: 0 }`만 있는 키프레임을 건다. 시작 키프레임을 빼면 "browsers will use the element's existing styles for the start/end states"이므로 모든 브라우저에서 동작한다([MDN @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes)). `animate-unroll`의 반대 방향 `clip-path`를 함께 쓰면 등장과 같은 말투가 된다. 시간은 `--motion-base` 또는 `--motion-enter`, 이징은 `--motion-easing`.
- `animationend`(대상 요소에서 온 것만)에서 `closeTab()`을 부르고 활성 탭이었다면 그 뒤 `onNavigate(next)`를 부른다. 이동을 접힘 뒤로 미루는 이유가 있다. Safari에는 `moveBefore()`가 없어서 라우터가 창 틀을 `appendChild`로 옮기고 이때 진행 중이던 CSS 애니메이션이 처음부터 다시 돌 수 있다(Astro 문서의 "restart of CSS animations" 주의). 대신 이동이 그 시간만큼 늦어진다. 이를 피하고 싶다면 활성 탭을 닫을 때는 접지 않고 바로 이동하는 것도 대안이다.
- 움직임 줄이기 설정에서는 CSS가 `animation: none`이 되어 `animationend`가 오지 않는다. 클릭 시점에 `matchMedia`를 보고 바로 지운다. 혹시 모를 누락에 대비해 펼침처럼 시간 제한 대비책을 둔다.
- `Tabs`의 서버 스냅샷·하이드레이션 규칙(`useStore(..., { ssr })`)은 건드리지 않는다. "닫는 중"은 클라이언트에서만 생긴다.

## 4. 공통: 지원, 대체 동작, 움직임 줄이기

### 지원 현황 (2026-10 기준)

BCD 8.1.7(2026-10-22 생성)과 web-features 3.44.0에서 뽑았다.

| 기능 | Chrome | Firefox | Safari | Baseline | 쓰는 곳 |
| --- | --- | --- | --- | --- | --- |
| `document.startViewTransition(callback)`, `view-transition-name`, `::view-transition-*` | 111 | 144 | 18 | 새로 사용 가능(2025-10-14) | 라우터, 테마 번짐 |
| `startViewTransition({ update, types })` 객체 형식 | 125 | 147 | 18.2 | (위 기능의 일부, Firefox만 늦음) | 쓰지 않음 권장 |
| `:active-view-transition-type()`, `ViewTransition.types` | 125 | 147 | 18.2 | 새로 사용 가능(2026-01-13) | 선택 |
| `view-transition-class` | 125 | 144 | 18.2 | 새로 사용 가능(2025-10-14) | — |
| `view-transition-name: match-element` | 137 | 144 | 18.4 | (view-transitions의 일부) | — |
| `document.activeViewTransition` | 142 | 147 | 26.2 | — | 테마 번짐 차단 조건 |
| `Element.startViewTransition`, `view-transition-scope` | 147 | 아니오 | 아니오 | 아니오(실험적) | 나중에 탭 |
| `@starting-style` | 117 | 129 | 17.5 | 새로 사용 가능(2024-08-06) | 등장 |
| `transition-behavior` | 117 | 129(부분: `display` 안 됨) | 17.4 | 새로 사용 가능(2024-08-06) | — |
| `interpolate-size`, `calc-size()` | 129 | 아니오 | 아니오 | 아니오 | 쓰지 않음 |
| 교차 문서 VT(`@view-transition`) | 126 | 아니오 | 18.2 | 아니오 | 해당 없음(ClientRouter 사용) |
| `Element.moveBefore()` | 133 | 144 | 아니오 | — | 라우터의 창 틀 이동 |
| `prefers-reduced-motion` | 74 | 63 | 10.1 | 널리 사용 가능 | 전부 |

MDN의 `transition-behavior` 페이지는 "Limited availability"로 표시하지만, Baseline 판정의 원본인 web-features는 2024-08-06 "low"로 본다. Firefox의 부분 구현(`display` 전환 미지원) 때문에 생긴 차이로 보인다.

### 대체 동작

- **라우터:** 같은 문서 VT가 Baseline이 되어 기본 `fallback="animate"`가 쓰일 일은 오래된 브라우저뿐이다. 이 저장소는 `<html transition:animate="none">`이라 흉내 모드에서도 움직임이 없다. 펼침은 VT와 무관하게 `astro:page-load`에서 돈다.
- **테마 번짐:** `document.startViewTransition`이 없으면 바로 바꾼다. 객체 형식·타입에 기대지 않으면 Firefox 144–146도 번짐을 받는다.
- **탭 접힘:** CSS 애니메이션과 `animationend`만 쓰므로 대체 경로가 필요 없다.

### 움직임 줄이기

- 프로젝트 규칙은 "모든 움직임을 끄거나 즉시"다. Chrome 문서는 "a preference for 'reduced motion' doesn't mean the user wants no motion"이라며 더 약한 움직임을 권하지만 이 저장소는 자기 규칙(DESIGN.md 토큰 절)을 따른다.
- **CSS로 그리는 VT 애니메이션**은 Astro의 전역 규칙이 `!important`로 끈다. 그래도 `motion.css`의 다른 규칙처럼 각자 `@media (prefers-reduced-motion: reduce)`를 두면 Astro 바깥(Storybook 등)에서도 같게 동작한다.
- **JS가 결과를 기다리는 흐름**은 직접 막는다. WAAPI 애니메이션은 Astro 규칙의 영향을 받지 않는다. `animationend`를 기다리는 흐름은 애니메이션이 `none`이면 영원히 기다린다. 두 경우 모두 시작 전에 `matchMedia('(prefers-reduced-motion: reduce)')`를 확인한다(지금 `unfold()`와 `Shell`의 열기 로그가 이미 이렇게 한다).
- VT 자체를 시작하지 않는 것이 "즉시"에 가장 가깝다. 애니메이션이 꺼져 있어도 VT는 캡처와 갱신 대기를 거친다.

## 미확인/불확실

- 큰 요소(스크롤되는 `#editor`)에 `view-transition-name`을 붙였을 때 브라우저별로 스냅숏을 어디까지 담고 어떻게 배치하는지는 확인하지 않았다. 1절 권장안이 `root`의 old 이미지만 쓰는 이유다.
- Firefox 144–146에서 `startViewTransition({...})` 객체를 넘기면 정확히 어떤 일이 생기는지(예외인지, 콜백 없이 진행인지)는 확인하지 않았다. BCD는 객체 형식 지원을 147로 적는다.
- Safari(`moveBefore()` 없음)에서 창 틀이 옮겨질 때 남아 있는 `animate-unroll` 클래스 때문에 탭 등장 애니메이션이 이동마다 다시 도는지는 확인하지 않았다. Astro 문서의 "CSS 애니메이션 재시작" 주의로 보아 가능성이 있다. 이 조사 범위 밖이지만 `pnpm qa`로 볼 만하다.
- 루트 old 이미지 페이드아웃(1절)을 new 위에 보이게 하는 구체적인 방법(`z-index`, new 쪽 처리)은 시안에서 정한다.
- 문서 VT와 요소 단위 VT가 동시에 시작될 때의 동작은 Chrome 문서에 명시되어 있지 않다.
- 애니메이션 시간은 브라우저에서 재지 않았다. 토큰 값(`--motion-*`)이 실제로 어떻게 보이는지는 시안과 `pnpm qa`로 확인한다.
