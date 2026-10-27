# 05: 검색·읽기 기록·404와 QA

**What to build:** 검색 화면과 명령 팔레트가 두 폴더의 글을 모두 찾고 결과 줄 경로에 `ai-written/`이 보인다. AI 글의 읽기 기록이 발행 글 정리에서 지워지지 않고 프로필의 `N편 읽음`에 합쳐 센다. 404의 갈 곳에 `ai-written.log`가 있다. `pnpm qa`가 AI 글 쪽 화면 네 곳을 접근성 검사하고, 홈 칸에서 AI 글을 거쳐 돌아오는 이동 시나리오를 통과한다.

**Blocked by:** 01, 02, 03, 04

**Status:** ready-for-agent

스펙의 "검색·팔레트·읽기 기록"·"주소와 경로(404)"·"Testing Decisions(QA)"를 따른다.

- [ ] 검색 색인에 두 폴더의 발행 글이 모두 있고 주소·경로가 폴더를 따른다(테스트)
- [ ] 읽기 기록을 발행 글로 거르는 자리에 두 폴더의 URL을 모두 넘긴다. AI 글을 읽은 기록이 새로고침 뒤에도 남는다
- [ ] 404 갈 곳 목록에 `ai-written.log` 줄이 있다
- [ ] QA 접근성 페이지 목록에 `/ai-written/`, AI 글 한 편, `/ai-written/tags/`, AI 태그별 글을 더한다(두 테마 × 세 폭)
- [ ] QA 이동 시나리오 하나: 홈 아래 칸의 나가는 줄 → `ai-written.log` → AI 글(문구 보임, 경로 표시줄 `ai-written`) → 다음 파일이 AI 글 → 글 끝에서 `ai-written.log` 복귀, 내내 창 틀 유지
- [ ] `pnpm verify`와 `pnpm qa` 통과
