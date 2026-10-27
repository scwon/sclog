# 단축키 기준

새 디테일에 단축키를 붙이거나 키 처리를 고칠 때 읽는다. 결정의 근거는 `.scratch/blog-details/issues/04-shortcut-scheme.md`, 동작은 `.scratch/blog-details/spec.md`의 "단축키"에 있다.

## 코드

- 붙은 키: `src/design-system/components/Shell/shortcuts.logic.ts`의 `SHORTCUT_KEYS`(`palette`·`panel`·`search`) 한곳이다. 판정, 팔레트 명령 목록(`palette.logic.ts`의 `paletteCommands`), 팔레트 맨 아래 안내, 활동 막대 툴팁이 모두 이 값을 읽는다. ⌘⇧F를 빼야 하면 `search`를 `null`로 바꾸면 된다. 키가 없어지고, 명령 목록의 키 칸이 비고, 안내 줄과 툴팁의 키도 빠진다.
- 판정: `src/design-system/components/Shell/shortcuts.logic.ts`의 `shortcutFor(event, context)`. DOM을 모르는 순수 함수이고, 키 모양(`key`·`code`·수정 키·`isComposing`·포커스 대상 종류)과 맥락(팔레트 열림·겹침 패널 열림·플랫폼)을 받아 동작 하나나 `null`을 돌려준다. 규칙은 `shortcuts.test.ts`가 덮는다.
- 바인딩: 같은 폴더 `shortcuts.ts`의 `useShortcuts`가 `document`에 keydown 리스너 하나만 걸고, 판정이 `null`이 아니면 기본 동작을 막고 `Shell.tsx`에 넘긴다. 키를 받는 리스너를 다른 곳에 더 걸지 않는다.
- 실행: 붙은 키의 동작(`toggle-panel`·`open-search`)과 팔레트 `>` 명령은 같은 이름의 창 틀 명령(`ShellCommand`)이고, `Shell.tsx`의 `runCommand` 하나가 실행한다. 새 명령은 `ShellCommand`에 더하고 `runCommand`에 한 갈래를 단다.
- 키 표기: `keyLabel(combo, platform)`이 `⌘⇧F` / `Ctrl+Shift+F`를 만든다. 플랫폼은 `platformOf(navigator 플랫폼 이름)`로 브라우저에서 처음 쓸 때 정하고 서버 HTML에는 넣지 않는다. 팔레트 안의 키 표기와 안내의 `>` 부분은 `(hover: hover) and (pointer: fine)`일 때만 보인다.
- 도움말: 팔레트에 `>`를 치면 나오는 명령 목록이 이 블로그의 단축키 도움말이다. 키를 붙이면 그 명령 줄에도 키를 단다.

## 키를 붙이는 기준

1. VS Code에 대응하는 키가 있어야 한다. 한 글자 키(j/k, `[` `]`, `?`)는 두지 않는다. WCAG 2.1.4 때문에 끄는 설정까지 따로 둬야 해서다.
2. 수정 키는 맥에서 ⌘(`metaKey`)만, 그 밖에서 Ctrl만 받는다. 다른 쪽 수정 키나 Alt가 함께 눌렸으면 받지 않는다. 한글 자판처럼 `key`가 라틴 글자가 아니면 물리 키(`code`)로 본다.
3. 브라우저가 페이지에 넘기지 않는 키(⌘W·⌘T·⌘N·⌘Q·⌃Tab)는 쓰지 않는다.
4. 페이지가 받을 수 있어도 독자가 자주 쓰는 브라우저 키(⌘F·⌘L·⌘R·⌘D·⌘+/−)와 개발자 도구 키는 건드리지 않는다. ⌘⇧E는 Firefox 윈도의 네트워크 도구, ⌘⇧P는 Firefox 사생활 보호 창이라 뺐다.
5. 가로채는 브라우저 키는 ⌘P(인쇄)와 ⌘B(Firefox 북마크 사이드바)뿐이다. 새 키가 브라우저 키와 겹치면 붙이지 않는다.
6. 붙이기 전에 아래 겹침 확인표에 줄을 더하고 세 브라우저 × 두 OS로 직접 눌러 본다.

## 끄는 때

- 입력창·textarea·select·contenteditable에 포커스가 있을 때. 팔레트 입력창(`data-palette-input`)의 Esc·↑↓·Enter는 예외다. 검색 입력창(`data-search-input`)의 Esc도 예외라, ⌘⇧F로 좁은 화면의 겹침 패널과 함께 포커스를 받은 뒤 Esc로 겹침 패널을 닫는다. 겹침 패널이 없으면 Esc는 입력창이 받는다(글자 지우기). 댓글 같은 다른 입력창은 Esc도 받지 않는다.
- 한글을 조합하는 중(`isComposing`).
- 팔레트가 열려 있을 때는 팔레트 키만 받는다. Esc는 닫기, ↑↓·Enter는 줄 고르기다. ⌘P와 Tab은 기본 동작만 막는다. ⌘P는 인쇄 창을 막으려고, Tab은 포커스가 대화상자 밖으로 나가지 않게 하려고 막는다.

Esc는 맨 위 층 하나만 닫는다. 순서는 팔레트, 그다음 좁은 화면의 겹침 패널이다. 넓은 화면에 붙은 패널은 ⌘B로 닫는다. 키 처리는 화면 폭과 상관없이 늘 켜 두고(키보드를 단 iPad), 터치 몸짓으로 대신하지 않는다.

## 지금 붙은 키

| 키 | 동작 | 붙인 티켓 |
| --- | --- | --- |
| ⌘P / Ctrl+P | 명령 팔레트 열기 | 19 |
| ⌘B / Ctrl+B | 패널 열고 닫기(마지막 패널 화면으로 열림) | 19 |
| Esc | 맨 위 층 하나 닫기 | 19 |
| ⌘⇧F / Ctrl+Shift+F | 패널 검색 화면을 열고 입력창에 포커스 | 22(아래 확인 대기. 받을 수 없으면 `SHORTCUT_KEYS.search`를 `null`로) |

## 겹침 확인표

| 키 | 겹치는 브라우저 동작 | 결정 |
| --- | --- | --- |
| ⌘P / Ctrl+P | 세 브라우저 모두 인쇄 | 가로챈다 |
| ⌘B / Ctrl+B | Firefox(맥·윈도) 북마크 사이드바 | 가로챈다 |
| ⌘⇧F / Ctrl+Shift+F | 2026-10-27 블로그 주인이 맥에서 배포 사이트로 동작을 확인했다(브라우저는 기록하지 않음). 나머지 조합은 확인 대기 | 받을 수 있다고 보고 붙였다. 받을 수 없는 조합이 있으면 `SHORTCUT_KEYS.search`를 `null`로 바꿔 뺀다 |
