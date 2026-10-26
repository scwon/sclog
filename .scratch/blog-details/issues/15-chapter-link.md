# 15: 장 주소 복사

**What to build:** 글 화면에서 장·절 줄의 줄 번호 칸에 마우스를 올리면 번호 왼쪽에 링크 아이콘이 나타난다. 아이콘을 누르면 그 장 주소가 복사되고, 아이콘이 잠깐 `✓`로 바뀌고, 상태줄에 `✓ 주소 복사됨 · #왜-개발자`가 2초쯤 뜬다. 장 주소로 들어온 독자는 그 장 줄의 번호가 코랄로 칠해지고 줄 번호 칸에 형광 띠가 선 것을 본다. 키보드로도 같은 버튼에 갈 수 있다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "상태줄 알림"·"장 주소", 결정 [줄 번호 클릭의 동작](09-line-number-click.md).

- [x] 디자인 시스템 스토어에 상태줄 알림 채널이 있다. 창 틀 밖(페이지 스크립트)에서 알림을 띄울 수 있고 알림은 열기 요약 자리에 약 2초 떴다가 사라진다. 새 알림은 앞 알림을 바로 바꾼다. 알림 글자는 `aria-live="polite"`로 전해지고 열기 요약은 지금처럼 읽히지 않는다
- [x] 개요에 오른 장·절 제목에만 복사 버튼이 빌드 때 들어간다. 제목은 `aria-labelledby`로 제목 글자만 이름으로 삼고 버튼 이름은 `'{제목}' 장 주소 복사`다. 버튼은 `hidden`으로 나오고 글 화면 스크립트가 붙을 때 드러난다
- [x] 넓은 화면에서는 줄 번호 칸(56px) 전체가 hover 영역이다. 아이콘(12px)은 번호 왼쪽에 놓이고 누르는 영역은 칸 왼쪽 24×24px다. 번호와 본문 줄은 눌러도 아무 일이 없다
- [x] 터치(`hover: none`)와 760px 미만에서는 hover로 아이콘이 나타나지 않는다. 키보드 포커스로는 폭과 상관없이 나타난다
- [x] 누르면 `{origin}{pathname}#{id}`(사람이 읽는 해시)를 복사한다. 주소창 해시는 지금 `history.state`를 넘긴 `history.replaceState`로 바꾸고 스크롤하지 않는다. 클립보드를 쓸 수 없으면 해시만 바꾸고 알림은 `주소창에 넣었습니다`다
- [x] 파일이 열릴 때 해시가 장·절 제목을 가리키면 그 줄 번호를 `accent-text`로 칠하고 줄 번호 칸에 marker 세로줄을 둔다. 움직임은 없다. 다른 장 주소를 복사하면 그 장으로 옮겨 가고 다른 파일로 옮기면 사라진다. 같은 화면에서 개요 링크로 해시만 바뀔 때는 강조하지 않는다
- [x] 단위 테스트: 복사할 주소 문자열과 알림 문구 두 가지
- [x] 빌드 결과물 테스트: 복사 버튼이 개요의 장·절 제목에만 있고 제목의 `aria-labelledby`가 제목 글자를 가리킨다
- [ ] `pnpm qa`: 버튼을 키보드로 눌러 알림과 해시 변경을 확인하고 그 주소로 들어와 강조를 확인한다
- [x] GLOSSARY "장 주소" 정의와 어긋나지 않는다
- [ ] `pnpm verify`·`pnpm qa` 통과

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/15-chapter-link`)

**결정**

- 상태줄 알림 채널은 디자인 시스템 스토어 `stores/notice.ts`다. `$statusNotice`(`{ id, text } | null`), `showStatusNotice(text)`, `clearStatusNotice()`, `STATUS_NOTICE_MS`(2000)를 `@/design-system`에서 내보낸다. 새 알림은 앞 알림과 타이머를 바로 바꾼다. `id`는 알림마다 새 값이어서 같은 글자가 다시 와도 스크린 리더가 다시 읽는다. 티켓 21(이어 읽기)도 이 채널을 쓸 수 있다.
- `Shell` 상태줄은 늘 있는 `aria-live="polite"` 영역을 두고, 알림이 없을 때는 `sr-only`로 비워 둔다. 알림이 떠 있는 동안에는 열기 요약과 글 위치 대신 알림을 보인다. 새 파일을 열면 `clearStatusNotice()`로 앞 파일의 알림을 내리고 열기 요약에 자리를 준다. 열기 요약은 이 채널로 옮기지 않았다. 지금처럼 `aria-hidden`이고 타이머도 그대로다.
- 이 프로젝트의 MDX는 Astro 7 기본 처리기(Sätteri)로 돈다. 그 처리기에서 사용자 hast 플러그인은 제목 id가 붙기 전에 돌아서, rehype 단계로는 id를 알 수 없다. 처리기를 바꾸거나 `@astrojs/markdown-satteri`를 직접 의존성으로 들이는 대신 제목 컴포넌트에서 버튼을 넣었다. 글 페이지(`blog/[slug].astro`)가 본문을 그리기 전에 `Astro.locals.chapterLinks`(개요 id → 제목 글자, `ide.ts`의 `chapterLinkTargets(buildOutline(headings))`)를 채운다. `Chapter`·`Section`·`Subsection`은 공통 `headings/Heading.astro`를 거치고, 이 컴포넌트가 id가 그 표에 있을 때만 `ChapterLink.astro`를 넣는다. 개요와 같은 함수로 고르기 때문에 글의 최상위 제목 단계와 상관없다.
- 제목 글자는 `<span id="{id}:text">`로 감싸고 제목의 `aria-labelledby`가 이 span을 가리킨다. `:`는 slug에 나오지 않아 다른 제목 id와 겹치지 않는다.
- 버튼은 `<span class="doc-chapter-gutter">`(줄 번호 칸 전체, hover 영역) 안에 있다. 보이지 않을 때는 `opacity: 0`에 `pointer-events: none`이라 터치로 눌리지 않는다. `(hover: hover) and (min-width: 760px)`에서 칸에 hover하거나, 폭과 상관없이 `:focus-visible`일 때만 보이고 눌린다. 아이콘은 칸 왼쪽 끝(번호 오른쪽 끝에서 34px 왼쪽)에 놓았고 세로는 그 줄의 `--lh` 가운데에 맞췄다.
- 형광 띠 세로줄은 칸 안 오른쪽(넓은 화면 `right: 9px`, 좁은 화면 `4px`)에 3px 폭으로 제목 높이만큼 긋는다. 번호 색은 `.is-linked`일 때 `accent-text`다.
- 강조는 해시를 따른다. 복사하면 그 장이 `.is-linked`가 된다. 강조가 없던 화면에서 처음 복사해도 마찬가지다. 그래서 화면에 보이는 강조가 주소창과 받는 사람이 보게 될 곳과 늘 같다. 같은 화면에서 개요 링크로 해시만 바뀔 때는 ClientRouter가 `astro:page-load`를 내지 않으므로 강조가 바뀌지 않는다.
- 클릭 위임과 드러내기·강조 스크립트는 `ChapterLink.astro`의 컴포넌트 스크립트로 두었다. 장·절이 있는 글에만 실린다. `BlogPost.astro`의 읽기 위치 스크립트는 고치지 않았다. 클립보드 실패(API 없음, 거부)는 `writeText`의 예외 하나로 받는다.
- ego-browser(1440px, 4315 포트 미리보기)로 확인한 동작은 다음과 같다. 키보드 Enter로 누르면 해시가 `#왜-개발자`로 바뀌고 `history.state`(index·scrollX·scrollY)가 남는다. 상태줄에 `✓ 주소 복사됨 · #왜-개발자`가 떴다가 2초 뒤 비고, 아이콘은 `✓`로 바뀐다. 장 주소로 들어오면 그 장만 강조되고, 개요 링크를 눌러도 강조가 그대로이며, 다른 파일을 거쳐 돌아오면 사라진다. 칸에 hover하면 아이콘이 보인다.
- `pnpm qa`는 공통 지침대로 돌리지 않았다. `scripts/qa/nav.mjs` 끝에 장 주소 시나리오(키보드 복사 → 알림·해시·강조·기록 상태 → 그 주소로 들어와 강조)를 더했고, 통합 브랜치에서 돌린다. 그래서 qa 두 항목은 비워 두었다.
- GLOSSARY "상태줄"에 상태줄 알림을 더했다. "장 주소" 정의는 그대로 맞는다.

