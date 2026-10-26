# 19: 단축키와 팔레트로 파일 열기

**What to build:** ⌘P(윈도·리눅스는 Ctrl+P)를 누르면 제목 표시줄 아래 가운데에 명령 팔레트가 뜬다. 파일 이름이나 제목 일부를 쳐서 ↑↓·Enter로 글을 연다. Esc·바깥 클릭·고르기로 닫히고 닫히면 포커스가 연 자리로 돌아온다. ⌘B는 패널을 마지막 화면으로 여닫는다. Esc는 맨 위 층 하나만 닫는다. 입력창에서 글을 치거나 한글을 조합하는 중에는 단축키가 동작하지 않는다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "단축키"·"명령 팔레트", 결정 [단축키 체계](04-shortcut-scheme.md)·[패널 검색 화면과 명령 팔레트의 모양](05-search-panel-and-palette.md). 모양은 브랜치 `prototype/search-panel-and-palette`(`?variant=A`).

- [ ] 첫 단계: ⌘⇧F가 Chrome·Safari·Firefox × 맥·윈도에서 페이지에 넘어오는지 직접 눌러 확인하고 결과를 스펙 Comments에 표로 남긴다. 받을 수 없는 조합이 있으면 티켓 22에서 ⌘⇧F를 빼도록 그 티켓에 적는다
- [x] 키 판정 순수 함수가 있다. 키 이벤트 모양(`key`, 수정 키, `isComposing`, 포커스 대상 종류)과 맥락(팔레트 열림, 겹침 패널 열림, 플랫폼)을 받아 동작 하나나 `null`을 돌려준다. 창 틀은 `document`에 리스너 하나만 건다
- [x] 맥은 `metaKey`만, 그 밖은 Ctrl만 받는다. OS 판별은 키 표기를 처음 그릴 때 하고 첫 화면 HTML에는 넣지 않는다
- [x] 끄는 때: 입력창·textarea·contenteditable 포커스(팔레트 입력창의 Esc·↑↓·Enter는 예외), `isComposing`, 팔레트가 열려 있을 때(팔레트 키만). 열린 팔레트에서 ⌘P는 기본 동작만 막는다
- [x] 가로채는 브라우저 키는 ⌘P와 ⌘B뿐이고 나머지 브라우저 키는 `null`이다
- [x] 단위 테스트가 위 규칙과 Esc 층 순서(팔레트 → 좁은 화면 겹침 패널)를 덮는다
- [x] 팔레트는 `role="dialog"`·`aria-modal`이고 안은 콤보박스 + 목록 패턴(`aria-activedescendant`)이다. 폭은 600px 안팎이고 좁은 화면에서는 양옆 16px 여백만 둔다. 처음 쓸 때 불러오는 청크다
- [x] 파일 모드 순수 모듈: 탐색기 트리 props를 검색 화면과 같은 정규화로 거른다. 순위는 이름이 검색어로 시작 → 이름에 포함 → 제목에 포함 → 트리 순서다. 빈 입력은 모든 글을 트리 순서로 보인다. 단위 테스트가 덮는다
- [x] 줄마다 파일 이름, 흐린 글자로 폴더와 제목이 보이고 맨 아래에 "본문에서 찾으려면 ⌘⇧F" 안내가 있다
- [x] 단축키 기준(VS Code 대응 키, 브라우저 키 양보, 겹침 확인표)을 `docs/agents/`에 한 쪽으로 남긴다
- [x] `pnpm qa`: ⌘P → 입력 → Enter로 글 열기 → 다시 열고 Esc로 닫으며 포커스 복귀, ⌘B로 패널 여닫기. 열린 팔레트를 세 폭 × 두 테마로 axe에 넣는다
- [x] 빌드 결과물 테스트: 첫 화면 HTML이 팔레트 청크를 미리 불러오지 않는다
- [ ] `pnpm verify`·`pnpm qa` 통과

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/19-shortcuts-and-palette`)

**사람 확인 대기**

- 첫 단계(⌘⇧F를 세 브라우저 × 두 OS로 눌러 보고 스펙 Comments에 표로 남기기)는 사람 몫이라 하지 않았다. `docs/agents/shortcuts.md`의 겹침 확인표에도 같은 자리를 비워 뒀다. ⌘⇧F의 동작은 티켓 22가 붙인다.
- 마지막 항목은 `pnpm verify`만 통과했다. `pnpm qa`는 4399 포트를 쓰므로 합친 뒤 통합 브랜치에서 돌린다. 대신 같은 스크립트를 이 브랜치 빌드에 4319 포트로 돌렸다. `nav.mjs`는 전부 통과했고, `a11y.mjs`는 홈과 글 두 쪽 × 세 폭 × 두 테마(열린 팔레트 포함, axe 22회)에서 위반이 없었다.

**결정**

- 모듈 이름과 자리. 키 판정은 `components/Shell/shortcuts.logic.ts`(`shortcutFor`·`platformOf`·`keyLabel`), 파일 모드는 `components/Shell/palette.logic.ts`(`paletteFiles`·`normalizeForMatch`), 팔레트는 `components/Shell/Palette.tsx`(`Palette`, 기본 내보내기도 같음)다. 팔레트는 디자인 시스템 진입점(`index.ts`)으로 내보내지 않는다. 창 틀 안에서만 쓰기 때문이다.
- 키 판정이 돌려주는 동작은 `open-palette`·`toggle-panel`·`close-palette`·`close-overlay`·`palette-prev`·`palette-next`·`palette-pick`·`swallow` 여덟 가지다. `null`이 아니면 창 틀이 기본 동작을 막는다. 팔레트 안의 ↑↓·Enter도 창 틀의 리스너 하나가 받고, `ref`의 `PaletteHandle`(`move`·`pick`)로 넘긴다. 그래서 팔레트 입력창에는 keydown 핸들러가 없다.
- 포커스 대상은 `palette-input`·`text`·`other` 셋으로 나눴다. 입력창(체크박스·버튼 같은 비문자 종류는 뺌)·textarea·contenteditable과 함께 select도 `text`로 본다. 팔레트 입력창은 `data-palette-input` 속성으로 알아본다.
- 한글 자판에서는 ⌘P의 `key`가 `ㅔ`로 오기도 한다. 그래서 `key`가 라틴 글자가 아니면 물리 키 `code`(`KeyP`)로 판정한다. Alt나 다른 플랫폼의 수정 키가 함께 눌린 조합은 받지 않는다.
- 스펙이 정하지 않은 키가 하나 있다. 팔레트가 열려 있을 때 Tab은 기본 동작만 막는다(`swallow`). 그렇게 해서 `aria-modal` 대화상자 밖으로 포커스가 나가지 않는다.
- 겹침 패널의 Esc는 원래 창 틀의 별도 리스너가 받았다. 이제는 키 판정의 `close-overlay`가 받는다. 그래서 입력창에 포커스가 있으면 Esc로 겹침 패널이 닫히지 않는다(스펙의 끄는 때를 그대로 따름).
- 바깥 클릭은 투명한 막이 받아 팔레트를 닫는다. 누름은 아래 화면에 닿지 않는다. 팔레트를 닫으면 상태가 사라지므로 다시 열 때마다 빈 입력에서 시작한다. 고르면 팔레트를 닫아 포커스를 연 자리로 돌려준 뒤 링크를 누른 것처럼 이동한다.
- 결과가 없으면 목록 대신 "맞는 파일이 없습니다"를 보인다. 입력창 안내 문구는 "파일 이름으로 찾기"로 두었다. 명령 모드 안내("> 를 입력하면 명령")와 키 표기를 `hover`·`pointer: fine`일 때만 보이는 규칙은 티켓 22가 붙인다. 맨 아래 안내의 키 표기는 플랫폼에 따라 `⌘⇧F`·`Ctrl+Shift+F`로 바뀐다.
- 고른 줄은 코랄 바탕이라, 어두운 테마에서 흐린 글자(`text-muted`)의 명암비가 axe 기준에 모자랐다. 그래서 고른 줄의 폴더·제목만 `text-soft`로 한 단계 밝혔다.
- 정규화(`normalizeForMatch`: NFD + 소문자)는 우선 `palette.logic.ts`에 뒀다. 티켓 18의 찾기 모듈과 합칠 때 한 함수로 모은다.
- 플랫폼은 키를 처음 받을 때 `navigator.userAgentData.platform`(없으면 `navigator.platform`)으로 정한다. iPad·iPhone은 ⌘로 본다.

**측정값**

- 팔레트 청크 `Palette.*.js`는 3,549B(gzip 1,762B)다. 첫 화면 HTML과 다른 청크는 이 청크를 정적으로 가져오지 않고, 창 틀 청크의 `import()` 한 곳에서만 불러온다(빌드 결과물 테스트).
- 팔레트 상자: 1440px 폭에서 600px, 390px 폭에서 358px(양옆 16px). 위쪽은 화면 위에서 44px(제목 표시줄 바로 아래 6px)다.
