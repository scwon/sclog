# 01: 드래그하면 상자와 복사 버튼이 뜸

**What to build:** 독자가 글 본문을 마우스로 드래그하면 고른 줄들이 본문 폭 상자 하나로 감싸이고, 상자 오른쪽 여백(마우스를 놓은 줄 높이)에 복사 버튼이 뜬다. 버튼을 누르면 고른 글자가 출처 없이 평문으로 복사되고 아이콘이 체크로 바뀐다. 선택이 풀리거나 다른 글로 옮기면 상자와 버튼이 사라진다. 스펙 [selection-toolbar](../spec.md)의 tracer bullet이다.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] 뜨는지 판정이 순수 함수다: `.doc-prose` 밖, 코드 블록·표·제목·목차 안, 공백 뺀 3자 미만, `(pointer: coarse)`면 뜨지 않는다. Vitest로 덮는다
- [x] 선택 rect 목록 → 상자(첫 줄 위~끝 줄 아래, 본문 단 폭)와 버튼 자리(오른쪽 여백, 선택 끝 줄 높이, 위로 드래그면 첫 줄)를 계산하는 순수 함수와 테스트
- [x] 상자는 본문 위 `position: absolute`·`pointer-events: none` 층에 그린다. 본문 DOM을 바꾸지 않고, 나머지 본문을 흐리게 하지 않는다. 두 테마 토큰 색
- [x] 동작 구조 `{ id, label, icon, mobile, when, run }`와 선택 정보(고른 글자, slug, 바로 위 제목 id). 1차 동작은 `copy` 하나
- [x] 디자인 시스템에 Radix Popover 래퍼(가상 기준점, `side="right"`, `align="start"`). 새 의존성 없음. Storybook 스토리
- [x] 복사 버튼은 툴팁·aria-label "복사"이고, 성공하면 체크 아이콘·"복사됨"으로 바뀐다(코드 블록 복사와 같은 방식)
- [x] 선택이 접히면, `astro:before-swap`이면 걷는다. 화면 이동 뒤 리스너가 하나만 남는다(`docs/agents/astro-client-router.md`)
- [x] 툴바 청크는 첫 화면에서 정적으로 불리지 않는다
- [x] `pnpm qa`: 드래그 → 상자와 버튼 → 복사 → 체크. 상자 전후로 본문 요소 위치가 같다
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `feat/selection-toolbar-01`)

**결정**

- 모듈은 셋으로 나눴다. 순수 판정은 `components/SelectionToolbar/selection.logic.ts`, DOM 감시는 `selection.ts`(첫 화면 청크에 실린다)가 맡는다. 그리기는 `SelectionToolbar.tsx`에 두고 처음 본문을 고를 때 `import()`로 불러온다. 소비자는 `watchSelectionToolbar({ actions, label })`와 `closeSelectionToolbar()` 두 개만 쓴다(`BlogPost.astro`의 번들 스크립트, 한 번만 돈다).
- `Popover`는 `index.ts`에서 export하지 않는다. export하면 첫 화면 청크(`design-system.*.js`)로 끌려와 120KB가 되고, 빼면 101KB다. 툴바 청크는 약 21KB.
- 판정 입력은 선택 끝마다 조상 요소 목록(`{ name, id, classes }`)이다. 순수 함수가 `#content`/`.doc-prose`에 닿기 전에 제외 요소를 만나는지 본다. 제외 요소는 `pre`, `.code-block-wrapper`(코드 블록 머리), `table`, `h1`~`h6`, `nav`이다. 문장 속 인라인 `code`는 일반 글자로 본다. 스펙의 "`code` 블록"은 코드 블록으로 읽었다.
- 3자 기준은 공백을 뺀 코드 포인트 수(`MIN_SELECTED_CHARS`)로 잰다.
- `getClientRects()`는 글자 높이만 준다. 선택색은 줄 상자 높이(본문 `line-height`)로 칠해지므로 낮은 rect를 그 높이까지 넓혀 잰다(`lineHeight` 입력). 상자 여백은 가로 10px, 세로 6px(`BOX_PADDING`)이다. 끝 줄은 `backward`(focus가 range 시작과 같음)로 고른다. 여러 줄을 감싼 요소 rect와 변이 겹치면 짧은 rect를 줄로 본다.
- 층은 `article.doc[data-doc]` 맨 앞에 붙는다(`position: absolute; inset: 0`). `.doc-prose > *`가 `position: relative`라 글자가 상자 위에 그려진다. `.doc-prose`에는 넣지 않는다.
- 상자 색은 `border-border-strong`와 `bg-state-current`이다. 고른 글자는 선택색(`--marker`)이 한 겹 더 깔리므로 `tokens.test.ts`에서 `--prose`가 marker·state-current·surface를 겹친 바탕 위에서 4.5:1 이상인지 두 테마 모두 확인한다.
- 동작 타입에 `done?: { label, icon }`을 더했다. `run`이 참을 돌려주면 2초(`DONE_MS`) 동안 그 이름·아이콘으로 바뀐다. 복사 동작과 문구("복사", "복사됨", 묶음 이름 "선택 툴바")는 소비자 `src/components/blog/selection-actions.tsx`에 둔다. 아이콘 `CopyIcon`·`CheckIcon`은 디자인 시스템에서 export한다.
- 버튼 묶음은 `role="toolbar"`, `aria-orientation="vertical"`이다(`role="group"`은 jsx-a11y가 막는다). 동작이 둘 이상이 되면 화살표 키 이동을 더해야 한다.
- 포커스와 선택은 이렇게 지킨다. `onOpenAutoFocus`·`onCloseAutoFocus`를 막고, 내용의 `mousedown`을 막아 버튼을 눌러도 선택이 남게 했다. Radix의 Esc·바깥 누름 닫기(`onEscapeKeyDown`·`onInteractOutside`)도 막고, 닫힘은 선택 상태만 따른다. Esc는 티켓 03에서 `shortcutFor`로 붙인다.
- 툴바 z-index는 15로, 경로 표시줄(20)·탭(30) 아래에 둔다.
- 떠 있는 동안 선택이 바뀌거나 창 크기가 바뀌면 자리를 다시 잰다. 키보드로 새로 고른 선택을 띄우는 일과 debounce는 티켓 03 몫이다.
- `GLOSSARY.md`에 **선택 툴바**를 이 티켓에서 더했다(새 개념을 쓰는 변경에서 함께 고친다는 CODING_STANDARDS 규칙).
- `scripts/qa/nav.mjs`의 콘솔 오류 확인이 `Uncaught (in promise)`만 보이던 것을 예외 설명까지 보이게 고쳤다.
- 측정(1440×900, 어두운 테마): 세 줄 선택에서 상자 700×154px, 버튼은 상자 오른쪽 9px 밖이다. 상자를 그리기 전후로 `.doc-prose > *` 위치가 같다. 복사한 글자는 `Selection.toString()`과 같다.
