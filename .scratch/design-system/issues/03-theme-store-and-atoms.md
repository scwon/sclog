# 03: 테마 스토어와 원자 컴포넌트(ThemeToggle·Button·IconButton·Tooltip)

**What to build:** 독자가 테마 전환 버튼을 누르면 창 전체가 밝은/어두운 테마로 바뀌고 선택이 다음 방문에도 남는다. 버튼은 React 아일랜드로, nanostores 테마 스토어를 구독하며 Provider 없이 동작한다. 같은 티켓에서 `Button`·`IconButton`·`Tooltip`(Provider 내장)을 만들어 두 테마 스토리와 a11y 검사를 통과시킨다.

**Blocked by:** 01 (토큰·CSS 기반)

**Status:** done

참고: 스펙 "3층: React 컴포넌트" 스토어·원자 컴포넌트 항목, ADR 0002 Consequences(Tooltip Provider 내장), `docs/research/design-system-tokens.md` 2절, 시안 `ide.css` `.tb-btn`·`.ab-btn`과 `app.js`의 테마 전환부.

- [x] `nanostores`·`@nanostores/react`가 의존성으로 추가된다
- [x] 테마 스토어가 순수 로직 모듈(저장값·시스템 설정 → 초기 테마, 토글 → 다음 테마)과 바인딩 모듈(`html[data-theme]` 읽기·쓰기, `localStorage` `theme`, `prefers-color-scheme` 변경 구독은 저장값이 없을 때만)로 나뉘고, 순수 로직에 Vitest 테스트가 있다
- [x] `ThemeToggle`이 스토어를 구독해 해/달 아이콘을 바꾸고 `aria-label`과 `aria-pressed`를 갖는다. 레이아웃의 옛 `ThemeToggle.astro`는 삭제되고 이 아일랜드(`client:load`)로 대체된다
- [x] `Button`(variant: 기본·고스트·링크, size: 기본·작음)과 `IconButton`(30px 정사각, 포커스 외곽선)이 의미 토큰 유틸리티만 쓰고 `asChild`를 지원한다
- [x] `Tooltip`이 shadcn 래퍼를 기반으로 하되 `TooltipProvider`를 컴포넌트 안에 내장해 단독 렌더링에서 throw하지 않는다. 포털 콘텐츠가 `html[data-theme]` 토큰을 따른다
- [x] 네 컴포넌트에 스토리가 있고, 툴바 두 테마 모두에서 a11y 애드온 위반이 없다
- [x] 소비자(레이아웃)는 `src/design-system/index.ts`에서만 import한다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 구현 (브랜치 `design-system`)

**결정**

- 의존성은 티켓에 적힌 `nanostores@^1.5.5`, `@nanostores/react@^2.0.1`만 추가했다. 아이콘은 lucide 같은 새 라이브러리를 들이지 않고 시안의 인라인 SVG(해·달·메뉴)를 쓴다. shadcn `button`·`tooltip`은 레지스트리 원본(new-york-v4)을 바탕으로 직접 옮겨 적었다. CLI는 `ui` alias 아래에 납작한 파일을 만드는데, 스펙은 컴포넌트마다 폴더(`<Name>/<Name>.tsx`)를 요구한다.
- 테마 스토어
  - 순수 로직 `stores/theme.logic.ts`: `parseTheme`, `resolveInitialTheme`(저장값 → 시스템 설정 → 어두운 테마), `themeOnSystemChange`(저장값이 있으면 `null`), `nextTheme`, `DEFAULT_THEME`. 테스트는 `stores/theme.test.ts` 7개다.
  - 바인딩 `stores/theme.ts`: `$theme`(atom), `setTheme`(속성 + `localStorage`), `toggleTheme`, `suppressThemeTransitions`.
  - 스토어는 `<html data-theme>`의 거울이다. 구독자가 생기면 `MutationObserver`로 속성 변화를 따라간다. 처음에는 첫 값만 읽었는데, Storybook 툴바가 속성을 바꿔도 스토어가 모르는 버그가 나왔다(툴바는 dark인데 `aria-pressed="true"`, 누르면 같은 테마로 '전환'). 티켓 05의 화면 이동에서도 같은 일이 생길 수 있어 속성을 원본으로 삼았다(ADR 0002).
  - `prefers-color-scheme` 변경은 구독은 늘 하되, 핸들러가 `themeOnSystemChange`로 저장값을 확인해 저장한 선택이 없을 때만 따른다. 이때는 저장하지 않는다.
  - 레이아웃 `<head>` 인라인 스크립트와 순수 로직이 같은 규칙인지는 빌드 결과물 테스트가 맞대어 본다. 저장값 4가지 × 시스템 설정 2가지 × 저장소 예외 2가지, 16개 경우다. 규칙을 바꾸면(시스템 설정 우선) 실패하는 것을 확인했다. 옛 개별 시나리오 검사 3개는 이 대조 검사로 대체했다.
- 테마 전환 순간에는 전환 효과를 끈다. `setTheme`이 `data-theme-switching`을 두 프레임 동안 붙이고, base.css가 그동안 `transition: none`을 건다. 시안 `app.js`의 `theme-switching`과 같은 방식이다. Storybook도 툴바가 `data-theme`를 바꿀 때 같은 헬퍼를 부른다(`.storybook/preview.ts`의 `MutationObserver`). 이게 없으면 색이 옛 테마에서 서서히 바뀌는 동안 a11y 애드온이 검사해, 밝은 테마의 고스트 버튼에서 명암비 오탐(1.57:1)이 났다.
- `ThemeToggle`
  - 이름은 "밝은 테마"로 고정하고 상태는 `aria-pressed`로 알린다.
  - 아이콘은 스토어 값이 아니라 `in-data-[theme=light]:` CSS로 고른다(어두운 테마: 해, 밝은 테마: 달). 서버는 테마를 모르므로, 스토어 값으로 고르면 하이드레이션 전까지 틀린 아이콘이 보인다. 티켓 문구("스토어를 구독해 해/달 아이콘을 바꾸고")와 결과는 같지만 수단이 다르다.
  - `aria-pressed`는 `useStore($theme, { ssr: () => DEFAULT_THEME })`로 서버 스냅샷을 기본 테마로 둔다. 그래서 하이드레이션 때는 서버와 같은 값으로 그리고, 그 뒤 실제 값으로 다시 그린다.
  - `Header.astro`가 `import { ThemeToggle } from '@/design-system'` 뒤 `<ThemeToggle client:load />`로 쓰고, 옛 `ThemeToggle.astro`는 지웠다.
- `Button`: variant default(올린 바탕 + 선, 마우스를 올리면 코랄 선과 선택 바탕, 시안 `.step`), ghost, link(마우스를 올리면 코랄 밑줄이 그어짐, 시안 `.pen`)가 있다. size는 default 36px·sm 30px이고, `IconButton`용 `icon`(30px 정사각)이 하나 더 있다. 포커스 외곽선은 base.css의 `:focus-visible`(2px, 글자색)이다. link의 밑줄은 `bg-linear-to-r from-accent to-accent bg-size-[…]` 유틸리티로 그린다. `type` 기본값은 `button`이다.
- `IconButton`: `label`(접근 가능한 이름)을 필수 prop으로 받는다. 흐린 글자색이고 아이콘은 18px다. `asChild`를 지원한다.
- `Tooltip`: `Tooltip` 안에 `TooltipPrimitive.Provider`를 품는다(기본 지연 300ms). 내용은 바탕·글자를 뒤집은 색(`bg-text text-surface`)이고 `motion-reduce:animate-none`을 건다. 포털이 `body`에 붙어도 토큰이 `<html>`에 있어 테마를 따른다(Open 스토리 두 테마에서 확인).
- 공개 진입점 `src/design-system/index.ts`는 `Button`, `IconButton`, `ThemeToggle`, `Tooltip`·`TooltipTrigger`·`TooltipContent`, `$theme`·`setTheme`·`toggleTheme`, 타입을 내보낸다. `buttonVariants`는 내보내지 않는다.

**측정값·확인**

- 접근성: a11y 애드온과 같은 axe-core 4.14.0을 브라우저에서 스토리 14개 × 두 테마(28회)에 돌렸고 위반 0건이다. 페이지 단위 규칙(`landmark-one-main`·`page-has-heading-one`·`region`)은 컴포넌트 검사라서 뺐다.
- 동작: Storybook과 빌드한 사이트에서 버튼을 눌러 봤다. 속성·`aria-pressed`·아이콘·`localStorage`가 함께 바뀌고 새로고침해도 남는다. 사이트 콘솔에 하이드레이션 경고는 없다.
- 번들: 아일랜드 청크 `index.*.js` 88,369B(gzip 32,686B), React 런타임 `client.*.js` 209,072B(gzip 64,972B).
- 테스트 81개 통과(토큰 37, 빌드 결과물 30, 테마 로직 7, 기존 `blog.test.ts` 7). `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.

**남은 것**

- 아일랜드 청크에 `ThemeToggle`만이 아니라 배럴의 모든 export(Radix Tooltip 포함)가 실린다. Astro는 컴포넌트를 가져온 모듈(`index.ts`)을 진입점으로 번들하고 export 이름으로 꺼내 쓰므로 트리 셰이킹이 안 된다. 티켓 05에서는 `Shell`이 사실상 유일한 아일랜드가 되고 이 원자들을 모두 쓰므로 비용이 거의 사라진다. 그래도 아일랜드가 늘면 "소비자는 `index.ts`만 import" 규칙을 아일랜드에 한해 하위 경로로 풀지 다시 정해야 한다.
- 티켓 05에서 `<ClientRouter />`가 페이지를 바꿀 때 `<html>` 속성이 새 문서 것으로 바뀌는지 확인해야 한다. 스토어는 속성 변화를 따라가지만, 속성 자체가 저장값과 어긋나면 `astro:after-swap`에서 다시 붙여야 한다.
