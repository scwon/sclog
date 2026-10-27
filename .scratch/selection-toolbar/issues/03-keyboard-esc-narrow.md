# 03: 키보드 선택, Esc, 찾기와의 경계, 좁은 폭

**What to build:** 키보드로 골라도 선택 툴바가 뜨고, Esc·찾기 줄과 엉키지 않으며, 어느 폭에서도 버튼이 화면 안에 보인다.

**Blocked by:** 01

**Status:** done

- [x] Shift+화살표 선택은 `selectionchange`를 짧게 미뤄 그린다. 툴바가 떠도 포커스는 본문에 남고 Tab으로 들어갈 수 있다
- [x] Esc가 툴바를 맨 먼저 닫는다(툴바 → 팔레트 → 겹침 패널 → 찾기 줄). `shortcutFor`에 더하고 리스너를 새로 걸지 않는다. 키 판정 테스트
- [x] 찾기 줄이 열리면 툴바를 닫는다. 하이라이트 이름이 찾기의 `find-match`·`find-current`와 겹치지 않는다
- [x] 오른쪽 여백이 버튼 폭보다 좁으면 버튼을 상자 안쪽 오른쪽 위로 들인다. 상자가 화면보다 길면 버튼 세로 위치를 화면 안으로 묶는다. 자리 계산 테스트에 두 경우를 더한다
- [x] `docs/agents/shortcuts.md` Esc 순서와 `GLOSSARY.md`의 **선택 툴바** 항목
- [x] `pnpm qa`: Esc로 닫힘, 툴바가 뜬 상태를 세 폭 × 두 테마 axe
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `feat/selection-toolbar-03`)

**결정**

- 툴바가 떠 있는지는 `stores/selectionToolbar.ts`의 `$selectionToolbarOpen`이 알린다. 감시(`selection.ts`)만 값을 바꾸고, 창 틀은 이 값을 `shortcutFor` 맥락 `toolbarOpen`으로 넘긴다. 걷는 함수는 `dismissSelectionToolbar()`다. 상자와 버튼만 걷고 고른 글자는 남기므로 ⌘C가 그대로 되고, 선택을 다시 바꾸면 툴바가 다시 뜬다.
- Esc 판정은 스펙 순서대로 선택 툴바를 맨 앞에 둔다. 팔레트 입력창에 포커스가 있어도 툴바가 떠 있으면 툴바부터 닫는다. 다른 입력창(`text`)의 Esc는 지금처럼 입력창에 맡긴다. 리스너는 새로 걸지 않았다.
- 키보드 선택: 툴바가 떠 있지 않을 때 마우스로 고르는 중이 아닌 `selectionchange`가 오면 250ms(`KEYBOARD_SETTLE_MS`) 동안 멈춘 뒤 그린다. 이미 떠 있으면 지금처럼 바로 자리를 다시 잰다. 기다리는 사이 마우스를 누르면 그리지 않는다. 캐럿 브라우징이 꺼진 Chrome은 접힌 선택을 Shift+화살표로 넓히지 않으므로, QA는 한 글자 선택에서 Shift+→로 넓힌다.
- 찾기 줄: 창 틀이 `findOpen`이 참이 되면 `dismissSelectionToolbar()`를 부른다. ⌘F가 고른 글자를 검색어로 넣은 다음이다. 선택 툴바는 CSS Highlight를 쓰지 않고 층 안의 상자 요소로 그리므로 `find-match`·`find-current`와 이름이 겹칠 일이 없다. 색도 다르다(상자는 `border-strong`·`state-current`, 찾기는 `--marker`·`--accent`).
- 자리 계산(`toolbarPlacement`)에 `screen`(위는 `html`의 `scroll-padding-top`, 아래는 `innerHeight`, 오른쪽은 `clientWidth`)과 `button`(툴바 크기)을 더했다. 툴바 크기는 `toolbarSize(동작 수)`로 구하고 뷰의 클래스(30px 버튼, `gap-0.5`, `p-0.5`, 테두리)에 맞췄다. 버튼 하나면 36×36이다.
- 들이기: `상자 오른쪽 + 6px + 툴바 폭 > 화면 오른쪽`이면 기준점을 상자 위 끝에서 6px 아래로 옮기고 `side="left"`로 띄운다. 그러면 툴바가 상자 안쪽 오른쪽 위에 놓인다.
- 화면 안으로 묶기는 툴바 위 변 기준이다. 화면 안으로 옮기더라도 상자 밖으로는 나가지 않게 했다. 상자가 통째로 화면 밖이면 버튼도 상자를 따라 밖에 있다. 뷰의 가상 기준점이 스크롤할 때마다 상자의 지금 위치로 `buttonAnchor`를 다시 부르므로 긴 선택을 스크롤해도 버튼이 화면 안에 남는다.
- axe `region`: 버튼 묶음이 `body`로 포털되어 랜드마크 밖이었다. `PopoverContent`에 `container`를 더하고 툴바는 글 `article.doc` 끝(`main` 안)으로 포털한다. 이렇게 하면 Tab도 글 끝을 지나 바로 툴바로 온다.
- 측정(1440×900): 문단 앞 선택에서 Tab 21번에 툴바 버튼에 닿는다. 본문 전체를 고른 상자(높이 약 7000px)에서 툴바는 화면 아래 끝(865–899px)에 붙고, 300px 스크롤한 뒤에도 화면 안에 있다. 390×844에서는 상자 오른쪽 382px 안쪽 375px, 상자 위 끝에서 7px 아래에 놓인다. axe는 세 폭 × 두 테마 91회 모두 위반 0개다.
- `pnpm qa` nav의 `콘솔 오류 없음`이 가끔 `AbortError: Transition was skipped`로 실패한다. 01 블록의 "툴바를 띄운 채 홈으로 → 뒤로" 이동에서 나오고, 이 티켓 변경 없이 10cf0fa에서 두 번 돌려도 한 번 났다. 이 티켓 밖의 기존 흔들림으로 남긴다.
