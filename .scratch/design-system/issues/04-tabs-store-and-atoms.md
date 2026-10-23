# 04: 탭 스토어와 원자 컴포넌트(Tabs·Badge)

**What to build:** 열린 글이 에디터 탭으로 쌓이고 `×`로 닫히며, 새로고침해도 같은 브라우저 세션 동안 남는 탭 상태 모델을 만든다. `posts.log`는 항상 첫 탭이고 닫히지 않는다. 탭 표시줄 컴포넌트 `Tabs`와 태그·분류용 `Badge`를 두 테마 스토리로 확인한다. 이 티켓에서는 아직 사이트에 붙이지 않고 Storybook에서 동작한다.

**Blocked by:** 03 (테마 스토어와 원자 컴포넌트, nanostores 도입)

**Status:** ready-for-agent

참고: 스펙 "3층" 탭 스토어 항목, ADR 0001 Consequences, 시안 `ide.css` "editor" 탭 절(`.tab`, 코랄 윗선, 새 탭 .32s 펼침)과 `app.js` 탭 처리부.

- [ ] 탭 스토어가 순수 로직 모듈(`addOrActivate(state, file)`, `close(state, url)` → 다음 상태와 다음 활성 URL, `posts.log` 닫기 거부, 중복 추가 무시)과 바인딩 모듈(nanostores `map`, `sessionStorage` 거울 저장·복원)로 나뉘고, 순수 로직에 Vitest 테스트가 있다: 추가·중복·활성 탭 닫기 → 왼쪽 탭·마지막 탭 닫기 → `posts.log`·`posts.log` 닫기 거부
- [ ] `Tabs`가 스토어를 구독해 탭 목록·활성 탭·닫기 버튼을 그리고, 탭은 링크(`<a>`)라 JS 없이도 이동한다. 활성 탭은 코랄 윗선, 새 탭은 왼쪽에서 320ms 펼침, `prefers-reduced-motion`에서는 즉시
- [ ] 키보드: 탭 사이 좌우 화살표 이동, 닫기 버튼은 `aria-label="<제목> 닫기"`
- [ ] `Badge`(태그·분류·읽는 시간용, 작은 모노 글자 변형 포함)가 의미 토큰만 쓴다
- [ ] 두 컴포넌트 스토리가 있고 두 테마에서 a11y 위반이 없다. `Tabs` 스토리는 탭 3개 + 닫기 상호작용을 보여 준다
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
