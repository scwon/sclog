# 01: 드래그하면 상자와 복사 버튼이 뜸

**What to build:** 독자가 글 본문을 마우스로 드래그하면 고른 줄들이 본문 폭 상자 하나로 감싸이고, 상자 오른쪽 여백(마우스를 놓은 줄 높이)에 복사 버튼이 뜬다. 버튼을 누르면 고른 글자가 출처 없이 평문으로 복사되고 아이콘이 체크로 바뀐다. 선택이 풀리거나 다른 글로 옮기면 상자와 버튼이 사라진다. 스펙 [selection-toolbar](../spec.md)의 tracer bullet이다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 뜨는지 판정이 순수 함수다: `.doc-prose` 밖, 코드 블록·표·제목·목차 안, 공백 뺀 3자 미만, `(pointer: coarse)`면 뜨지 않는다. Vitest로 덮는다
- [ ] 선택 rect 목록 → 상자(첫 줄 위~끝 줄 아래, 본문 단 폭)와 버튼 자리(오른쪽 여백, 선택 끝 줄 높이, 위로 드래그면 첫 줄)를 계산하는 순수 함수와 테스트
- [ ] 상자는 본문 위 `position: absolute`·`pointer-events: none` 층에 그린다. 본문 DOM을 바꾸지 않고, 나머지 본문을 흐리게 하지 않는다. 두 테마 토큰 색
- [ ] 동작 구조 `{ id, label, icon, mobile, when, run }`와 선택 정보(고른 글자, slug, 바로 위 제목 id). 1차 동작은 `copy` 하나
- [ ] 디자인 시스템에 Radix Popover 래퍼(가상 기준점, `side="right"`, `align="start"`). 새 의존성 없음. Storybook 스토리
- [ ] 복사 버튼은 툴팁·aria-label "복사"이고, 성공하면 체크 아이콘·"복사됨"으로 바뀐다(코드 블록 복사와 같은 방식)
- [ ] 선택이 접히면, `astro:before-swap`이면 걷는다. 화면 이동 뒤 리스너가 하나만 남는다(`docs/agents/astro-client-router.md`)
- [ ] 툴바 청크는 첫 화면에서 정적으로 불리지 않는다
- [ ] `pnpm qa`: 드래그 → 상자와 버튼 → 복사 → 체크. 상자 전후로 본문 요소 위치가 같다
- [ ] `pnpm verify` 통과

## Comments
