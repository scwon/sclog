# 04: 선택 툴바의 Tab 순서

**What to build:** 키보드 사용자에게 선택 툴바가 고른 자리 바로 뒤에 놓인 것처럼 보이게 한다. 고른 자리에서 Tab을 누르면 툴바가 아직 그려지는 중이어도 첫 버튼에 닿는다. 툴바에서 Tab으로 나가면 고른 자리 다음으로 이어지고, Shift+Tab으로 나가면 고른 자리로 돌아간다. 스펙 [selection-toolbar](../spec.md)의 "버튼 자리" 절에서 이어지는 일이다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

지금 고칠 동작은 두 가지다.

- 툴바 청크가 아직 불리지 않았을 때 고른 자리에서 Tab을 누르면, `shortcutFor`가 `focus-selection-toolbar`로 기본 동작을 막는다. 그런데 `focusSelectionToolbar()`가 찾을 버튼이 아직 없어서 그 Tab은 아무 데도 가지 않는다. `$selectionToolbarOpen`이 툴바를 그리기 전, 즉 요청한 시점에 이미 참이 되는 것이 원인이다.
- 툴바는 `article.doc` 끝에 포털된다. 그래서 마지막 버튼에서 Tab을 누르면 글 다음 요소로 가고, 고른 자리 뒤에 있던 링크들은 건너뛴다.

- [ ] 고른 자리에서 누른 첫 Tab은 툴바가 그려지는 중이어도 첫 버튼에 포커스를 준다. 그리는 일이 끝나기 전에 선택이 바뀌거나 툴바가 걷히거나 포커스가 다른 곳으로 옮겨 갔으면 포커스를 주지 않는다
- [ ] 툴바 마지막 버튼에서 Tab을 누르면, 문서 순서로 선택 끝 뒤에 오는 첫 Tab 대상(툴바 밖)으로 간다. 그런 대상이 없으면 브라우저에 맡긴다
- [ ] 툴바 첫 버튼에서 Shift+Tab을 누르면 고른 글자를 품은 요소(에디터 루트 또는 `body`)로 돌아간다. 선택은 그대로 남고, 다시 Tab을 누르면 툴바로 들어간다
- [ ] 키 판정은 `shortcutFor` 하나에 더하고 리스너를 새로 걸지 않는다(`docs/agents/shortcuts.md`). 판정과 "선택 뒤 첫 대상" 고르기는 순수 함수이고, Vitest로 덮는다
- [ ] 툴바 안 버튼 사이의 Tab, 그리고 툴바에 들어가지 않은 Tab·Shift+Tab은 지금처럼 브라우저에 맡긴다. 포커스 가둠(focus trap)은 만들지 않는다
- [ ] `pnpm qa`(`scripts/qa/nav/selection-toolbar.mjs`): 막 연 글에서 고르자마자 누른 Tab이 툴바에 닿는다. 툴바에서 Tab을 누르면 선택 뒤 첫 링크로 간다. Shift+Tab을 누르면 고른 자리로 돌아간다
- [ ] 스펙의 "버튼 자리" 절과 `docs/agents/shortcuts.md`를 바뀐 동작에 맞춘다
- [ ] `pnpm verify` 통과

## Comments
