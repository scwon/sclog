# 02: 복사 토스트

**What to build:** 선택 툴바에서 복사하면 화면 아래 가운데에 "복사했어요" 토스트가 약 2초 떴다 사라지고 스크린 리더에도 알린다. 클립보드가 막히면 ⌘C를 쓰라는 안내 토스트가 뜬다. 버튼의 체크 아이콘은 그대로 둔다. 토스트는 디자인 시스템 부품이라 나중에 다른 동작도 쓴다.

**Blocked by:** 01

**Status:** done

- [x] 디자인 시스템에 Toast(Radix Toast 래퍼). 공유 상태는 `stores/`의 nanostore. 소비자는 디자인 시스템 진입점으로만 쓴다
- [x] 토스트 store 동작(띄우기, 자동 닫힘, 연달아 띄우기) Vitest
- [x] Storybook 스토리(성공·실패, 두 테마)
- [x] 복사 성공·실패에 토스트가 붙는다. 움직임 줄이기 설정에서는 전환 없이 뜬다
- [x] `pnpm qa`에 토스트가 뜬 상태 axe 확인
- [x] 기존 코드 블록·제목 링크 복사는 바꾸지 않는다(별도 작업)
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `feat/selection-toolbar-02`)

**결정**

- 상태는 `stores/toast.ts`의 `$toast`(`{ id, text, tone } | null`) 하나다. `showToast(text, tone)`은 앞 토스트를 바로 바꾸고 2초(`TOAST_MS`)를 새로 센다. `tone`은 `success`(체크 아이콘)와 `error`(느낌표 원) 둘이다. 같은 글자가 다시 와도 `id`가 바뀌어 다시 읽힌다.
- 닫힘 시계는 Radix가 아니라 store가 센다(Radix `duration`은 `Infinity`). 대신 Radix의 멈춤(포인터·포커스가 토스트에 머묾, 창이 포커스를 잃음)을 `onPause`·`onResume`으로 받아 `pauseToast`·`resumeToast`가 남은 시간부터 다시 센다. 두 함수는 `Toaster`만 쓰므로 `index.ts`에 내보내지 않았다.
- 그리는 곳은 창 틀이다. `Shell`이 `ToastHost`를 한 번 그리고, 첫 토스트가 오면 `Toast.tsx` 청크(약 21KB)를 `import()`로 불러 그 뒤로 붙여 둔다. 창 틀은 화면을 옮겨도 남으므로 토스트도 화면 이동을 넘는다. 빌드 결과물 테스트에 `toast chunk`를 더했다.
- 키: Radix Toast 영역이 거는 F8 단축키는 `hotkey={[]}`로 끄고, `Toast.Root`의 Esc는 `onEscapeKeyDown`에서 막아 무시한다. Esc는 `shortcutFor`가 맨 위 층 하나만 닫는다(`docs/agents/shortcuts.md`에 한 줄 더함). Radix 리스너 자체는 남지만 아무것도 하지 않는다.
- 스크린 리더: Radix가 `role="status"` 숨은 영역에 "알림 복사했어요"처럼 읽힌다. `type="background"`라 polite다. 토스트 영역(`role="region"`)의 이름도 "알림"이다.
- 자리는 상태줄 위 16px, 가운데다. 바탕은 `surface-raised`, 테두리 `border-strong`, 아이콘 `accent-text`다. 아래로 밀어 닫을 수 있다(`swipeDirection="down"`).
- 움직임 줄이기: `data-[state=closed]:animate-out`이 `motion-reduce:animate-none`보다 구체적이라 `motion-reduce:data-[state=closed]:animate-none`도 붙였다. `pnpm qa` a11y가 세 폭 × 두 테마에서 `animation-name: none`을 확인한다.
- 문구는 소비자(`src/components/blog/selection-actions.tsx`)에 둔다. 실패 문구 "클립보드에 넣지 못했어요. ⌘C로 복사하세요"의 키는 `keyLabel({ letter: 'c' }, browserPlatform())`라 맥이 아니면 `Ctrl+C`다. 이를 위해 `browserPlatform`·`keyLabel`·`Platform`을 `index.ts`에서 내보냈다(둘 다 이미 첫 화면 청크에 있다).
- `GLOSSARY.md`에 **토스트**를 더했다(상태줄 알림과 다른 것).
- QA: a11y는 폭·테마마다 찾기 줄 다음에 문단 앞 열두 자를 골라 복사하고, 창 blur로 토스트 시계를 멈춘 뒤 선택을 풀어 토스트만 남긴 채 axe를 돌린다. 선택 툴바를 그대로 두면 `div[data-radix-popper-content-wrapper]`가 axe `region` 위반으로 잡힌다. 툴바가 뜬 상태의 axe는 티켓 03 몫이라 여기서는 고치지 않았다. nav는 복사 뒤 토스트 글자·결·"알림" 영역·가운데·상태줄 위·저절로 닫힘을 본다.
