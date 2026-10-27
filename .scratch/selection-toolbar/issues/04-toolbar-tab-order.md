# 04: 선택 툴바의 Tab 순서

**What to build:** 키보드 사용자에게 선택 툴바가 고른 자리 바로 뒤에 놓인 것처럼 보이게 한다. 고른 자리에서 Tab을 누르면 툴바가 아직 그려지는 중이어도 첫 버튼에 닿는다. 툴바에서 Tab으로 나가면 고른 자리 다음으로 이어지고, Shift+Tab으로 나가면 고른 자리로 돌아간다. 스펙 [selection-toolbar](../spec.md)의 "버튼 자리" 절에서 이어지는 일이다.

**Blocked by:** None (can start immediately)

**Status:** done

지금 고칠 동작은 두 가지다.

- 툴바 청크가 아직 불리지 않았을 때 고른 자리에서 Tab을 누르면, `shortcutFor`가 `focus-selection-toolbar`로 기본 동작을 막는다. 그런데 `focusSelectionToolbar()`가 찾을 버튼이 아직 없어서 그 Tab은 아무 데도 가지 않는다. `$selectionToolbarOpen`이 툴바를 그리기 전, 즉 요청한 시점에 이미 참이 되는 것이 원인이다.
- 툴바는 `article.doc` 끝에 포털된다. 그래서 마지막 버튼에서 Tab을 누르면 글 다음 요소로 가고, 고른 자리 뒤에 있던 링크들은 건너뛴다.

- [x] 고른 자리에서 누른 첫 Tab은 툴바가 그려지는 중이어도 첫 버튼에 포커스를 준다. 그리는 일이 끝나기 전에 선택이 바뀌거나 툴바가 걷히거나 포커스가 다른 곳으로 옮겨 갔으면 포커스를 주지 않는다
- [x] 툴바 마지막 버튼에서 Tab을 누르면, 문서 순서로 선택 끝 뒤에 오는 첫 Tab 대상(툴바 밖)으로 간다. 그런 대상이 없으면 브라우저에 맡긴다
- [x] 툴바 첫 버튼에서 Shift+Tab을 누르면 고른 글자를 품은 요소(에디터 루트 또는 `body`)로 돌아간다. 선택은 그대로 남고, 다시 Tab을 누르면 툴바로 들어간다
- [x] 키 판정은 `shortcutFor` 하나에 더하고 리스너를 새로 걸지 않는다(`docs/agents/shortcuts.md`). 판정과 "선택 뒤 첫 대상" 고르기는 순수 함수이고, Vitest로 덮는다
- [x] 툴바 안 버튼 사이의 Tab, 그리고 툴바에 들어가지 않은 Tab·Shift+Tab은 지금처럼 브라우저에 맡긴다. 포커스 가둠(focus trap)은 만들지 않는다
- [x] `pnpm qa`(`scripts/qa/nav/selection-toolbar.mjs`): 막 연 글에서 고르자마자 누른 Tab이 툴바에 닿는다. 툴바에서 Tab을 누르면 선택 뒤 첫 링크로 간다. Shift+Tab을 누르면 고른 자리로 돌아간다
- [x] 스펙의 "버튼 자리" 절과 `docs/agents/shortcuts.md`를 바뀐 동작에 맞춘다
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `fix/selection-toolbar-tab-impl`)

**결정**

- 그리는 중의 Tab: `focusSelectionToolbar()`가 버튼을 못 찾고 툴바가 떠 있으면(그리기를 요청함) 그 Tab을 기다리게 둔다. 기다리는 Tab은 그때의 포커스 요소와 선택의 두 끝(노드·오프셋)을 적어 둔다. 툴바를 그린 직후 `focusDueOnShow`(순수 함수)가 툴바가 아직 떠 있는가, 포커스가 그대로인가, 선택의 두 끝이 같은가를 보고 첫 버튼에 포커스를 준다. 걷으면(`hide`·`closeSelectionToolbar`) 기다리던 Tab을 버린다.
- 선택이 바뀌었는지는 그리기 요청 순번(`request`)이 아니라 선택의 두 끝으로 본다. 포인터를 뗀 뒤에 늦게 온 `selectionchange`가 같은 선택을 다시 그리게 하면 순번이 올라가는데, 이것을 선택이 바뀐 것으로 치면 Tab을 잃는다. QA에서 실제로 이렇게 됐다.
- `showSelectionToolbar`는 `flushSync`로 그린다. 돌아온 직후에 첫 버튼이 DOM에 있어야 기다리던 Tab에 포커스를 줄 수 있다. 버튼 묶음은 `container`(글 요소)로 바로 포털되므로 한 번 그리면 버튼이 생긴다.
- 단축키 바인딩은 툴바가 떠 있는지를 창 틀 상태(`useStore`)가 아니라 키를 받을 때 `$selectionToolbarOpen.get()`으로 읽는다. 그래서 `ShortcutState`에서 `toolbarOpen`을 뺐다. 창 틀이 다시 그려지기 전에 온 Tab은 툴바가 떴다는 것을 몰라 브라우저에 넘어갔다(QA에서 고르자마자 보낸 Tab의 기본 동작이 막히지 않았다).
- 툴바에서 나가기: `KeyShape`에 `toolbarButton`(첫·마지막 버튼인가, 버튼이 하나면 둘 다 참)과 `stopAfterSelection`(선택 뒤 Tab 대상이 있는가)을 더했다. `shortcutFor`는 마지막 버튼의 Tab을 `leave-selection-toolbar`로, 첫 버튼의 Shift+Tab을 `return-to-selection`으로 돌려준다. 선택 뒤 대상은 문서를 훑으므로 바인딩이 마지막 버튼에서 누른 Tab에만 잰다.
- 선택 뒤 첫 대상: 후보 선택자(`a[href]`·`button`·입력 요소·`summary`·`[tabindex]` 등)에 걸리는 요소를 문서 순서로 모아, `tabStopAfterSelection`(순수 함수)이 `tabIndex >= 0`이고 선택 끝 뒤에서 시작하며 툴바 밖이고 보이는(`:disabled`·`[inert]`·`checkVisibility({ visibilityProperty: true })`가 아닌) 첫 요소를 고른다. 양수 `tabindex`의 순서는 따로 보지 않는다(블로그에 없다). 선택 끝을 품은 요소(끝이 걸친 링크)는 앞으로 친다.
- 돌아가기: 선택의 공통 조상에서 가장 가까운 `[tabindex]` 요소(에디터 루트 `main#editor`)에 `preventScroll`로 포커스를 주고, 없으면 지금 포커스를 `blur()`해 `body`로 둔다. 이 요소들은 선택을 품으므로 다음 Tab을 `holdsSelection`이 다시 툴바로 보낸다.
- QA: 막 연 글에서 한 태스크 안에 포인터를 누르고, 고르고, 떼고, 바로 keydown Tab을 보낸다. 그 순간 버튼이 없었고(`drawnAtTab: false`) Tab의 기본 동작이 막혔으며, 그린 뒤 포커스가 툴바 첫 버튼에 왔다. 검사한 글에서 Shift+→로 고른 자리 뒤의 첫 Tab 대상은 링크가 아니라 다음 제목의 `장 주소 복사` 버튼이었다. 그래서 QA는 링크로 정해 두지 않고, 선택 끝 뒤의 첫 Tab 대상(툴바 밖이며 보이는 요소)에 닿는지 본다.
- 측정: `pnpm verify` 통과(Vitest 520개). `QA_PORT=4397 pnpm qa` 11개 스크립트 모두 통과했고, 선택 툴바 시나리오에서 Tab 순서 확인 5개가 새로 붙었다.
