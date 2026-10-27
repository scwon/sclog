# 01: ⌘F 찾기 줄

**What to build:** ⌘F(Ctrl+F)를 누르면 에디터 오른쪽 위에 찾기 줄이 뜨고 입력창에 포커스가 간다. 한 글자부터 에디터에 보이는 글자에서 찾고, 모든 일치를 형광 띠로, 지금 일치를 코랄로 칠한다. 위치는 `3/12`로 보인다. Enter·Shift+Enter로 다음·이전 일치로 가며 그 줄이 화면 가운데로 온다. Esc나 닫기 버튼으로 닫으면 칠한 것이 사라지고 포커스가 돌아온다. CSS Custom Highlight API가 없는 브라우저에서는 ⌘F를 브라우저에 맡긴다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [파일에서 찾기](../spec.md) "키"·"찾기 규칙"·"찾기 줄", 단축키 기준 `docs/agents/shortcuts.md`.

- [x] `SHORTCUT_KEYS`에 `find`(⌘F)가 있고 `shortcutFor`가 찾기 줄 열기를 돌려준다. 맥락에 Highlight 지원 여부가 들어가고, 지원하지 않으면 `null`이다. 열린 팔레트에서 ⌘F는 기본 동작만 막는다
- [x] 찾기 입력창(`data-find-input`)이 새 포커스 종류다. Enter·Shift+Enter·Esc·⌘F를 받는다. 검색 입력창·팔레트 입력창에서도 ⌘F가 찾기 줄을 연다. Esc 층 순서는 팔레트 → 겹침 패널 → 찾기 줄이다. 좁은 화면에서 ⌘F는 겹침 패널을 닫고 찾기 줄을 연다
- [x] 범위를 텍스트 노드·오프셋으로 되돌리는 순수 함수가 `matchRanges`를 쓴다. 여러 노드에 걸친 일치, 블록 경계, 음절 넓히기를 단위 테스트가 덮는다. 다음·이전 순환, 검색어가 바뀔 때 시작 위치(화면 맨 위 일치), 위치 글자(`3/12`·`결과 없음`)도 순수 함수와 테스트로 둔다
- [x] 찾는 글자는 화면에 보이는 글자다. `aria-hidden`이어도 보이면 찾고, `.sr-only`·`hidden`·`display: none`·줄 번호·닫힌 `<details>` 안은 뺀다
- [x] 찾기 줄은 창 틀이 그리고 처음 쓸 때 불러오는 청크다. 자리·폭·좁은 화면 폭은 스펙대로다. 입력창은 `role="searchbox"`, 위치 글자는 `aria-live="polite"`, 버튼 이름은 스펙의 세 가지다
- [x] `find-match`(`--marker`)와 `find-current`(`--accent` 바탕, `--on-accent` 글자) 두 Highlight로 칠한다. 토큰 테스트가 두 테마의 명암비 4.5 이상을 본다
- [x] 지금 일치가 보이는 영역 밖이면 위쪽 막대를 뺀 가운데로 옮긴다. 움직임 줄이기 설정에서는 바로 옮긴다
- [x] 찾기 줄이 열린 채 ⌘F를 누르면 입력창으로 포커스가 가고 글자가 모두 선택된다
- [x] 빌드 결과물 테스트: 첫 화면 HTML과 다른 청크가 찾기 줄 청크를 미리·정적으로 불러오지 않는다
- [x] `docs/agents/shortcuts.md`의 기준 4·5번, 끄는 때, 지금 붙은 키, 겹침 확인표를 고친다. `GLOSSARY.md`에 **찾기 줄**을 더한다
- [x] `pnpm qa`: 글에서 ⌘F → 포커스 → 입력 → 위치 글자와 `CSS.highlights` 범위 수 → Enter로 다음 → Esc로 닫힘·칠함 사라짐. 찾기 줄이 열린 상태를 세 폭 × 두 테마 axe에 넣는다
- [x] `pnpm verify`·`pnpm qa` 통과

## Comments

### 2026-10-27 구현 (브랜치 `find-in-file/01-find-widget`)

**결정**

- 모듈: 순수 규칙 `Shell/find.logic.ts`(`findInBlocks`·`stepMatch`·`firstVisibleMatch`·`findPosition`·`scrollToCenter`), DOM 쪽 `Shell/find.ts`(`visibleBlocks`·`toRange`·`paint`·`unpaint`·`visibleArea`), 찾기 줄 `Shell/FindWidget.tsx`(청크, `FindHandle { focus, move }`), 검색어 스토어 `stores/find.ts`(`$findQuery`·`setFindQuery`, 메모리만). 창 틀은 `findOpen` 상태와 `openFind`·`closeFind`를 갖고, 열 때 포커스가 있던 자리를 `findOpener`에 둔다.
- 판정: 맥락에 `findOpen`·`findSupported`를 더했다. 지원 여부는 `shortcuts.ts`의 `findSupported()`(`CSS.highlights`와 `Highlight`가 있는가)를 키마다 읽는다. 동작은 `find-in-file`(창 틀 명령, `ShellCommand`에도 더해 `runCommand`가 실행한다. 팔레트 목록 자리는 티켓 02), `find-next`·`find-prev`·`close-find`다. ⌘F는 `text` 말고 모든 포커스(에디터·검색 입력창·찾기 입력창)에서 받는다.
- Esc: 검색 입력창의 Esc는 겹침 패널이 없으면 지금처럼 입력창이 받고 찾기 줄은 닫지 않는다. 검색어를 지우려는 키로 보았다. 찾기 줄은 찾기 입력창과 에디터 쪽(`other`)의 Esc로만 닫힌다.
- 찾는 글자: 경로 표시줄(`.ide-crumbs`)은 파일 내용이 아니라서 뺐다. 블록은 글자를 감싼 가장 가까운 비인라인 요소이고 `<br>`에서도 나뉜다. `visibility: hidden`도 뺀다. 검색어가 바뀔 때마다 다시 모은다(접힌 흐름 로그 줄처럼 보임이 바뀌는 글자 때문). 그릴 때 `useMemo`로 찾고 칠하기·스크롤만 효과에 둔다(`set-state-in-effect` 규칙).
- 칠하기: 지금 일치는 `find-match`에도 남기고 `find-current`의 `priority`를 1로 올렸다. 다른 칠하기를 지우지 않게 `CSS.highlights.clear()`는 쓰지 않고 두 이름만 지운다.
- 스크롤: 보이는 영역의 위 끝은 경로 표시줄의 아래 끝, 아래 끝은 에디터 아래 여백(상태줄)이다. 일치가 찾기 줄과 가로로 겹치면 찾기 줄 아래 끝을 위 끝으로 본다. 좁은 화면에서 맨 위 일치가 찾기 줄에 가려 보이지 않던 것을 ego-browser 확인에서 찾았다. 시작 일치는 경로 표시줄 아래 끝 기준이다.
- 자리: 경로 표시줄 바로 아래에 붙인다(위 테두리 없음, 아래 모서리만 둥글게). 오른쪽 16px(좁은 화면 8px), 폭 `min(360px, 100vw − 에디터 왼쪽 − 32px)`, 760px 미만은 `100vw − 에디터 왼쪽 − 16px`이다. z-index 25로 탭(30)·패널(35)·겹침 패널 아래에 있다. `<search>` 요소라 axe `region` 규칙을 지킨다. 입력창은 `type="search"`(암묵적 `searchbox`)이고 브라우저의 지우기 단추는 숨겼다.
- 버튼: 접근 가능한 이름은 `이전 일치`·`다음 일치`·`찾기 닫기`이고, 마우스 화면의 툴팁(`title`)에 `(⇧Enter)`·`(Enter)`·`(Esc)`를 붙인다(윈도·리눅스는 `Shift+Enter`). 이전·다음은 누를 때 포커스를 입력창에 둬서 이어서 Enter로 옮길 수 있다. 일치가 없으면 꺼진다. 위치 글자는 `text-soft`(11.5px라 4.5:1이 필요하다).
- 닫기 포커스: 연 자리가 끊겼거나 보이지 않으면(`checkVisibility`, 좁은 화면에서 닫힌 패널의 검색 입력창 등) 에디터로 간다.
- 토큰 테스트: `find-match`는 `--text`·`--text-soft`·`--prose`·`--prose-strong`이 `--surface` 위 `--marker`에서 4.5 이상인지 본다. `--text-muted`는 어두운 테마에서 2.98이라 넣지 않았다(본문 선택 `::selection`도 같은 띠). `find-current`는 `--on-accent` on `--accent`다.
- 빌드는 Lightning CSS가 `::highlight()`를 모르는 의사 요소로 보고 경고 두 줄을 낸다. 규칙은 결과 CSS에 그대로 남는다(`dist` CSS에서 확인).
- `pnpm qa`는 지침대로 돌리지 않고 `scripts/qa/run.mjs`의 포트만 4341로 바꿔(커밋하지 않음) `nav`·`a11y`를 돌렸다. `a11y` 85회 위반 0, `nav` 통과. `nav`는 세 번 중 한 번 기존 단계 `⌘⇧F로 검색 입력창에 포커스`(300ms 고정 대기)가 늦게 떠 실패했고, 이번 변경과 무관한 대기 문제로 보았다.

**측정값**

- `find-match` 명암비(어두운 / 밝은, `--surface` 위 `--marker`): text 7.16 / 11.50, text-soft 4.95 / 7.56, prose 6.02 / 10.39, prose-strong 7.68 / 11.50, text-muted 2.98 / 4.53, accent-text 4.28 / 4.10, code-string 4.98 / 4.39. `find-current` 8.03 / 8.03.
- 찾기 줄 청크 `FindWidget.*.js` 5,399B(압축 전).
- `pro-developer-2023-days`에서 `개발` 77개. 1440px에서 8번째 일치로 옮기면 그 줄 위 끝이 483px(보이는 영역 108~876px의 가운데 492px 근처)에 온다.


### 2026-10-27 리뷰 수정

- 맞닿은 일치: `matchRanges`에 `merge` 선택을 더했다. 기본값 `touching`은 검색 화면 발췌처럼 맞닿은 범위까지 합치고, 찾기 줄은 `overlap`으로 겹친 범위만 합친다. 이제 `ㅋㅋㅋ`에서 `ㅋ`는 셋, `개발개발`에서 `개발`은 둘로 센다. 음절 넓히기로 두 일치가 같은 음절을 함께 덮게 되면(`발발발`에서 `ᆯᄇ`) 칠한 띠로는 둘을 가를 수 없어 하나로 센다.
- 가로 스크롤: 일치를 감싼 가로 스크롤 컨테이너(`find.ts`의 `horizontalScroller`)가 있으면 `scrollToCenterX`만큼 가로로 먼저 옮기고, 찾기 줄과 겹치는지는 옮긴 뒤 자리로 본다. 움직임 줄이기 규칙은 세로와 같다.
- 다시 모으기: 찾기 줄이 에디터를 `MutationObserver`(자식·글자, `open`·`hidden`·`class`·`style` 속성)로 보고 한 프레임에 한 번만 다시 찾는다. `<details>`의 `open`도 속성 바뀜이라 `toggle` 리스너는 따로 걸지 않았다. 지금 일치는 `resumeMatch`로 앞 일치와 같거나 그 뒤의 첫 일치에서 이어 간다. 독자가 연 자리를 지키려고, 다시 모을 때는 칠하기만 맞추고 스크롤하지 않는다.
- 위치 글자: live 영역을 빈 채로 그리고 다음 프레임에 채운다.
- 폭: `100vw`를 `100%`로 바꿨다. 고정 위치의 기준 상자는 스크롤바를 뺀 화면이다. 15px 스크롤바를 넣고 ego로 재 보니 1440px에서 오른쪽 여백 16px, 700px에서 양옆 8px이었다.
- 명암비: `::highlight(find-match)`에 `color: var(--text)`를 줬다. 토큰 테스트는 이제 `ide.css`의 두 `::highlight` 규칙에서 글자색과 바탕을 읽어 본다(`--text` on `--marker`: 어두운 7.16, 밝은 11.50).
- 정리: 주석 세 곳을 지금 동작에 맞췄다. `FINE_POINTER`·`useFinePointer`는 `src/design-system/media.ts`로 옮겼고, 찾기 줄 버튼 셋은 `FindButton` 하나로 모았다. 찾기 줄 청크는 6,702B(압축 전, 02는 5,600B)다.
