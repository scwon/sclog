# 03: 테마 스토어와 원자 컴포넌트(ThemeToggle·Button·IconButton·Tooltip)

**What to build:** 독자가 테마 전환 버튼을 누르면 창 전체가 밝은/어두운 테마로 바뀌고 선택이 다음 방문에도 남는다. 버튼은 React 아일랜드로, nanostores 테마 스토어를 구독하며 Provider 없이 동작한다. 같은 티켓에서 `Button`·`IconButton`·`Tooltip`(Provider 내장)을 만들어 두 테마 스토리와 a11y 검사를 통과시킨다.

**Blocked by:** 01 (토큰·CSS 기반)

**Status:** ready-for-agent

참고: 스펙 "3층: React 컴포넌트" 스토어·원자 컴포넌트 항목, ADR 0002 Consequences(Tooltip Provider 내장), `docs/research/design-system-tokens.md` 2절, 시안 `ide.css` `.tb-btn`·`.ab-btn`과 `app.js`의 테마 전환부.

- [ ] `nanostores`·`@nanostores/react`가 의존성으로 추가된다
- [ ] 테마 스토어가 순수 로직 모듈(저장값·시스템 설정 → 초기 테마, 토글 → 다음 테마)과 바인딩 모듈(`html[data-theme]` 읽기·쓰기, `localStorage` `theme`, `prefers-color-scheme` 변경 구독은 저장값이 없을 때만)로 나뉘고, 순수 로직에 Vitest 테스트가 있다
- [ ] `ThemeToggle`이 스토어를 구독해 해/달 아이콘을 바꾸고 `aria-label`과 `aria-pressed`를 갖는다. 레이아웃의 옛 `ThemeToggle.astro`는 삭제되고 이 아일랜드(`client:load`)로 대체된다
- [ ] `Button`(variant: 기본·고스트·링크, size: 기본·작음)과 `IconButton`(30px 정사각, 포커스 외곽선)이 의미 토큰 유틸리티만 쓰고 `asChild`를 지원한다
- [ ] `Tooltip`이 shadcn 래퍼를 기반으로 하되 `TooltipProvider`를 컴포넌트 안에 내장해 단독 렌더링에서 throw하지 않는다. 포털 콘텐츠가 `html[data-theme]` 토큰을 따른다
- [ ] 네 컴포넌트에 스토리가 있고, 툴바 두 테마 모두에서 a11y 애드온 위반이 없다
- [ ] 소비자(레이아웃)는 `src/design-system/index.ts`에서만 import한다
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
