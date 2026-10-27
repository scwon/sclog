# 01: ⌘F 찾기 줄

**What to build:** ⌘F(Ctrl+F)를 누르면 에디터 오른쪽 위에 찾기 줄이 뜨고 입력창에 포커스가 간다. 한 글자부터 에디터에 보이는 글자에서 찾고, 모든 일치를 형광 띠로, 지금 일치를 코랄로 칠한다. 위치는 `3/12`로 보인다. Enter·Shift+Enter로 다음·이전 일치로 가며 그 줄이 화면 가운데로 온다. Esc나 닫기 버튼으로 닫으면 칠한 것이 사라지고 포커스가 돌아온다. CSS Custom Highlight API가 없는 브라우저에서는 ⌘F를 브라우저에 맡긴다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

참고: 스펙 [파일에서 찾기](../spec.md) "키"·"찾기 규칙"·"찾기 줄", 단축키 기준 `docs/agents/shortcuts.md`.

- [ ] `SHORTCUT_KEYS`에 `find`(⌘F)가 있고 `shortcutFor`가 찾기 줄 열기를 돌려준다. 맥락에 Highlight 지원 여부가 들어가고, 지원하지 않으면 `null`이다. 열린 팔레트에서 ⌘F는 기본 동작만 막는다
- [ ] 찾기 입력창(`data-find-input`)이 새 포커스 종류다. Enter·Shift+Enter·Esc·⌘F를 받는다. 검색 입력창·팔레트 입력창에서도 ⌘F가 찾기 줄을 연다. Esc 층 순서는 팔레트 → 겹침 패널 → 찾기 줄이다. 좁은 화면에서 ⌘F는 겹침 패널을 닫고 찾기 줄을 연다
- [ ] 범위를 텍스트 노드·오프셋으로 되돌리는 순수 함수가 `matchRanges`를 쓴다. 여러 노드에 걸친 일치, 블록 경계, 음절 넓히기를 단위 테스트가 덮는다. 다음·이전 순환, 검색어가 바뀔 때 시작 위치(화면 맨 위 일치), 위치 글자(`3/12`·`결과 없음`)도 순수 함수와 테스트로 둔다
- [ ] 찾는 글자는 화면에 보이는 글자다. `aria-hidden`이어도 보이면 찾고, `.sr-only`·`hidden`·`display: none`·줄 번호·닫힌 `<details>` 안은 뺀다
- [ ] 찾기 줄은 창 틀이 그리고 처음 쓸 때 불러오는 청크다. 자리·폭·좁은 화면 폭은 스펙대로다. 입력창은 `role="searchbox"`, 위치 글자는 `aria-live="polite"`, 버튼 이름은 스펙의 세 가지다
- [ ] `find-match`(`--marker`)와 `find-current`(`--accent` 바탕, `--on-accent` 글자) 두 Highlight로 칠한다. 토큰 테스트가 두 테마의 명암비 4.5 이상을 본다
- [ ] 지금 일치가 보이는 영역 밖이면 위쪽 막대를 뺀 가운데로 옮긴다. 움직임 줄이기 설정에서는 바로 옮긴다
- [ ] 찾기 줄이 열린 채 ⌘F를 누르면 입력창으로 포커스가 가고 글자가 모두 선택된다
- [ ] 빌드 결과물 테스트: 첫 화면 HTML과 다른 청크가 찾기 줄 청크를 미리·정적으로 불러오지 않는다
- [ ] `docs/agents/shortcuts.md`의 기준 4·5번, 끄는 때, 지금 붙은 키, 겹침 확인표를 고친다. `GLOSSARY.md`에 **찾기 줄**을 더한다
- [ ] `pnpm qa`: 글에서 ⌘F → 포커스 → 입력 → 위치 글자와 `CSS.highlights` 범위 수 → Enter로 다음 → Esc로 닫힘·칠함 사라짐. 찾기 줄이 열린 상태를 세 폭 × 두 테마 axe에 넣는다
- [ ] `pnpm verify`·`pnpm qa` 통과
