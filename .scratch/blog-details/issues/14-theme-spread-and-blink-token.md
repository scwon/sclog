# 14: 테마 퍼짐과 커서 깜빡임 토큰

**What to build:** 테마 버튼을 누르면 새 테마가 버튼 가운데에서 원형으로 퍼진다. 화면 이동 중, 움직임 줄이기 설정, View Transitions를 지원하지 않는 브라우저에서는 퍼짐 없이 바로 바뀐다. 흐름 로그 커서는 지금처럼 깜빡이지만 시간은 새 모션 토큰 `--motion-blink`에서 온다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "테마 퍼짐"·"커서 깜빡임", 결정 [움직임 디테일과 ClientRouter](02-view-transitions-and-router.md)·[움직임 디테일의 모양](07-motion-shapes.md). 근거 문서는 브랜치 `research/motion-and-client-router`의 `docs/research/motion-and-client-router.md`.

- [x] 시작점(버튼 가운데)과 반지름(가장 먼 화면 모서리까지)을 계산하는 순수 함수와, 바로 바꿀지 정하는 순수 함수(이동 중·움직임 줄이기·미지원)가 있다. 단위 테스트가 둘을 덮는다
- [x] 테마 전환은 별도 `document.startViewTransition`으로 그린다. 키프레임과 덮어쓰는 규칙은 CSS 레이어 밖에 있다. 시간은 `--motion-slow`, 이징은 `--motion-easing`이다
- [x] `<html>`에 `transition:name="root"`가 붙는다. 시작점과 반지름은 `<html>`의 사용자 정의 속성으로 넘기고 전환이 끝나면 지운다
- [x] 이동 중 판정은 `astro:before-preparation`부터 `astro:page-load`까지다. `suppressThemeTransitions`는 그대로 둔다
- [x] 원시 토큰에 1100ms 시간 값이 더해지고 의미 토큰 `--motion-blink`가 그것을 가리킨다. 흐름 로그 커서의 하드코딩된 1.1초가 이 토큰으로 바뀐다. 토큰 테스트가 `--motion-blink`의 존재와 값을 본다
- [x] 빌드 결과물 테스트: `<html>`이 루트 전환 이름을 가진다
- [x] Storybook 토큰 문서에 `--motion-blink`가 보인다
- [ ] `pnpm verify`·`pnpm qa` 통과. 화면 이동 시나리오의 테마 전환 단계에 콘솔 오류가 없다

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/14-theme-spread-and-blink-token`)

**결정**

- 진입점은 기존 `toggleTheme()`(`@/design-system`에서 내보냄) 하나다. 버튼과 팔레트 명령(티켓 22)이 같은 함수를 부르고, 함수가 `[data-theme-toggle]`(ThemeToggle이 붙이는 표지)를 찾아 그 가운데에서 퍼뜨린다. 버튼을 인자로 받지 않으니 팔레트는 아무것도 넘기지 않고 부르면 된다. 테마 버튼이 없는 화면에서는 바로 바꾼다. `setTheme()`과 시스템 설정 따라가기는 지금처럼 퍼짐 없이 바로 바뀐다.
- 순수 함수는 `theme.logic.ts`의 `spreadCircle(button, viewport)`와 `switchesInstantly({ navigating, reducedMotion, supported })`다. 미지원 판정은 `'startViewTransition' in document`로 한다.
- 이동 중 플래그는 `theme.ts` 모듈에서 `astro:before-preparation`·`astro:page-load` 리스너로 둔다. 모듈이 창 틀 아일랜드와 함께 한 번만 실행되므로 리스너가 쌓이지 않는다. `document.activeViewTransition`은 쓰지 않았다(가져오는 구간을 모르고 Safari 26.2부터라서).
- `<html>` 표지는 `data-theme-spread`, 원은 `--theme-spread-x|y|r`(px)이다. 키프레임 `theme-spread`와 덮어쓰는 규칙은 `motion.css` 맨 아래, 레이어 밖에 두었다. 빌드 CSS에서도 레이어 없이 `@media (prefers-reduced-motion: no-preference)` 안에만 있는 것을 확인했다. 앞 퍼짐이 다음 퍼짐에 건너뛰어졌을 때 앞의 정리가 다음 퍼짐의 속성을 지우지 않도록, 가장 최근 전환만 정리한다. 정리한 뒤 `<html>`에 빈 `style=""`가 남는데 그대로 두었다.
- 원시 토큰 이름은 `--duration-1100`, 의미 토큰은 `--motion-blink`(주석 "커서 깜빡임 한 주기")다. Storybook 토큰 문서는 `semantic.css`를 읽으므로 따로 고칠 것이 없었다.
- 빌드 결과물 테스트는 `<html>`의 `data-astro-transition-scope`를 읽고, 같은 페이지의 `<style>`에 `[data-astro-transition-scope="…"] { view-transition-name: root; }`가 있는지 본다.
- 용어집에 "테마 퍼짐"을 더했다.

**측정값** (ego-browser, `astro preview` 4314 포트, 1200×882)

- 버튼을 누르면 `::view-transition-new(root)`에 `theme-spread` 애니메이션 하나가 450ms로 걸린다. 시작점 (1177, 18.5)은 버튼 가운데와 같고 반지름은 1459.8px, `<html>`의 계산된 전환 이름은 `root`다. 끝나면 `data-theme-spread`와 세 속성이 지워진다.
- 바로 바뀌는 세 경우를 확인했다. `astro:before-preparation` 뒤에는 전환을 시작하지 않고, `astro:page-load` 뒤에는 다시 퍼진다. 움직임 줄이기를 흉내 내도, `startViewTransition`을 지워도 전환 없이 테마가 바뀐다. 실제 링크 이동 직후에 테마를 바꿔도 콘솔 오류가 없었고, 새 화면에 바뀐 테마가 이어졌다.
- `pnpm qa`는 지침에 따라 돌리지 않았다. 통합 브랜치에서 확인한다. 화면 이동 시나리오의 테마 단계는 클릭 뒤 500ms를 기다리는데, 퍼짐(450ms) 동안에는 `<html>`이 캡처돼 클릭이 문서 요소로 간다. ego가 느리게 그리면 다음 클릭이 퍼짐과 겹칠 수 있다.
