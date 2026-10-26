# 02: 움직임 디테일과 ClientRouter의 View Transitions

**Type:** research

**Blocked by:** 없음

**Status:** resolved

지도: [블로그 디테일 1차](../map.md)

## Question

아래 움직임 디테일을 Astro `<ClientRouter />`(내부적으로 View Transitions 사용)와 충돌 없이 만들 수 있는가? 만든다면 어떤 방식이어야 하는가?

- 화면을 옮길 때 에디터 내용이 이어지듯 바뀌기: 지금의 펼침(`data-unfold`)과 겹치는지, `transition:name`·`transition:animate`로 되는지
- 테마를 바꿀 때 전환 버튼에서부터 색이 퍼지기: `document.startViewTransition`을 화면 이동 중에 따로 부르면 어떻게 되는지, 지금의 `suppressThemeTransitions`와 어떻게 맞물리는지
- 탭이 닫힐 때 접히며 사라지기: React 아일랜드 안에서 나가는 움직임을 무엇으로 만드는지(CSS만으로 되는지)
- 공통: 지원 브라우저와 미지원 때 대체 동작, 움직임 줄이기 설정 처리

먼저 `docs/agents/astro-client-router.md`를 읽는다. 결과는 `docs/research/motion-and-client-router.md`에 출처와 함께 남긴다.

## Answer

세 움직임 모두 라우터와 부딪히지 않게 만들 수 있다. 자세한 근거는 브랜치 `research/motion-and-client-router`의 `docs/research/motion-and-client-router.md`(커밋 2de4256)에 있다.

- **에디터 전환**: 들어오는 쪽은 기존 펼침에 맡긴다. 나가는 화면만 `--motion-fast` 동안 사라지게 할 수 있다. 새 쪽에 `transition:animate`를 걸면 펼침과 겹치고, `#editor`에 이름을 붙이면 스크롤 차이로 미끄러져 보일 수 있다.
- **테마 원형 번짐**: `document.startViewTransition`을 따로 부르고 CSS 키프레임으로 그린다. `<html>`의 전환 이름이 해시라 `transition:name="root"`를 더하고, 덮어쓰는 규칙은 CSS 레이어 밖에 둔다. 라우터 이동 중에는 번짐 없이 바로 바꾼다. `suppressThemeTransitions`는 그대로 둔다.
- **탭 접힘**: "닫는 중" 상태를 JS로 두고 CSS로 접은 뒤 `animationend`에서 지운다. 순수 CSS나 React `<ViewTransition>`으로는 안 된다.
- **공통**: 문서 단위 전환은 한 번에 하나만 돈다(새 전환이 오면 진행 중인 애니메이션은 끝으로 건너뛰고, DOM 갱신은 끝까지 실행된다). 같은 문서 View Transitions는 Baseline(2025-10)이다. 움직임 줄이기 설정에서 Astro는 CSS 전환만 끄므로, JS 애니메이션과 `animationend` 대기는 직접 막아야 한다.
- **남은 위험**: Safari(`moveBefore()` 없음)에서 창 틀이 옮겨질 때 탭 애니메이션이 다시 돌 수 있다(미확인). 기존 펼침 대상에 글 본문 블록이 들어 있어 지도의 "본문은 정적" 제약과 어긋난다.
