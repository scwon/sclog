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

### 2026-10-27 리뷰 반영 (브랜치 `fix/ai-written-review`)

`git diff main...feat/ai-written-posts` 리뷰(Standards·Spec)의 지적을 반영했다.

**결정**

- 폴더마다 갈리는 값은 모두 `FOLDER_ROUTES`에 둔다. `kind`(종류 이름), `list`(글 목록, AI 글은 `null`), `tagPath`(태그 화면 파일 경로 앞부분), `notice`(고정 문구, 직접 쓴 글은 `null`)를 더했다. `postFolder`는 컬렉션으로 표를 거꾸로 찾고, 경로 표시줄의 `tags` 조각은 그 조각까지의 경로를 `tagPath`와 맞대어 폴더를 찾는다(`tagPathFolder`). 글 화면의 문구, 검색 색인, 홈·글 목록의 탭 이름·주소도 표에서 읽는다.
- 404 갈 곳은 표에서 쌓는다: 폴더마다 로그 → 글 목록이 있는 폴더의 목록 → 폴더마다 태그 목록. 그래서 `ai-written/tags/` 줄이 새로 생겼다. 메모는 `<종류> 흐름 로그`·`<종류> 목록`·`<종류> 태그 목록`이다. 예전 `홈 흐름 로그`·`모든 글`은 `직접 쓴 글 흐름 로그`·`직접 쓴 글 목록`으로 바뀌었다.
- 두 `[slug].astro`는 `postPaths(folder)`(`getPublishedPosts` 위)로 경로를 만든다. 초안·예약 글은 화면도 사이트맵 항목도 생기지 않는다. 지금 글 두 편(2023 회고, 2026-10-26 AI 글)은 둘 다 초안이 아니고 발행일이 지나 그대로 남는 것을 빌드로 확인했다. 본문 그리기는 `src/components/blog/PostPage.astro`로 모았다.
- 홈 AI 글 칸 머리는 `entry` 줄 그대로 두고 `heading: true`로 `h2` 안의 링크로 그린다. 연도 줄과 같은 단계라 제목 이동에서 AI 글 제목(`h3`)이 `2023년 글` 아래로 읽히지 않는다. 티켓 03·05에서 그대로 두기로 한 판단을 뒤집는다. `/ai-written/`은 연도 줄 `h2` 아래 `h3`라 바꾸지 않았다. 빌드 결과물 테스트가 홈에서 AI 글 제목 앞의 마지막 `h2`가 `ai-written.log`인지 본다.
- 검색 색인은 고정 문구 줄을 빈 글자로 둔다(`SearchPostSource.notice`는 이제 `boolean`). 줄 번호 세기는 그대로이고 색인 모양(판 1)도 그대로다. 그림만 있는 블록과 같은 방식이라 검색 화면 코드는 바꾸지 않았다. "AI가" 같은 검색어가 모든 AI 글에 걸리지 않는다.
- 작은 정리: `treeYears(tree)`를 팔레트·`nextFile`·`treeUrls`가 같이 쓴다. `.doc-byline`과 `.doc-notice`의 같은 글자 규칙을 한 규칙으로 묶었다. 용어집에 폴더·루트 폴더·고정 문구·AI 글 칸을 더하고 다음 파일 정의를 "같은 연도 폴더 안, 루트 폴더를 넘지 않음"으로 고쳤다.
- 측정: `pnpm verify` 통과(테스트 41파일 554개). `QA_PORT=4358 pnpm qa` 첫 실행에 통과(12개, axe 130회 위반 0). 이번에는 CDP 시간 초과가 없었다.
