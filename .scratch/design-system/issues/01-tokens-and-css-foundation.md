# 01: 토큰·CSS 기반을 깔고 옛 스타일 체계를 제거한다

**What to build:** 사이트가 새 디자인 시스템의 토큰(원시·의미 2단계, 어두운/밝은 테마)과 Tailwind `@theme inline` 유틸리티만으로 그려지고, 옛 토큰 체계(레이아웃 인라인 변수, shadcn 무채색 변수, `.dark` 클래스, Google Fonts 링크, shadcn `button`·`badge`·`card`)는 사라진다. Storybook에는 색·반경·모션 토큰 문서 페이지가 생기고 툴바로 두 테마를 오간다. 기존 페이지(홈·글·태그·404)는 옛 레이아웃 그대로지만 새 토큰 색으로 빌드된다. 통합 브랜치 `design-system`을 이 티켓이 만든다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 `.scratch/design-system/spec.md` "1층·2층·4층", ADR 0002·0003, `docs/research/design-system-tokens.md` 1·3절, 토큰 값 출처는 시안 `ide.css`의 `:root`/`[data-theme="light"]`와 `styles.css`.

- [x] `src/design-system/tokens/`에 원시 토큰(팔레트·치수·모션 값)과 의미 토큰(두 테마) 파일이 있고, 의미 토큰 값은 전부 원시 토큰 참조다. 색 역할 이름은 스펙의 surface/text/border/accent/prose/code/state/marker/scrim 체계를 따른다
- [x] `src/design-system/styles/`의 진입점이 `@theme inline`으로 의미 토큰·반경·이징만 노출하고, Tailwind 기본 색 팔레트는 `--color-*: initial`로 꺼져 `bg-red-500` 같은 유틸리티가 생성되지 않는다
- [x] 다크 변형은 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`이고 저장소 어디에도 `.dark` 선택자·`:is(.dark *)`가 없다
- [x] `<html data-theme>`를 첫 페인트 전에 정하는 인라인 스크립트가 레이아웃 `<head>`에 있다: `localStorage` `theme` → `prefers-color-scheme` → `dark`. 속성이 없을 때 CSS는 어두운 테마다
- [x] 레이아웃의 인라인 `:root` 토큰과 Google Fonts `<link>`가 제거되고, 전역 CSS는 디자인 시스템 진입점 import 한 줄이다. 기존 Astro 컴포넌트의 `:global(.dark)` 스타일은 새 토큰 유틸리티나 `dark:` 변형으로 바뀐다
- [x] shadcn `button`·`badge`·`card`와 스토리가 삭제되고, `components.json`의 `ui` alias는 `@/design-system/components`, `tailwind.css`는 새 진입점을 가리킨다
- [x] Storybook에 `@storybook/addon-docs`·`@storybook/addon-themes`가 등록되고 `withThemeByDataAttribute`(기본값 `data-theme`·`html`)로 툴바에서 dark/light를 바꾼다. `src/design-system/docs/Tokens.mdx`가 `ColorPalette`로 두 테마 색을, 반경·모션 값을 보여 주며 색 견본은 CSS 변수를 런타임에 읽어 툴바와 함께 바뀐다
- [x] 토큰 파일 테스트(Vitest node): 두 테마 의미 토큰 이름 집합 일치 / 의미 토큰에 리터럴 값 없음 / 글자·바탕 쌍(text·text-soft·text-muted·prose ↔ surface·surface-panel·surface-raised, on-accent ↔ accent, accent-text ↔ surface) 명암비가 본문 4.5:1·보조 3:1 이상, 두 테마 모두
- [x] 빌드 결과물 테스트(Vitest node, `dist/` 없으면 skip): `/blog/pro-developer-2023-days/`·`/blog/`·태그 페이지·`/404.html` 존재, 모든 HTML에 테마 초기 스크립트, `class="dark"`·`fonts.googleapis.com` 없음
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-23 구현 (브랜치 `design-system`)

**결정**

- 원시 토큰 이름: 팔레트는 `--palette-<색군>-<숫자>`이고 숫자는 (1 − OKLCH 명도) × 1000을 반올림한 값이다(클수록 어둡다). 투명도 변형은 `-aN`(N%)이며 3.5%는 `a3_5`로 쓴다. 반경은 `--corner-6/8/12/14`, 모션은 `--easing-standard`·`--duration-160…450`·`--stagger-unfold`, 창 치수는 `--window-*`, 타이포 스케일은 `--type-*`다. 창 치수와 타이포 스케일에는 "구현 중 조정 가능" 주석을 달았다.
- 의미 토큰 CSS 변수는 접두사 없이 `--surface`, `--text-muted`처럼 짓고, `@theme inline`이 `--color-surface: var(--surface)`로 매핑한다. 같은 이름으로 두면 자기 참조가 된다.
- 반경은 `--radius-*: initial` 뒤에 `sm/md/lg/xl` = 6/8/12/14px만 노출한다. 이징은 Tailwind 기본값(`ease-in/out`)을 남기고 `ease-standard`만 추가했다. 지속 시간은 Tailwind의 `duration-<숫자>`가 임의 값을 받으므로 노출하지 않는다.
- `color-scheme`은 토큰이 아니어서 1층이 아닌 `styles/base.css`에 뒀다.
- Tailwind 클래스 스캔을 `@import 'tailwindcss' source('../..')`로 `src/`에 한정했다. 저장소 전체를 스캔하면 `.claude/skills` 예제와 `docs`·`specs`의 클래스까지 생성돼 전역 CSS가 26.2KB였는데, 한정하니 17.5KB가 됐다(gzip 6.3KB → 4.5KB).
- 기존 사이트는 `global.css`를 import하지 않아 Tailwind가 꺼져 있었다. 이번에 `BaseLayout`이 `global.css`(진입점 import 한 줄)를 불러오므로 Preflight가 처음 적용됐다. 옛 화면의 목록 글머리표, 본문 `h1` 크기 같은 기본 스타일이 조금 바뀌었고, 본문 타이포는 티켓 07의 prose에서 다시 잡는다.
- 쓰는 곳이 없던 Astro 스타터 잔재 `src/layouts/Layout.astro`(인라인 `:root` 변수 `--accent-gradient` 등)와 그 변수를 쓰던 `src/components/Card.astro`도 지웠다.
- `tw-animate-css` import는 2층 진입점으로 옮겨 유지했다. 이후 들일 shadcn 원자 컴포넌트(Tooltip 등)가 쓴다.
- 옛 Astro 컴포넌트의 `var(--color-*)`는 의미 토큰으로 옮겼다. 글자색 코랄은 `--accent-text`, 바탕·선 코랄은 `--accent`, 태그 글자는 `--on-accent`를 쓴다. `:global(.dark)` 덮어쓰기는 지웠고, `ThemeToggle` 아이콘은 `dark:hidden`·`hidden dark:block`으로 바꿨다. `ThemeToggle` 스크립트와 Giscus 테마 동기화(`Comments.astro`)도 `data-theme`를 읽고 쓴다.
- 코드 블록 색(`CodeBlock.astro`의 `#2d2d2d` 등, `BlogPost.astro`의 `pre` 바탕 `#1e1e1e`)은 그대로 뒀다. 어두운 Shiki 테마와 짝인 고정값이라 사이트 테마 토큰으로 옮기면 밝은 테마에서 머리줄만 밝아진다. 코드 표시는 티켓 07에서 다룬다.
- 옛 컴포넌트에서 쓰던 `--max-width-wide`(1000px)와 `--radius-tag`(9999px)는 새 체계의 토큰이 아니라서 숫자로 풀었다. 티켓 05~07에서 화면이 바뀔 때 함께 사라진다.
- Storybook: addon-themes 데코레이터는 스토리를 그릴 때만 `<html data-theme>`를 바꾼다. 그래서 `Tokens.mdx`를 `Tokens.stories.tsx`(견본 스토리 `Sample`)에 붙였고, 견본 컴포넌트가 `MutationObserver`로 속성 변화를 감지해 CSS 변수를 다시 읽는다. 툴바 토글로 두 테마가 바뀌는 것을 ego-browser로 확인했다. 토큰 이름은 `semantic.css`·`primitives.css`·`styles/index.css`를 `?raw`로 읽어 만들므로 문서에 이름 목록을 따로 두지 않는다.
- 테스트는 토큰 파일과 빌드 결과물 두 시임만 쓴다. 토큰 테스트에는 "의미 토큰 전부가 `@theme inline`에 매핑됐다"는 검사를 하나 더 넣었다(리뷰 지적 반영). 빌드 결과물 테스트는 `<head>`의 테마 스크립트를 꺼내 가짜 `localStorage`·`matchMedia` 위에서 실행해 저장값 → 시스템 설정 → 어두운 테마 순서를 확인한다.

**측정값**

- 명암비(어두운 / 밝은, 바탕은 surface·surface-panel·surface-raised 순):
  - text 14.08·13.54·12.37 / 14.64·13.68·15.29
  - text-soft 9.73·9.36·8.55 / 9.63·9.00·10.06
  - text-muted(보조, 기준 3:1) 5.86·5.63·5.14 / 5.77·5.39·6.02
  - prose 11.83·11.38·10.40 / 13.23·12.36·13.82
  - on-accent ↔ accent 8.03 / 8.03, accent-text ↔ surface 8.40 / 5.22
- 토큰·CSS 파일: `primitives.css` 2,863B, `semantic.css` 2,386B, `tokens/index.css` 128B, `styles/index.css` 1,963B, `styles/base.css` 475B
- 빌드 CSS: 전역 `Header.*.css` 17,482B(gzip 4,502B), 글 페이지 `_slug_.*.css` 6,781B, 홈 `index.*.css` 5,435B
- Tailwind 컴파일 확인: `bg-red-500`·`text-white`·`bg-black`·`rounded-2xl`은 생성되지 않고 `bg-surface-panel` → `var(--surface-panel)`, `rounded-md` → `var(--corner-8)`이 생성된다.
- 테스트 52개 통과(토큰 34, 빌드 결과물 11, 기존 `blog.test.ts` 7). `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.

**남은 것·열린 질문**

- ADR 0003은 "IDE 용어는 컴포넌트 이름에만"이라고 하는데, 원시 토큰 `--window-titlebar`·`--window-explorer` 등에는 IDE 용어가 들어 있다. ADR 문단의 주어가 의미 토큰이라 원시 토큰은 예외로 봤다. ADR에 이 예외를 적을지는 결정이 필요하다.
- 스펙 4층은 토큰 문서에 창 치수(와 타이포 스케일)도 보여 달라고 하지만 01~08 어느 티켓도 맡지 않았다. 이 티켓의 문서는 색·반경·모션까지다.
- 소비자 Astro `<style>`이 `var(--radius-md)` 같은 Tailwind 테마 변수를 쓴다. Tailwind는 소스에서 `var()` 사용을 감지해 그 변수를 출력하므로 지금은 동작하고, `src/` 스캔 범위 안에 있는 한 유지된다.
- Giscus 위젯은 `data-theme="light"`로 처음 로드된다. `load` 이벤트 시점에 iframe이 아직 없으면 테마 전환 전까지 밝은 테마로 남을 수 있다(이번 변경 전부터 있던 동작). 티켓 07에서 댓글을 에디터 안으로 옮길 때 같이 본다.
