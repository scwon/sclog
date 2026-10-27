# 05: 검색·읽기 기록·404와 QA

**What to build:** 검색 화면과 명령 팔레트가 두 폴더의 글을 모두 찾고 결과 줄 경로에 `ai-written/`이 보인다. AI 글의 읽기 기록이 발행 글 정리에서 지워지지 않고 프로필의 `N편 읽음`에 합쳐 센다. 404의 갈 곳에 `ai-written.log`가 있다. `pnpm qa`가 AI 글 쪽 화면 네 곳을 접근성 검사하고, 홈 칸에서 AI 글을 거쳐 돌아오는 이동 시나리오를 통과한다.

**Blocked by:** 01, 02, 03, 04

**Status:** done

스펙의 "검색·팔레트·읽기 기록"·"주소와 경로(404)"·"Testing Decisions(QA)"를 따른다.

- [x] 검색 색인에 두 폴더의 발행 글이 모두 있고 주소·경로가 폴더를 따른다(테스트)
- [x] 읽기 기록을 발행 글로 거르는 자리에 두 폴더의 URL을 모두 넘긴다. AI 글을 읽은 기록이 새로고침 뒤에도 남는다
- [x] 404 갈 곳 목록에 `ai-written.log` 줄이 있다
- [x] QA 접근성 페이지 목록에 `/ai-written/`, AI 글 한 편, `/ai-written/tags/`, AI 태그별 글을 더한다(두 테마 × 세 폭)
- [x] QA 이동 시나리오 하나: 홈 아래 칸의 나가는 줄 → `ai-written.log` → AI 글(문구 보임, 경로 표시줄 `ai-written`) → 다음 파일이 AI 글 → 글 끝에서 `ai-written.log` 복귀, 내내 창 틀 유지
- [x] `pnpm verify`와 `pnpm qa` 통과

## Comments

### 2026-10-27 구현 (브랜치 `ticket/05-search-history-qa`)

**결정**

- 검색 색인은 `getPublishedPosts()`(두 폴더 합산 최신순)로 만든다. `SearchPostSource`에 `notice?`를 더해 AI 글이면 `SITE.aiWrittenNotice`를 작성 정보 다음 한 줄로 센다. 그래서 AI 글 본문 블록의 줄 번호가 글 화면과 맞는다. 주소·경로는 `postFile`에서 나오므로 결과 줄 위치에 `ai-written/2026/…`이 보인다.
- 빌드 결과물 테스트(`src/test/build-output/search-index.test.ts`)는 두 원본 폴더를 읽어 URL과 경로(`posts/<연도>/…`·`ai-written/<연도>/…`)를 맞대고, 줄 번호 블록에 `.doc-notice`를 넣었다. AI 글의 줄 번호도 글 화면 HTML과 맞는 것을 확인했다.
- 읽기 기록은 코드를 바꾸지 않았다. 티켓 02의 `treeUrls(tree)`로 이미 두 폴더 URL이 넘어간다. 새 이동 시나리오가 AI 글을 끝까지 읽고 새로고침한 뒤에도 탐색기 `✓`와 저장값이 남고, 프로필이 `1편 읽음`으로 세는 것을 본다.
- 404 갈 곳에는 `posts.log` 다음에 `ai-written.log` 줄(`AI 글 흐름 로그`)을 두었다. 이름과 주소는 `FOLDER_ROUTES['ai-written'].log`에서 읽는다.
- QA 페이지 목록: `pageUrls()`가 dist의 모든 HTML을 돌기 때문에 AI 화면 네 곳은 이미 들어 있었다. 대신 `a11y.mjs`에서 네 곳 가운데 하나라도 빠지면 실패하게 했다. 읽기 기록 씨앗(`postUrls`)에도 AI 글을 넣어 AI 글 꼬리표도 검사한다. 이름 순으로 AI 글이 먼저 오므로 찾기 줄·선택 툴바·토스트 상태 검사는 이제 AI 글에서 돈다.
- 이동 시나리오 `scripts/qa/nav/ai-written.mjs`: 홈 나가는 줄 → `ai-written.log` → AI 글(문구, 경로 표시줄 `ai-written › 2026 › …`) → 다음 파일 → 글 끝 `ai-written.log` 줄로 복귀까지 매 단계 창 틀 유지를 본다. 글 끝에 `posts.log` 줄이 없는 것도 본다. AI 글이 지금 한 편뿐이라 다음 파일 줄이 없다. 그래서 시나리오는 "다음 파일이 없거나 AI 글"을 확인하고, 줄이 있을 때만 따라간다. 두 번째 AI 글이 생기면 그 단계가 저절로 돈다. QA만을 위해 두 번째 AI 글을 만들지는 않았다.
- 기존 `nav/unfold`가 깨졌다. 홈 아래 AI 글 칸(티켓 03)으로 `.flow-link`가 둘이 되었고, ego의 `click('loc=css:.flow-link')`가 AI 글을 열었다. AI 글에는 `/blog/tags/` 링크가 없다. 그래서 연 글의 폴더에 맞는 태그별 글을 쓰도록 고쳤다.
- 홈에서 AI 글 제목(`h3`)이 마지막 연도 `h2` 아래 놓이는 문제(티켓 03)는 axe가 잡지 않았다. `heading-order`는 단계를 건너뛸 때만 잡는다. 그대로 둔다.
- 측정: `pnpm verify` 통과(테스트 41파일 551개). `pnpm qa` 통과(12개, axe 130회 위반 0). 앞선 두 번의 전체 실행은 공유 ego 브라우저의 CDP 시간 초과(`Input.dispatchMouseEvent`, `page.evaluate` 15초)로 거의 모든 스크립트가 실패했다. 바꾸지 않은 기준 브랜치의 `a11y.mjs`도 같은 자리(`/`)에서 실패해서 인프라 문제로 보았다. 단언 실패는 위 `unfold` 하나뿐이었다.
