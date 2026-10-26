# 14: 테마 퍼짐과 커서 깜빡임 토큰

**What to build:** 테마 버튼을 누르면 새 테마가 버튼 가운데에서 원형으로 퍼진다. 화면 이동 중, 움직임 줄이기 설정, View Transitions를 지원하지 않는 브라우저에서는 퍼짐 없이 바로 바뀐다. 흐름 로그 커서는 지금처럼 깜빡이지만 시간은 새 모션 토큰 `--motion-blink`에서 온다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

참고: 스펙 [블로그 디테일 1차](../spec.md) "테마 퍼짐"·"커서 깜빡임", 결정 [움직임 디테일과 ClientRouter](02-view-transitions-and-router.md)·[움직임 디테일의 모양](07-motion-shapes.md). 근거 문서는 브랜치 `research/motion-and-client-router`의 `docs/research/motion-and-client-router.md`.

- [ ] 시작점(버튼 가운데)과 반지름(가장 먼 화면 모서리까지)을 계산하는 순수 함수와, 바로 바꿀지 정하는 순수 함수(이동 중·움직임 줄이기·미지원)가 있다. 단위 테스트가 둘을 덮는다
- [ ] 테마 전환은 별도 `document.startViewTransition`으로 그린다. 키프레임과 덮어쓰는 규칙은 CSS 레이어 밖에 있다. 시간은 `--motion-slow`, 이징은 `--motion-easing`이다
- [ ] `<html>`에 `transition:name="root"`가 붙는다. 시작점과 반지름은 `<html>`의 사용자 정의 속성으로 넘기고 전환이 끝나면 지운다
- [ ] 이동 중 판정은 `astro:before-preparation`부터 `astro:page-load`까지다. `suppressThemeTransitions`는 그대로 둔다
- [ ] 원시 토큰에 1100ms 시간 값이 더해지고 의미 토큰 `--motion-blink`가 그것을 가리킨다. 흐름 로그 커서의 하드코딩된 1.1초가 이 토큰으로 바뀐다. 토큰 테스트가 `--motion-blink`의 존재와 값을 본다
- [ ] 빌드 결과물 테스트: `<html>`이 루트 전환 이름을 가진다
- [ ] Storybook 토큰 문서에 `--motion-blink`가 보인다
- [ ] `pnpm verify`·`pnpm qa` 통과. 화면 이동 시나리오의 테마 전환 단계에 콘솔 오류가 없다
