# 디자인 시스템 토큰 층 조사 — Tailwind 4 `@theme`, shadcn/Radix Provider, Storybook 10 문서화

- 작성일: 2026-10-23
- 질문: ADR 0002(Provider 없는 층 구조, `data-theme` + CSS 변수 테마)를 구현하려면 (1) Tailwind 4의 `@theme`를 어떻게 써야 런타임 테마 전환이 되는가, (2) shadcn/ui·Radix 컴포넌트 중 전역 Provider가 필요한 것은 무엇인가, (3) Storybook 10에서 토큰을 어떻게 문서화하고 테마 툴바를 붙이는가.
- 조사 범위: Tailwind 공식 문서(v4 현행)·`tailwindlabs/tailwindcss` 소스와 CHANGELOG, shadcn/ui 공식 문서·`shadcn-ui/ui` 레지스트리 소스, Radix 공식 문서·`radix-ui/primitives` 소스, Storybook 공식 문서·`storybookjs/storybook` MIGRATION.md·애드온 소스, Astro 공식 문서, npm 레지스트리 메타데이터. 추측은 "미확인/불확실"에 분리했다.
- 조사 시점의 최신 버전(npm `dist-tags.latest`): tailwindcss 4.3.3, @tailwindcss/vite 4.3.3(peer `vite ^5.2.0 || ^6 || ^7 || ^8`), radix-ui 1.8.1(2026-10-14 발행), storybook 10.6.3, @storybook/addon-themes 10.6.3(peer `storybook ^10.6.3`), @storybook/addon-docs 10.6.3(peer `storybook ^10.6.3`), @storybook/addon-a11y 10.6.3, @storybook/react-vite 10.6.3(peer `vite ^5 || ^6 || ^7 || ^8`). 참고: @storybook/blocks는 8.6.14에서 발행이 끝났고, storybook-design-token 5.0.0(2025-12-09), next-themes 0.4.6, sonner 2.0.8.
- 이 저장소의 현재 상태: `src/styles/global.css`는 shadcn `init`이 만든 그대로 `@custom-variant dark (&:is(.dark *))` + `@theme inline` + `:root`/`.dark` 구조이고, `.storybook/main.ts`의 `addons`는 `@storybook/addon-a11y` 하나다.

## 결론 요약

1. **토큰은 `:root`/`[data-theme]`에 원시 CSS 변수로 두고, `@theme inline`으로 Tailwind 네임스페이스(`--color-*`, `--font-*`…)에 매핑한다.** `inline`이 없으면 유틸리티가 `var(--color-x)`를 참조하고 그 변수는 `:root`에서 한 번 해석되므로, 하위 요소에서 바꾼 값이 반영되지 않는 경우가 생긴다. shadcn v4 템플릿도 같은 이유로 `@theme inline`을 쓴다. ADR의 "`data-theme` + CSS 변수" 방식과 정확히 맞는 패턴이다.
2. **다크 변형은 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`로 바꿔야 한다.** 현재 `global.css`의 `(&:is(.dark *))`는 shadcn 기본값이며 ADR과 어긋난다. 테마 속성은 Radix Portal이 `document.body`에 붙기 때문에 아일랜드 래퍼가 아니라 `<html>`에 둬야 한다.
3. **shadcn 컴포넌트 중 앱 전체 Provider를 요구하는 것은 Tooltip(Radix가 Provider 없으면 throw), Sidebar(`useSidebar` throw), Sonner 래퍼(next-themes `useTheme`)뿐이다.** Dialog·DropdownMenu·Tabs·Accordion·Popover 등은 복합 컴포넌트 내부 Context만 쓰므로 아일랜드 단위로 문제없다. Tooltip은 `TooltipProvider`를 컴포넌트 안에 넣으면 되고, Sonner는 `useTheme` 대신 `data-theme`를 읽으면 된다. Toast(Radix)는 shadcn에서 deprecated.
4. **Storybook 10에서 `@storybook/addon-docs`는 코어가 아니라 별도 패키지다.** 9.0에서 essentials가 제거되며 docs만 "수동 설치" 대상으로 남았고, `@storybook/blocks`는 9부터 발행되지 않아 `@storybook/addon-docs/blocks`에서 `Meta`·`ColorPalette`·`Typeset`·`IconGallery`를 가져온다. 테마 툴바는 `@storybook/addon-themes`(별도 패키지)의 `withThemeByDataAttribute`로 붙이며 기본값이 `attributeName: "data-theme"`, `parentSelector: "html"`이라 ADR과 그대로 맞는다.
5. **storybook-design-token은 v5.0.0(2025-12)이 Storybook 10을 지원한다**(peer `storybook ^10.0.0`). 다만 마지막 커밋이 2025-12-09이고 열린 이슈가 64개라 MDX 문서 블록으로 직접 쓰는 쪽이 유지보수 부담이 적다.
6. `radix-ui` 모놀리식 패키지는 1.8.1(2026-10-14)로 활발히 유지되고 `Slot`·`Tooltip`·`Portal` 등을 네임스페이스로 내보낸다. 2026-07-20부터 `radix-ui/accordion` 같은 서브패스 import도 지원한다.

## 1. Tailwind 4 `@theme`와 CSS 변수 토큰

### `@theme` 옵션 비교

| 옵션 | 동작 | 런타임 테마 전환(`[data-theme]`로 `:root` 변수 덮어쓰기)에 미치는 영향 | 출처 |
| --- | --- | --- | --- |
| `@theme { --color-x: … }` | `:root`에 `--color-x`를 내보내고 유틸리티는 `var(--color-x)`를 참조 | 토큰 값이 리터럴이면 `[data-theme=dark] { --color-x: … }`로 덮어써도 동작. 그러나 토큰이 `var(--x)`를 참조하면 `:root`에서 한 번 해석된 뒤 상속되므로 하위에서 `--x`를 바꿔도 반영되지 않을 수 있음 | [Theme variables — inline](https://tailwindcss.com/docs/theme#defining-theme-variables): "Without using `inline`, your utility classes might resolve to unexpected values because of how variables are resolved in CSS." |
| `@theme inline { --color-x: var(--x) }` | 유틸리티에 `var(--x)` 값이 그대로 복사됨(`.bg-x { background: var(--x) }`) | `--x`가 어느 요소에서 바뀌든 그 요소 기준으로 해석됨. 테마 전환·중첩 테마에 적합. 소스상 `ThemeOptions.INLINE`이면 `resolve()`가 `value.value`를 그대로 반환 | 위 문서; [theme.ts `resolve()`](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/theme.ts) |
| `@theme static` | 사용 여부와 무관하게 모든 변수를 CSS에 포함 | JS에서 `getComputedStyle`로 토큰을 읽거나 Storybook 토큰 페이지에서 변수를 열거할 때 유용. 4.0.5에서 추가 | [Theme — static](https://tailwindcss.com/docs/theme#generating-all-css-variables), [CHANGELOG 4.0.5](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md) "Add `@theme static` option" |
| `@theme default` | Tailwind 기본 테마(`theme.css`)가 쓰는 옵션. 이미 사용자 값이 있으면 덮어쓰지 않음 | 공개 문서에는 없음. 공유 토큰 패키지가 "소비자가 덮어쓸 수 있는 기본값"을 제공할 때 쓸 수 있으나 비공식 | [theme.css](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css) 첫 줄 `@theme default {`; [theme.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/theme.ts) `if (existing && !(existing.options & ThemeOptions.DEFAULT)) return` |
| `@theme reference` / `@import "…" theme(reference)` | 변수를 내보내지 않고 유틸리티 생성에만 사용 | `@reference`로 대체됨. `theme(reference)`로 가져온 파일에 `@theme` 외의 규칙이 있으면 오류 | [index.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/index.ts) "Files imported with `@import "…" theme(reference)` must only contain `@theme` blocks. Use `@reference "…";` instead." |

`parseThemeOptions`가 받는 옵션은 `reference`, `inline`, `default`, `static`, `prefix(…)` 다섯 가지다([index.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/index.ts)).

### 네임스페이스와 유틸리티 생성

"Theme variables are defined in namespaces and each namespace corresponds to one or more utility class or variant APIs." 새 변수를 정의하면 그 네임스페이스의 유틸리티가 생긴다. 출처: [Theme variable namespaces](https://tailwindcss.com/docs/theme#theme-variable-namespaces).

| 네임스페이스 | 생성되는 유틸리티 | 이 저장소에서의 예 |
| --- | --- | --- |
| `--color-*` | `bg-*`, `text-*`, `border-*` 등 색상 전부 | `--color-ide-chrome` → `bg-ide-chrome` |
| `--font-*` | `font-sans` 같은 font-family | `--font-display` → `font-display` |
| `--text-*` | `text-xl` 같은 font-size. `--text-sm--line-height`처럼 `--*--line-height` 보조 키 가능 | `--text-prose` → `text-prose` |
| `--font-weight-*` | `font-bold` | |
| `--tracking-*` | `tracking-wide` | |
| `--leading-*` | `leading-tight` | |
| `--tab-size-*` | `tab-github` (4.3.0에서 추가) | |
| `--breakpoint-*` | `sm:*` 변형 | |
| `--container-*` | `@sm:*` 변형, `max-w-md` | |
| `--spacing-*` | `px-4`, `max-h-16` 등. 기본 테마는 단일 `--spacing: 0.25rem`만 정의하고 `--spacing(n)` 함수가 `calc(var(--spacing) * n)`을 만든다 | |
| `--radius-*` | `rounded-sm` | shadcn은 `--radius-lg: var(--radius)` 식으로 파생 |
| `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*` | `shadow-md` 등 | |
| `--blur-*`, `--perspective-*`, `--zoom-*`, `--aspect-*` | 각 유틸리티 (`zoom-*`은 4.3.0 추가) | |
| `--ease-*` | `ease-out` | |
| `--animate-*` | `animate-spin`. `@theme` 안에 `@keyframes`를 같이 두면 해당 `--animate-*`가 쓰일 때만 포함 | |

출처: 위 표 전체 [Theme variable namespaces](https://tailwindcss.com/docs/theme#theme-variable-namespaces); `--spacing()` [Functions](https://tailwindcss.com/docs/functions-and-directives#spacing-function); keyframes [Theme — animation](https://tailwindcss.com/docs/theme#defining-animation-keyframes) "If you want your custom `@keyframes` rules to always be included even when not adding an `--animate-*` theme variable, define them outside of `@theme` instead."; 4.3.0 추가 항목 [CHANGELOG 4.3.0](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md).

**기본값 초기화.** 네임스페이스 하나는 `--color-*: initial;`, 전체는 `--*: initial;`로 지운다. "When you do this, all of the default utilities that use that namespace (like `bg-red-500`) will be removed, and only your custom values (like `bg-midnight`) will be available." 출처: [Overriding the default theme](https://tailwindcss.com/docs/theme#overriding-the-default-theme). `initial`은 소스상 `this.values.delete(key)`로 처리된다([theme.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/theme.ts)).

**`@theme`와 `:root`의 역할 구분.** "Theme variables aren't just CSS variables — they also instruct Tailwind to create new utility classes." 유틸리티로 노출할 필요가 없는 변수는 `:root`에 둔다. 출처: [Theme — Why @theme instead of :root](https://tailwindcss.com/docs/theme#why-theme-instead-of-root).

### 토큰 파일 분리와 import 순서

- `@theme`는 가져온 파일 안에 있어도 된다. 공식 문서가 `./packages/brand/theme.css`에 `@theme { --*: initial; … }`를 두고 `@import "tailwindcss"; @import "../brand/theme.css";`로 쓰는 예를 제시한다. 출처: [Sharing across projects](https://tailwindcss.com/docs/theme#sharing-across-projects).
- `@import "tailwindcss"`는 실제로 다음으로 전개된다. 출처: [index.css](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/index.css), [Preflight](https://tailwindcss.com/docs/preflight).
  ```css
  @layer theme, base, components, utilities;
  @import './theme.css' layer(theme);
  @import './preflight.css' layer(base);
  @import './utilities.css' layer(utilities);
  ```
- `@import "…" layer(…)`를 쓸 때 `layer()`는 다른 함수·조건보다 앞에 와야 한다(소스 오류 메시지 "`layer(…)` in an `@import` should come before any other functions or conditions"). 출처: [at-import.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/at-import.ts).
- 사용자 `@theme` 블록은 여러 개여도 되며 첫 번째 블록 위치에 합쳐져 출력된다(소스 주석 "Keep a reference to the first `@theme` rule to update with the full theme later, and delete any other `@theme` rules"). `@theme` 안에는 커스텀 프로퍼티와 `@keyframes`만 들어갈 수 있다("`@theme` blocks must only contain custom properties or `@keyframes`"). 출처: [index.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/index.ts).
- `@import`에 `theme(static)`·`theme(inline)`·`prefix(x)`·`important`·`reference` 옵션을 붙이면 가져온 파일의 `@theme` 블록에 그 옵션이 전파된다(`child.params += ' ' + themeParams`). 4.0.8부터 `@theme` 외의 규칙이 섞인 파일에도 허용된다. 출처: [index.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/index.ts), [CHANGELOG 4.0.8](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md) "Allow `@import` with `theme(…)` options for stylesheets that contain more than just `@theme` rules".
- **`@reference`.** 별도로 번들되는 스타일시트(CSS 모듈, Vue/Svelte/**Astro**의 `<style>`)는 다른 파일의 테마 변수·커스텀 유틸리티·변형을 알지 못한다. 그 안에서 `@apply`·`@variant`를 쓰려면 `@reference "../../app.css";`로 메인 CSS를 참조한다(CSS 중복 없음). 변수만 쓸 거면 `@reference` 없이 `color: var(--color-x)`가 더 빠르다. 출처: [Upgrade guide — Using @apply with Vue, Svelte, or CSS modules](https://tailwindcss.com/docs/upgrade-guide#using-apply-with-vue-svelte-or-css-modules), [@reference directive](https://tailwindcss.com/docs/functions-and-directives#reference-directive). 4.0.0-beta.9에서 `@import "…" reference`를 대체해 도입됐고, 4.0.9부터 `@reference` 사용 시 변수 fallback을 내보낸다([CHANGELOG](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md)).

### `@custom-variant`와 `data-theme`

| 용도 | 코드 | 출처 |
| --- | --- | --- |
| 클래스 기반(shadcn 기본) | `@custom-variant dark (&:where(.dark, .dark *));` (shadcn은 `&:is(.dark *)`) | [Dark mode — Toggling manually](https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually) |
| 데이터 속성 기반(ADR 방식) | `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` + `<html data-theme="dark">` | [Dark mode — Using a data attribute](https://tailwindcss.com/docs/dark-mode#using-a-data-attribute) |
| 추가 테마 변형 | `@custom-variant theme-midnight (&:where([data-theme="midnight"] *));` → `theme-midnight:bg-black` | [@custom-variant](https://tailwindcss.com/docs/functions-and-directives#custom-variant-directive) |
| 블록 문법 | `@custom-variant theme-midnight { &:where([data-theme="midnight"] *) { @slot; } }` | [Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-variants) |

FOUC를 피하려면 `<head>` 인라인 스크립트에서 `localStorage.theme`과 `matchMedia("(prefers-color-scheme: dark)")`로 결정해 `documentElement`에 적용하라고 안내한다. 출처: [Dark mode — system theme](https://tailwindcss.com/docs/dark-mode#with-system-theme-support). shadcn의 Astro 가이드도 같은 구조로 `document.documentElement.classList`를 토글하고 `MutationObserver`로 `localStorage`에 되쓴다([shadcn Dark mode — Astro](https://ui.shadcn.com/docs/dark-mode/astro)). `data-theme`로 바꾸려면 `classList` 대신 `setAttribute('data-theme', …)`로 고치면 된다.

4.2.0에서 `@custom-variant` 안의 `@variant` 무한 루프가 고쳐졌고, 4.3.x에는 `@theme`·`@custom-variant`·`@reference` 동작 변경이 없다([CHANGELOG 4.2.0~4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md)).

### 레이어와 커스텀 CSS 위치

| 넣을 것 | 위치 | 근거·출처 |
| --- | --- | --- |
| 원시 토큰(`--bg`, `--fg`, `--ide-chrome` …), `[data-theme]` 덮어쓰기 | 레이어 밖 `:root`, `[data-theme="dark"]` | shadcn v4 템플릿이 `:root`/`.dark`를 `@layer base` 밖으로 뺐다 — [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [apps/v4 globals.css](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/globals.css) |
| Tailwind 네임스페이스 매핑 | `@theme inline { --color-bg: var(--bg); }` | 위 "옵션 비교" |
| 요소 기본 스타일(`h1`, `body`) | `@layer base { … }` | [Adding base styles](https://tailwindcss.com/docs/adding-custom-styles#adding-base-styles) |
| 유틸리티로 덮어쓸 수 있는 복합 클래스(`.card`, `.prose-ide`) | `@layer components { … }` | "Use the `components` layer for any more complicated classes… that you'd still like to be able to override with utility classes" — [Adding component classes](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes) |
| 변형(`hover:`, `lg:`)과 함께 쓸 단일 유틸리티 | `@utility name { … }` (utilities 레이어에 자동 삽입). v3의 `@layer utilities { .x {} }`는 더 이상 유틸리티로 인식되지 않음 | [Adding custom utilities](https://tailwindcss.com/docs/adding-custom-styles#adding-custom-utilities), [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide#adding-custom-utilities) |
| 아일랜드 컴포넌트 전용 CSS(Astro `<style>`, CSS 모듈) | 변수 직접 사용 또는 `@reference` | 위 "`@reference`" |

컴포넌트 CSS에서 토큰은 `var(--color-gray-700)`, `--spacing(6)`, `--alpha(var(--color-lime-300) / 50%)`처럼 쓴다. 출처: [Theme — Using your theme variables](https://tailwindcss.com/docs/theme#using-your-theme-variables), [Functions](https://tailwindcss.com/docs/functions-and-directives#alpha-function).

## 2. shadcn/ui와 Radix: Context 의존 분류

### 전제: Astro 아일랜드와 Context

"An island always runs in isolation from other islands on the page." 각 클라이언트 아일랜드는 "hydrated separately from the rest of the page"이며, 상태 공유용 Context 래퍼는 "when partially hydrating components within Astro or Markdown, you can't use these context wrappers"라고 못박고 Nano Stores를 권한다. 반대로 한 아일랜드 안에서는 React 자식 중첩이 가능하므로("framework component children can also be hydrated components… build entire apps in one framework") 복합 컴포넌트의 내부 Context는 문제없다. 출처: [Islands architecture](https://docs.astro.build/en/concepts/islands/), [Sharing state between islands](https://docs.astro.build/en/recipes/sharing-state-islands/), [Framework components — Nesting](https://docs.astro.build/en/guides/framework-components/#nesting-framework-components).

### 분류표

| 컴포넌트 | Context 성격 | Provider 없을 때 | ADR 0002 대응 | 출처 |
| --- | --- | --- | --- | --- |
| Dialog, AlertDialog, Sheet, Drawer, DropdownMenu, ContextMenu, Menubar, NavigationMenu, Popover, HoverCard, Tabs, Accordion, Collapsible, RadioGroup, Select, Toggle Group | Root ↔ 부분(Trigger/Content) 사이 내부 Context | 복합 컴포넌트를 통째로 한 아일랜드에 두면 동작 | 그대로 사용 | Radix Anatomy가 모두 `Root`로 시작 — 예: [Tooltip Anatomy](https://www.radix-ui.com/primitives/docs/components/tooltip#anatomy)와 같은 구조 |
| **Tooltip** | `Tooltip.Provider`가 별도 상위 Context. shadcn 문서: "Add the `TooltipProvider` to the root of your app." | Radix `createContextScope`는 defaultContext 없이 만든 Context를 소비하면 **throw**: "`Tooltip` must be used within `TooltipProvider`" | **감싸는 범위는 자유다.** Provider는 `delayDuration`(기본 700ms)·`skipDelayDuration`(300ms)을 공유하는 용도라 아일랜드마다, 심지어 `Tooltip` 컴포넌트 안에서 감싸도 된다. shadcn 래퍼 `TooltipProvider`는 `delayDuration = 0`을 기본으로 둔다. 아일랜드 간 skip-delay 공유만 포기하면 됨 | [shadcn Tooltip](https://ui.shadcn.com/docs/components/radix/tooltip), [Radix Tooltip Provider](https://www.radix-ui.com/primitives/docs/components/tooltip#provider) "Wraps your app to provide global functionality to your tooltips", [tooltip.tsx(Radix)](https://github.com/radix-ui/primitives/blob/main/packages/react/tooltip/src/tooltip.tsx) `createTooltipContext<TooltipProviderContextValue>(PROVIDER_NAME)`, [create-context.tsx](https://github.com/radix-ui/primitives/blob/main/packages/react/context/src/create-context.tsx), [shadcn tooltip.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/tooltip.tsx) |
| **Sidebar** | `SidebarProvider`가 열림 상태·쿠키(`sidebar_state`)·단축키(`cmd/ctrl+b`)·`useIsMobile`을 제공. 내부에서 `TooltipProvider delayDuration={0}`도 감쌈 | `useSidebar()`가 **throw**: "useSidebar must be used within a SidebarProvider." | 문서는 "You should always wrap your application in a `SidebarProvider` component."라고 하지만, 레이아웃 전체가 한 React 아일랜드라면 그 안에서 감싸면 된다. Astro 레이아웃(.astro)과 섞으면 불가. 이 저장소는 ADR 0001의 IDE 셸이 Astro라 Sidebar 도입 시 설계 충돌 가능 | [shadcn Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar), [sidebar.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx) |
| **Sonner (Toaster)** | shadcn 래퍼가 `next-themes`의 `useTheme()`로 테마를 읽어 `<Sonner theme=…>`에 넘김. sonner 자체는 `theme?: 'light' \| 'dark' \| 'system'` prop | next-themes `useTheme`는 Provider 없으면 `defaultContext`(`{ setTheme: noop, themes: [] }`)를 반환해 **throw하지 않음**. 결과적으로 `theme = "system"`으로 동작 | 래퍼에서 `useTheme` 제거 후 `document.documentElement.dataset.theme`를 읽거나 토큰(`--normal-bg: var(--popover)`)에만 의존하도록 수정. Toaster는 "you can place it anywhere in your app"이고 여러 개도 허용(`id`/`toasterId`) | [shadcn sonner.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sonner.tsx), [next-themes index.tsx](https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx) `useContext(ThemeContext) ?? defaultContext`, [sonner types.ts](https://github.com/emilkowalski/sonner/blob/main/src/types.ts), [Sonner Toaster](https://sonner.emilkowal.ski/toaster) |
| Toast (Radix) | `ToastProvider` 필요 | — | **shadcn에서 deprecated**: "The toast component has been deprecated. Use the sonner component instead." | [shadcn Toast](https://ui.shadcn.com/docs/components/radix/toast) |
| Form (react-hook-form) | `FormProvider` ↔ `useFormContext` | 폼 단위 Context라 폼 전체가 한 아일랜드면 동작 | 그대로 사용 가능(이 조사에선 소스 미확인, "미확인" 참조) | — |
| ThemeProvider (next-themes) | 앱 전체 Context | shadcn Astro 가이드는 next-themes를 쓰지 않고 인라인 스크립트 + `classList`로 처리 | 도입하지 않음. `data-theme` 속성 + 인라인 스크립트 | [shadcn Dark mode — Astro](https://ui.shadcn.com/docs/dark-mode/astro) |

### 다크 모드와 shadcn CSS 구조

- shadcn v4 `globals.css`는 `@import "tailwindcss"; @custom-variant dark (&:is(.dark *)); @theme inline { --color-background: var(--background); … --radius-lg: var(--radius); } :root { … } .dark { … } @layer base { … }` 구조다. `:root`/`.dark`를 `@layer base` 밖으로 옮기고 `@theme` → `@theme inline`으로 바꾼 것이 v4 마이그레이션 단계로 명시돼 있다. 출처: [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [apps/v4 globals.css](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/globals.css) 41–60행, [Theming](https://ui.shadcn.com/docs/theming) "These tokens live in your CSS file under `:root` and `.dark`."
- 이 저장소 `src/styles/global.css`도 동일 구조(`@custom-variant dark (&:is(.dark *))`, `@theme inline`, `:root`/`.dark`)로 생성돼 있다. ADR대로 가려면 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`와 `[data-theme="dark"] { … }`로 바꾸고, `.dark`를 더 이상 쓰지 않도록 인라인 스크립트도 바꿔야 한다.
- `components.json`의 `cssVariables: true`(현재 설정)는 컴포넌트가 `bg-background` 같은 시맨틱 클래스를 쓰게 한다. `false`면 `bg-zinc-950 dark:bg-white`처럼 인라인 색상이 박히므로 토큰 층과 맞지 않는다. 출처: [Theming — CSS variables](https://ui.shadcn.com/docs/theming).

### `radix-ui` 모놀리식 패키지와 Portal

- 공식 권장: "We recommend installing the `radix-ui` package and importing the primitives you need." `import { Dialog, DropdownMenu, Tooltip } from "radix-ui";`, "The package is tree-shakeable". 출처: [Radix Introduction](https://www.radix-ui.com/primitives/docs/overview/introduction).
- 소스 `packages/react/radix-ui/src/index.ts`가 `export * as Slot from '@radix-ui/react-slot'`, `export * as Tooltip from '@radix-ui/react-tooltip'`, `export * as Portal from '@radix-ui/react-portal'` 등을 내보낸다. npm 최신 1.8.1(2026-10-14), 저장소 마지막 push 2026-10-14, archived 아님. 2026-07-20 릴리스에서 "per-primitive subpath entry points"(`import { Accordion } from "radix-ui/accordion"`)와 tree-shaking 개선, 2026-06~07 React 19.2 관련 수정이 이어졌다. 출처: [radix-ui index.ts](https://github.com/radix-ui/primitives/blob/main/packages/react/radix-ui/src/index.ts), [package.json](https://github.com/radix-ui/primitives/blob/main/packages/react/radix-ui/package.json), [Releases](https://www.radix-ui.com/primitives/docs/overview/releases), npm `radix-ui@1.8.1`, GitHub API `repos/radix-ui/primitives`.
- 이 저장소는 1.4.3을 쓰고 있어 1.8.1로 올릴 여지가 있다(peer `react ^16.8 || ^17 || ^18 || ^19`).
- **Portal.** Radix Portal은 `container` prop이 없으면 `globalThis.document.body`에 `createPortal`한다(소스 `const container = containerProp || (mounted && globalThis?.document?.body)`). Tooltip 문서도 "portals the content part into the `body`". 따라서 포털된 Content는 아일랜드 래퍼의 자손이 아니고, 래퍼에 둔 `data-theme`나 CSS 변수는 상속되지 않는다. 테마 속성과 변수 덮어쓰기는 `<html>`(또는 `body`)에 둬야 포털 콘텐츠까지 적용된다. 포털 위치를 아일랜드 안으로 바꾸고 싶으면 `Portal container={ref}`를 쓴다. 출처: [portal.tsx](https://github.com/radix-ui/primitives/blob/main/packages/react/portal/src/portal.tsx), [Radix Portal](https://www.radix-ui.com/primitives/docs/utilities/portal), [Tooltip Portal](https://www.radix-ui.com/primitives/docs/components/tooltip#portal).

## 3. Storybook 10 토큰 문서화

### 패키지 구성

| 항목 | Storybook 10 상태 | 출처 |
| --- | --- | --- |
| `@storybook/addon-essentials` | 9.0에서 제거. viewport·controls·interactions·actions(그리고 backgrounds·highlight·measure·outline·toolbars)는 코어로 이동 | [MIGRATION — Essentials Addon moved to core](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#essentials-addon-viewport-controls-interactions-and-actions-moved-to-core) "The `@storybook/addon-essentials` package has been removed." |
| `@storybook/addon-docs` | **코어가 아님.** "If you have used `@storybook/addon-docs` as part of essentials, you need to manually install it: `npx storybook add @storybook/addon-docs`". 공식 `main.ts` 예시도 `addons: ['@storybook/addon-docs']`를 명시 | 위 MIGRATION 절, [Configure Storybook](https://storybook.js.org/docs/configure), npm `@storybook/addon-docs@10.6.3` peer `storybook ^10.6.3` |
| `@storybook/blocks` | 9부터 발행 중단(npm 최신 8.6.14). "All exports can now be found in the export `@storybook/addon-docs/blocks`." `@storybook/addon-docs` 루트에서 블록 import는 불가 | [MIGRATION — Consolidate @storybook/blocks](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#consolidate-storybookblocks-into-addon-docs) |
| `@storybook/addon-themes` | 별도 패키지, 10.6.3(peer `storybook ^10.6.3`). README "Requires Storybook 7.0 or later." | npm, [addon-themes README](https://github.com/storybookjs/storybook/blob/next/code/addons/themes/README.md), [Themes docs](https://storybook.js.org/docs/essentials/themes) |
| `@storybook/addon-a11y` | 별도 패키지 10.6.3(현재 설치됨) | npm |
| ESM / Node | 10은 "ESM-only package distribution", `.storybook/main.*`은 유효한 ESM이어야 하고 Node 20.19+ 또는 22.12+ | [MIGRATION 9.x → 10.0.0](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-9x-to-1000), [Migration guide](https://storybook.js.org/docs/releases/migration-guide) |

### 토큰 문서 페이지(MDX + Doc Blocks)

- `stories` 글롭에 `'../src/**/*.mdx'`를 추가하고 `@storybook/addon-docs`를 `addons`에 등록한다. `<Meta title="Design System/Tokens" />`만 있는 파일은 "unattached" 문서 페이지가 된다. 출처: [MDX](https://storybook.js.org/docs/writing-docs/mdx), [Configure](https://storybook.js.org/docs/configure).
- 사용 가능한 블록: `Meta`, `ColorPalette`/`ColorItem`, `Typeset`, `IconGallery`/`IconItem`, `Canvas`, `Story`, `Controls`, `ArgTypes`, `Description`, `Primary`, `Stories`, `Source`, `Markdown`, `Subtitle`, `Title`, `TableOfContents`, `Unstyled`. 모두 `import { … } from '@storybook/addon-docs/blocks'`. 출처: [Doc blocks](https://storybook.js.org/docs/writing-docs/doc-blocks).
- `ColorItem`은 `title`·`subtitle`·`colors`(배열 또는 `{ 이름: 값 }`) 필수이고 "any valid CSS color format"과 그라디언트를 받는다. CSS 변수(`var(--color-x)`) 사용 예는 문서에 없다(미확인 참조). `Typeset`은 `fontFamily`, `fontSizes`(px), `fontWeight`, `sampleText`. 출처: [ColorPalette](https://storybook.js.org/docs/api/doc-blocks/doc-block-colorpalette), [Typeset](https://storybook.js.org/docs/api/doc-blocks/doc-block-typeset).
- `autodocs`는 `tags: ['autodocs']`(메타 또는 `preview.ts` 전역)로 켜고 `tags: ['!autodocs']`로 끈다. `parameters.docs`에는 `page`·`toc`·`container`·`theme`가 있고, `main.ts`의 `docs: { defaultName, docsMode }`로 이름·docs 전용 사이드바를 조정한다. 출처: [Autodocs](https://storybook.js.org/docs/writing-docs/autodocs).
- 11.0.0-alpha(next 브랜치)에서는 "Docs Code panel enabled by default", `useThemeParameters` 제거, Node 22.12+, Vite 6.3+, React 18+가 예고돼 있어 10.x에 머무는 동안은 영향 없다. 출처: [MIGRATION 10.x → 11.0.0](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-10x-to-1100).

### 테마 툴바(`@storybook/addon-themes`)

```ts
// .storybook/preview.ts
import { withThemeByDataAttribute } from '@storybook/addon-themes';
export const decorators = [
  withThemeByDataAttribute({
    themes: { light: 'light', dark: 'dark' },
    defaultTheme: 'light',
    attributeName: 'data-theme', // 기본값이 "data-theme"
    // parentSelector: 'html'    // 기본값이 "html"
  }),
];
```

- `withThemeByDataAttribute` 옵션: `themes`(필수), `defaultTheme`(필수), `parentSelector`(기본 `"html"`), `attributeName`(기본 `"data-theme"`). `withThemeByClassName`도 같은 구조에 `parentSelector` 기본 `"html"`. 기본값이 `<html data-theme>`이라 ADR 방식·Portal 요건과 그대로 맞는다. 출처: [addon-themes api.md](https://github.com/storybookjs/storybook/blob/next/code/addons/themes/docs/api.md).
- 스토리별 고정은 `globals: { theme: 'dark' }`. 출처: [addon-themes README](https://github.com/storybookjs/storybook/blob/next/code/addons/themes/README.md).
- Storybook의 Tailwind 레시피는 `preview.ts`에서 CSS를 import하고 `npx storybook@latest add @storybook/addon-themes` 후 두 데코레이터 중 하나를 고르라고 안내한다(레시피의 `tailwind.config.js` `darkMode` 설정은 v3 기준이라 v4에서는 `@custom-variant`가 그 역할). 출처: [Tailwind recipe](https://storybook.js.org/recipes/tailwindcss).

### 서드파티 `storybook-design-token`

- npm 최신 5.0.0(2025-12-09), peer `storybook ^10.0.0`. README: "This is the documentation for v5 which supports Storybook v10 and newer (ESM-only). Please check the v4 branch for Storybook v9, or the v3 branch for Storybook v7 and v8." 출처: npm `storybook-design-token`, [GitHub README](https://github.com/UX-and-I/storybook-design-token).
- 저장소 마지막 push 2025-12-09, archived 아님, 열린 이슈 64개(GitHub API `repos/UX-and-I/storybook-design-token`). 10.x 호환은 맞지만 유지보수 빈도가 낮고 CSS 주석 어노테이션 방식이라, 토큰 수가 적은 이 저장소는 MDX + `ColorPalette`/`Typeset`으로 직접 쓰는 편이 의존성이 덜하다.

### `.storybook/main.ts` 예시(react-vite + a11y + themes + docs)

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  // viteFinal: tailwindcss() 플러그인 추가 — 현재 설정 유지
};
export default config;
```

출처: [Configure Storybook](https://storybook.js.org/docs/configure) 예시 구조에 애드온만 추가. 현재 파일 대비 차이는 `.mdx` 글롭과 `addon-docs`·`addon-themes` 두 패키지 추가다.

### `storybook build`와 CI

- `storybook build [-o dir] [-c .storybook] [--quiet] [--test] [--docs] [--preview-only] [--stats-json]`. 문서용 빌드는 `storybook build --docs`로 "output the documentation into the `storybook-static` folder". GitHub Pages 워크플로 예시는 `npm ci` → `npm run build-storybook` → `storybook-static` 업로드가 전부다. 별도 설정은 필요 없다. 출처: [CLI options](https://storybook.js.org/docs/api/cli-options), [Build documentation](https://storybook.js.org/docs/writing-docs/build-documentation), [Publish Storybook](https://storybook.js.org/docs/sharing/publish-storybook).

## 미확인/불확실

- **`@theme default`의 공개 문서 부재**: 소스(`theme.css`, `theme.ts`)로만 확인했다. 공유 토큰 패키지에서 쓰려면 비공식 동작임을 감수해야 한다.
- **`@import` 문의 위치 제약**: Tailwind 문서·소스에서 "`@import`는 다른 규칙보다 앞에 와야 한다"는 명시 오류를 찾지 못했다. CSS 명세상 `@import`는 `@layer` 선언 외의 규칙 앞에 와야 하므로 관례대로 파일 상단에 두는 것이 안전하다.
- **`ColorItem`에 `var(--color-x)` 전달**: 문서는 "any valid CSS color format"만 말한다. 색 견본이 `background` 속성으로 렌더되면 변수도 동작할 가능성이 높지만, 다크 테마 전환 시 견본이 같이 바뀌는지는 실제 실행으로 확인해야 한다. 변수 대신 `@theme static` + `getComputedStyle`로 값을 읽어 넘기는 대안이 있다.
- **shadcn Form(react-hook-form) 소스**: 이번 조사에서 레지스트리 소스를 직접 열지 않았다. `FormProvider` 범위가 폼 단위라는 것은 react-hook-form 일반 지식이다.
- **Radix 복합 컴포넌트 전수 확인**: Dialog·DropdownMenu·Tabs·Accordion·Popover가 상위 Provider를 요구하지 않는다는 판단은 각 컴포넌트의 Anatomy(모두 `Root`로 시작, 별도 `Provider` 없음)와 Tooltip 소스 비교에 근거한다. 각 소스를 개별로 열어 보지는 않았다.
- **sonner `theme` 기본값**: 공식 Toaster 페이지는 기본값을 `light`로 표기하지만 shadcn 래퍼는 `useTheme()` fallback으로 `"system"`을 넘긴다. Provider 없이 썼을 때 실제 어느 쪽으로 렌더되는지는 실행 확인이 필요하다.
- **`@storybook/addon-docs` 미등록 시 MDX 동작**: 공식 문서는 "Docs is autoconfigured to work out of the box"라고도 하고 MIGRATION은 수동 설치를 요구한다. 설치하지 않은 상태에서 `.mdx`가 인덱싱되는지는 확인하지 않았다. 등록하는 쪽이 문서와 일치한다.
- **storybook-design-token의 실제 10.6 동작**: peer 범위와 README로만 확인했다. 설치 테스트는 하지 않았다.

## ADR 0002와의 대조

| ADR 조항 | 조사 결과 | 조치 |
| --- | --- | --- |
| 테마는 `data-theme` + CSS 변수 | Tailwind 공식 패턴(`@custom-variant dark (&:where([data-theme=dark], …))`)과 addon-themes 기본값(`data-theme` on `html`)이 그대로 지원. **현재 `global.css`는 shadcn 기본 `.dark` 클래스 방식**이라 ADR과 어긋남 | `@custom-variant`·`[data-theme="dark"]` 블록·인라인 스크립트를 `data-theme`로 전환 |
| 컴포넌트는 전역 Provider 없이 동작 | Dialog 등 대부분 충족. **Tooltip은 Radix가 Provider 없으면 throw** — 단 앱 전역일 필요는 없고 컴포넌트/아일랜드 안에서 감싸면 됨. **Sidebar는 `useSidebar` throw**이며 레이아웃 전체가 React여야 함. **Sonner 래퍼는 next-themes에 의존**(throw는 안 함) | Tooltip은 `TooltipProvider`를 `Tooltip` 내부에 포함, Sonner 래퍼는 `useTheme` 제거, Sidebar는 도입 보류 또는 자체 구현 |
| 공유 상태는 작은 스토어 | Astro 공식도 Nano Stores 권장. Tooltip skip-delay 같은 Radix 내부 공유는 아일랜드 간 불가능 | 수용(기능 손실 미미) |
| 토큰 → CSS → React → Storybook 층 | `:root` 원시 토큰 → `@theme inline` 매핑 → `@layer components`/`@utility` → 컴포넌트 → MDX 토큰 페이지로 층이 그대로 대응됨 | `tokens.css`를 분리해 `@import`하고 `@theme static`으로 전수 출력 검토 |
| 테마 속성 위치 | Portal이 `document.body`에 붙으므로 **아일랜드 래퍼에 `data-theme`를 두면 포털 콘텐츠에 적용되지 않음** | `<html data-theme>`로 고정(ADR에 명시 추가 권장) |

## 부록: 글꼴·상태 공유 패키지 확인 (2026-10-23, npm 레지스트리 직접 조회)

| 패키지 | 최신 | 마지막 배포 | 확인 내용 | 출처 |
| --- | --- | --- | --- | --- |
| `pretendard` | 1.3.9 | 2023-11-05 | `dist/web/variable/pretendardvariable-dynamic-subset.css`(55.8 KB) + 동적 서브셋 woff2 92개(개당 32–38 KB). 단일 가변 woff2는 2.06 MB. 글꼴 자체가 1.3.9에서 멈춰 있어 패키지도 갱신이 없다 | https://www.npmjs.com/package/pretendard |
| `@fontsource-variable/bricolage-grotesque` | 5.3.0 | 2026-07-19 | 축 `opsz, wdth, wght`. latin woff2: wght 전용 41.3 KB, 전 축 131.5 KB | https://fontsource.org/fonts/bricolage-grotesque |
| `@fontsource-variable/jetbrains-mono` | 5.3.0 | 2026-07-19 | 축 `wght`. latin woff2 40.4 KB(italic 43.0 KB) | https://www.npmjs.com/package/@fontsource-variable/jetbrains-mono |
| 마루 부리 | — | — | fontsource 없음. 비공식 `@kfonts/maruburi` 0.1.0(2024-05-05, OFL-1.1, 전체 글리프 woff2 굵기당 0.8–0.89 MB)만 있어 npm으로 들이지 않는다. 공식 배포는 네이버 한글한글아름답게(5굵기 OTF/TTF), 라이선스는 SIL OFL | https://hangeul.naver.com/fonts/search?f=maruburi · https://help.naver.com/service/30016/contents/18088 |
| `nanostores` | 1.5.5 | 2026-10-06 | README: "Between 351 and 844 bytes (minified and brotlied)". Astro 공식 문서: "Astro recommends a different solution for shared client-side storage: Nano Stores." | https://github.com/ai/nanostores · https://docs.astro.build/en/recipes/sharing-state-islands/ |
| `@nanostores/react` | 2.0.1 | 2026-09-02 | `useStore()` 훅 제공 | https://www.npmjs.com/package/@nanostores/react |
| `@storybook/addon-themes` | 10.6.3 | 2026-10-20 | `withThemeByDataAttribute` 기본값 `parentSelector: "html"`, `attributeName: "data-theme"` | https://github.com/storybookjs/storybook/blob/next/code/addons/themes/docs/api.md |
