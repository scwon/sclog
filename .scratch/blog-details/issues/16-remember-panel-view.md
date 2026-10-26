# 16: 마지막 패널 화면 기억

**What to build:** 새로고침해도 패널이 마지막으로 고른 화면을 보인다. 기억은 브라우저 세션 동안만 남는다. 파일 종류에 따른 화면 규칙(홈은 프로필, 글은 탐색기, 그 밖은 지금 화면)은 그대로이고 저장된 화면은 그 규칙의 "지금 화면" 자리에 들어간다. 패널 화면 목록은 티켓 18이 검색 화면을 더할 수 있게 셋 이상을 받는 모양이 된다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "패널: 세 화면과 마지막 화면", 결정 [기억 원칙](03-memory-principles.md), ADR 0004.

- [x] `sessionStorage`의 `panel` 키에 `{ "v": 1, "view": "<화면>" }`을 저장한다. 열림·닫힘은 저장하지 않는다
- [x] 저장값을 읽는 순수 함수가 `v`가 틀리거나 모르는 화면이면 버린다. 저장소를 쓸 수 없으면 안내 없이 메모리에만 둔다
- [x] 서버 HTML은 지금처럼 파일 종류로 그리고 하이드레이션 뒤 저장된 화면에 파일 종류 규칙을 적용한 화면으로 바꾼다
- [x] 개요로 가는 동작(`[data-explorer-toggle]`)은 늘 탐색기를 연다
- [x] 단위 테스트: 저장값 복원(정상, `v` 틀림, 모르는 화면), 복원한 화면에 파일 종류 규칙 적용
- [x] 프로필 패널 스펙의 Out of Scope "마지막 패널 화면을 새로고침 뒤에도 기억하기"에 이 티켓과 ADR 0004로 바뀌었다는 한 줄을 단다
- [x] `pnpm qa` 이동 시나리오: 태그 화면에서 프로필을 고르고 새로고침하면 프로필이 남는다
- [x] `pnpm verify`·`pnpm qa` 통과

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/16-remember-panel-view`)

**결정**

- 순수 로직은 `panel.logic.ts`에 더했다. `restorePanelView(saved)`는 판 번호(`PANEL_SAVE_VERSION = 1`)가 틀리거나 `PANEL_VIEWS`에 없는 화면이면 `null`을 돌려준다. `savePanelView(view)`는 저장할 `{ v: 1, view }`를 만든다. `startView(saved, kind)`는 저장된 화면(없으면 탐색기)에 `viewForFile`을 적용한다. 서버 첫 화면도 `startView(null, kind)`로 정하므로, 티켓 18이 `viewForFile`에 검색 예외를 더하면 새로고침 경로에도 그대로 적용된다.
- 저장 바인딩은 `components/Shell/panel.ts`(`readPanelView`, `writePanelView`)에 두었다. `stores/tabs.ts`와 같은 짜임이다. 저장소를 못 쓰면 모듈 변수에만 둔다. 창 틀은 화면 이동 사이에 남으므로 이것으로 충분하다.
- 저장 시점은 고른 순간이 아니라 `panel.view`가 바뀔 때마다다. 파일 종류 규칙으로 바뀐 화면도 저장해야 새로고침 전후의 화면이 같다. 예를 들어 글(탐색기)에서 태그 화면으로 옮긴 뒤 새로고침하면, 예전에 고른 프로필이 아니라 지금 보던 탐색기가 나온다. 복원 효과를 저장 효과보다 먼저 선언해서 저장값을 덮어쓰기 전에 읽는다.
- 활동 막대 버튼을 `PANEL_VIEWS.map`과 `VIEW_ICON` 레코드로 그리게 바꿨다. 화면을 하나 더하려면 `PANEL_VIEWS`, `VIEW_LABEL`, `VIEW_ICON`에 항목을 넣고 패널 본문 분기를 더하면 된다. 좁은 화면의 전환 버튼은 이미 `PANEL_VIEWS`를 돌고 있었다.
- `[data-explorer-toggle]`은 원래부터 `showView('explorer')`로 탐색기를 열었다. 코드는 바꾸지 않았다.
- 이동 시나리오(`scripts/qa/nav.mjs`) 끝에 태그 화면 단계를 더했다. 새로 불러온 태그 화면에 글에서 고른 프로필이 남는지 보고, 탐색기를 골라 새로고침한 뒤와 프로필을 골라 새로고침한 뒤 각각 그 화면이 남는지 본다. 지침대로 `pnpm qa`는 돌리지 않았다. 대신 4316 포트 preview에서 같은 시나리오를 돌렸고 22개 항목이 모두 통과했다. 콘솔 오류(하이드레이션 불일치 포함)도 없었다. 마지막 체크박스의 `pnpm qa`는 통합 브랜치에서 확인할 몫으로 남긴다.

### 2026-10-27 리뷰 수정 (브랜치 `blog-details/review-fixes`)

- 쿠키를 막은 Chrome은 `sessionStorage`를 읽기만 해도 SecurityError를 던져서, `typeof` 검사가 `try` 밖에 있던 `panel.ts`도 함께 깨졌다. 지금은 저장소 접근과 메모리 대체를 `stores/storage.ts`의 `visitorStorage`가 맡고, `panel.ts`는 그것만 부른다.
- `panel.ts`는 `stores/`로 옮기지 않았다. `stores/`는 아일랜드 사이 공유 상태 자리인데, 패널 화면은 창 틀 혼자 쓴다. 옮기면 `stores/`가 `components/Shell/panel.logic.ts`를 가져오는 역방향 의존도 생긴다. `VIEW_LABEL`·`VIEW_KEYS`·`VIEW_ICON`은 화면별 맵 `VIEWS` 하나로 합쳤다.
