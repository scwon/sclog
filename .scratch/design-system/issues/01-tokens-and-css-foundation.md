# 01: 토큰·CSS 기반을 깔고 옛 스타일 체계를 제거한다

**What to build:** 사이트가 새 디자인 시스템의 토큰(원시·의미 2단계, 어두운/밝은 테마)과 Tailwind `@theme inline` 유틸리티만으로 그려지고, 옛 토큰 체계(레이아웃 인라인 변수, shadcn 무채색 변수, `.dark` 클래스, Google Fonts 링크, shadcn `button`·`badge`·`card`)는 사라진다. Storybook에는 색·반경·모션 토큰 문서 페이지가 생기고 툴바로 두 테마를 오간다. 기존 페이지(홈·글·태그·404)는 옛 레이아웃 그대로지만 새 토큰 색으로 빌드된다. 통합 브랜치 `design-system`을 이 티켓이 만든다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

참고: 스펙 `.scratch/design-system/spec.md` "1층·2층·4층", ADR 0002·0003, `docs/research/design-system-tokens.md` 1·3절, 토큰 값 출처는 시안 `ide.css`의 `:root`/`[data-theme="light"]`와 `styles.css`.

- [ ] `src/design-system/tokens/`에 원시 토큰(팔레트·치수·모션 값)과 의미 토큰(두 테마) 파일이 있고, 의미 토큰 값은 전부 원시 토큰 참조다. 색 역할 이름은 스펙의 surface/text/border/accent/prose/code/state/marker/scrim 체계를 따른다
- [ ] `src/design-system/styles/`의 진입점이 `@theme inline`으로 의미 토큰·반경·이징만 노출하고, Tailwind 기본 색 팔레트는 `--color-*: initial`로 꺼져 `bg-red-500` 같은 유틸리티가 생성되지 않는다
- [ ] 다크 변형은 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`이고 저장소 어디에도 `.dark` 선택자·`:is(.dark *)`가 없다
- [ ] `<html data-theme>`를 첫 페인트 전에 정하는 인라인 스크립트가 레이아웃 `<head>`에 있다: `localStorage` `theme` → `prefers-color-scheme` → `dark`. 속성이 없을 때 CSS는 어두운 테마다
- [ ] 레이아웃의 인라인 `:root` 토큰과 Google Fonts `<link>`가 제거되고, 전역 CSS는 디자인 시스템 진입점 import 한 줄이다. 기존 Astro 컴포넌트의 `:global(.dark)` 스타일은 새 토큰 유틸리티나 `dark:` 변형으로 바뀐다
- [ ] shadcn `button`·`badge`·`card`와 스토리가 삭제되고, `components.json`의 `ui` alias는 `@/design-system/components`, `tailwind.css`는 새 진입점을 가리킨다
- [ ] Storybook에 `@storybook/addon-docs`·`@storybook/addon-themes`가 등록되고 `withThemeByDataAttribute`(기본값 `data-theme`·`html`)로 툴바에서 dark/light를 바꾼다. `src/design-system/docs/Tokens.mdx`가 `ColorPalette`로 두 테마 색을, 반경·모션 값을 보여 주며 색 견본은 CSS 변수를 런타임에 읽어 툴바와 함께 바뀐다
- [ ] 토큰 파일 테스트(Vitest node): 두 테마 의미 토큰 이름 집합 일치 / 의미 토큰에 리터럴 값 없음 / 글자·바탕 쌍(text·text-soft·text-muted·prose ↔ surface·surface-panel·surface-raised, on-accent ↔ accent, accent-text ↔ surface) 명암비가 본문 4.5:1·보조 3:1 이상, 두 테마 모두
- [ ] 빌드 결과물 테스트(Vitest node, `dist/` 없으면 skip): `/blog/pro-developer-2023-days/`·`/blog/`·태그 페이지·`/404.html` 존재, 모든 HTML에 테마 초기 스크립트, `class="dark"`·`fonts.googleapis.com` 없음
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
