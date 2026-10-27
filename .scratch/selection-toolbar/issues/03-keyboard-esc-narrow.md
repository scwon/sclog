# 03: 키보드 선택, Esc, 찾기와의 경계, 좁은 폭

**What to build:** 키보드로 골라도 선택 툴바가 뜨고, Esc·찾기 줄과 엉키지 않으며, 어느 폭에서도 버튼이 화면 안에 보인다.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Shift+화살표 선택은 `selectionchange`를 짧게 미뤄 그린다. 툴바가 떠도 포커스는 본문에 남고 Tab으로 들어갈 수 있다
- [ ] Esc가 툴바를 맨 먼저 닫는다(툴바 → 팔레트 → 겹침 패널 → 찾기 줄). `shortcutFor`에 더하고 리스너를 새로 걸지 않는다. 키 판정 테스트
- [ ] 찾기 줄이 열리면 툴바를 닫는다. 하이라이트 이름이 찾기의 `find-match`·`find-current`와 겹치지 않는다
- [ ] 오른쪽 여백이 버튼 폭보다 좁으면 버튼을 상자 안쪽 오른쪽 위로 들인다. 상자가 화면보다 길면 버튼 세로 위치를 화면 안으로 묶는다. 자리 계산 테스트에 두 경우를 더한다
- [ ] `docs/agents/shortcuts.md` Esc 순서와 `GLOSSARY.md`의 **선택 툴바** 항목
- [ ] `pnpm qa`: Esc로 닫힘, 툴바가 뜬 상태를 세 폭 × 두 테마 axe
- [ ] `pnpm verify` 통과

## Comments
