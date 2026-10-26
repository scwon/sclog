# 20: 읽기 기록과 읽은 글 꼬리표

**What to build:** 독자가 글을 끝까지(읽은 비율 90% 이상) 읽으면 읽은 글이 되고 중간에 떠나면 마지막 장과 비율이 남는다. 탐색기·홈 흐름 로그·다음 파일 줄에 읽은 글은 `✓`, 읽는 중인 글은 `42%`로 표시된다. 프로필 화면 맨 아래 "읽기 기록" 칸에서 기록 수를 보고 한 번에 지운다. 지우면 표시가 바로 사라진다. 기록은 다음 방문까지 남는다.

**Blocked by:** 12 (다음 파일 줄)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "읽기 기록과 이어 읽기", 결정 [기억 원칙](03-memory-principles.md)·[이어 읽기와 읽은 글의 겉모습](08-resume-and-read-marks.md), ADR 0004. 모양은 브랜치 `prototype/resume-and-read-marks`(`?reading=A`).

- [x] `localStorage`의 `read`(`{ v: 1, urls }`)와 `position`(`{ v: 1, entries: { url, chapter, percent }[] }`, 최근 갱신 순, 최대 20편)에 저장한다
- [x] 기록 순수 모듈: 90% 이상이면 `read`에 넣고 `position`에서 뺀다. 90% 미만이고 지금 장이 있으면 `position`을 갱신해 맨 앞으로 올린다. 장이 없으면(첫 장 제목 전) 저장하지 않는다. 20편을 넘으면 가장 오래된 것부터 버린다. 복원 때 모양이 틀린 값, 발행 글 목록에 없는 URL, 읽은 글의 위치를 버린다. `N편 읽음 · M편 읽는 중`을 집계한다
- [x] 단위 테스트가 위 규칙을 모두 덮는다
- [x] 기록 스토어는 디자인 시스템에 있고 창 틀과 페이지 스크립트가 같이 구독한다. 저장소에는 초당 한 번 이하로 묶어 쓰고 화면을 떠날 때(`astro:before-swap`, `pagehide`) 마지막 값을 쓴다. 저장소를 못 쓰면 안내 없이 메모리에만 둔다. `storage` 이벤트는 구독하지 않는다
- [x] 탐색기 파일 줄 끝 꼬리표: 읽은 글은 `✓`이고 파일 이름이 흐려진다. 읽는 중은 `42%`(강조 글자색)다. 파일 이름이 먼저 말줄임된다
- [x] 흐름 로그 글 로그 줄 머리에 `✓ 읽음`·`71% 읽는 중`을, 다음 파일 줄 메모 뒤에 같은 꼬리표를 HTML이 그려진 뒤 덧붙인다
- [x] 스크린 리더 글자는 "읽음"·"42% 읽는 중"이고 기호는 `aria-hidden`이다
- [x] 프로필 화면 맨 아래 "읽기 기록" 칸에 `이 브라우저에 N편 읽음 · M편 읽는 중`과 `기록 지우기`가 있다. 기록이 없으면 `이 브라우저에 남은 읽기 기록이 없습니다`만 보이고 버튼은 그리지 않는다. 지우기는 두 키를 모두 지우고 확인 창을 띄우지 않는다
- [x] `pnpm qa`: 글 끝까지 스크롤하면 탐색기에 `✓`가 붙고 지우기를 누르면 사라진다. 꼬리표가 붙은 탐색기와 프로필의 읽기 기록 칸을 axe에 넣는다
- [x] `Shell` Storybook에 꼬리표가 붙은 탐색기와 읽기 기록 칸 스토리가 있다
- [ ] `pnpm verify`·`pnpm qa` 통과 (verify 통과, qa는 통합 브랜치에서 돈다)

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/20-reading-history-marks`)

**결정**

- 순수 모듈은 `src/design-system/stores/readingHistory.logic.ts`(`record`·`restoreHistory`·`keepPublished`·`storedHistory`·`readingMark`·`markText`·`summarizeHistory`), 바인딩은 `readingHistory.ts`(`$readingHistory`·`recordReading`·`keepPublishedHistory`·`clearReadingHistory`·`flushReadingHistory`)다. 둘 다 `@/design-system`으로 내보냈다.
- 이미 읽은 글은 다시 읽다가 90% 아래로 내려가도 위치를 남기지 않는다. 복원 때 "읽은 글의 위치를 버린다"는 규칙과 같은 불변식을 쓸 때도 지킨다.
- 위치 항목은 장 id가 빈 문자열이 아니고 비율이 0 이상 90 미만일 때만 맞는 모양으로 본다. 겹친 URL은 앞의 것만 남긴다.
- 페이지 스크립트는 발행 글 목록을 모르므로, 스토어는 처음 불러올 때 모양만 거른다. 발행 글 거르기는 창 틀이 하이드레이션 뒤 트리의 URL로 `keepPublishedHistory`를 한 번 불러 맡는다.
- 쓰기 묶음은 첫 변경 뒤 1초에 한 번 쓰는 타이머다. 스토어(메모리)는 바로 바뀌므로 읽는 중 꼬리표는 스크롤을 따라 곧장 달라진다. `astro:before-swap`·`pagehide` 리스너는 스토어 모듈이 불러올 때 한 번 건다.
- 글 화면 스크립트는 에디터 루트의 `data-file-url`을 기록의 키로 쓴다.
- 탐색기에서 지금 연 글은 읽은 글이어도 이름을 흐리지 않고 선택 글자색을 그대로 둔다. 꼬리표는 붙는다.
- 정적 HTML 쪽 꼬리표는 `src/utils/readingMark.ts`의 `fillReadingMark(slot, mark, 'short' | 'long')`가 채우고 색은 ide.css가 `data-mark`(`read`·`reading`)로 입힌다. 흐름 로그는 글 로그 줄에 `data-post-url`을, 머리 끝에 빈 자리 `span.flow-log-mark[data-reading-mark]`를 빌드 때 둔다.
- 스크린 리더 글자 앞에 공백을 넣어 탐색기 링크 이름이 "pro-developer-2023-days.mdx 읽음"처럼 띄어 읽힌다. 기록을 지우면 버튼이 사라지므로 포커스를 안내 줄(`tabindex="-1"`)로 옮긴다.
- 확인: ego-browser 1440px에서 같은 연도 임시 글을 커밋하지 않고 넣어 봤다. 글을 반쯤 읽으면 탐색기에 `50%`, 다른 글로 옮기면 그 글의 `33%`가 다음 파일 줄에 붙었다. 끝까지 내리면 `✓`가 붙었고, 지우기 뒤에는 두 키가 모두 `null`이 되며 흐름 로그와 탐색기의 꼬리표가 사라졌다. `pnpm qa`는 돌리지 않았다(통합 브랜치에서 돈다). a11y 검사는 폭·테마마다 읽은 글과 42% 읽는 중을 번갈아 넣는다.
- GLOSSARY에 **읽음 꼬리표**를 더했다.

### 2026-10-27 리뷰 수정 (브랜치 `blog-details/review-fixes`)

- 1440 라이트에서 지금 연 글의 탐색기 줄에 붙은 `42%` 꼬리표가 선택 바탕 위 4.19:1이었다. 원시 값은 그대로 두고, 선택 바탕 줄에서는 꼬리표와 개요의 지금 장 번호를 `text-soft`로 그린다(7.7:1). 선택 바탕 위 글자 명암비는 `tokens.test.ts`가 지킨다.
- 저장소를 읽기만 해도 던지는 브라우저에서 기록 스토어가 불러오다 멈추던 문제는 `visitorStorage`로 고쳤다. `record`는 `applyReading`으로 이름을 바꿨고, 판 번호는 `HISTORY_SAVE_VERSION`이다.
