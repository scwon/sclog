# 03: 홈 아래 AI 글 칸

**What to build:** 홈 `posts.log`는 직접 쓴 글만 쌓고, 연도별 글이 끝난 뒤 나가는 줄 `ai-written.log ---- 글 M편`(링크 `/ai-written/`) 아래에 AI 글 로그 줄을 최신순 최대 다섯 개 보인다(장 흐름·접힘 없음). AI 글이 0편이면 그 칸이 아예 없다. 끝 줄 `글 N편`과 상태줄 요약은 직접 쓴 글만 센다.

**Blocked by:** 01 (폴더가 있는 글 모델과 AI 글 화면)

**Status:** done

스펙의 "홈과 로그"를 따른다. 나가는 줄은 태그 목록과 같은 줄 종류(`entry`)를 쓴다.

- [x] 홈 줄을 만드는 함수가 AI 글 목록을 더 받아 칸을 끼운다. 다섯 개 상한, 0편이면 생략
- [x] 나가는 줄의 수 M은 AI 글 전체 수이고 `/ai-written/`로 간다. 키보드로 닿는다
- [x] 끝 줄과 `posts.log` 탭의 상태줄 요약이 직접 쓴 글 수다
- [x] flow 테스트: 칸 구성, 상한, 생략, 끝 줄 수
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `ticket/03-home-ai-section`)

**결정**

- 시그니처는 `homeLines(posts, site, aiWritten = [])`다. 세 번째 인자를 기본값 빈 배열로 두어 AI 글을 넘기지 않으면 칸이 생략된다. `aiWritten`은 최신순으로 정렬된 AI 글 전체(`getPublishedPosts('ai-written')`의 흐름)를 받는다. 나가는 줄의 M은 그 길이이고, 로그 줄은 앞에서 다섯 개만 쓴다.
- 상한은 `HOME_AI_WRITTEN_LIMIT = 5`(flow.ts)로 둔다. 스펙대로 조정 옵션은 없다.
- 나가는 줄은 `entry` 줄(`label` `ai-written.log`, `href` `/ai-written/`, `note` `글 M편`)이다. 이름과 주소는 `FOLDER_ROUTES['ai-written'].log`에서 읽는다. `entry`는 `<a>`로 그려지므로 키보드로 닿는다.
- AI 글 로그 줄은 `foldable: false`이고 장 줄·접힘 줄이 없다. 칸 앞에 연도 줄을 두지 않으므로 화면 읽기 제목 순서에서 AI 글 제목(`h3`)은 마지막 연도 `h2` 아래에 놓인다. 스펙이 칸에 연도 줄을 두지 않았기 때문에 이 순서는 그대로 두었다.
- 상태줄 요약 `글 N편`은 `index.astro`가 이미 `getPublishedPosts('posts')`로 세고 있었다(티켓 01). 바꾸지 않았다.
- 홈 빌드는 AI 글 전체를 `loadFlows`로 렌더한다. 칸에는 장 흐름이 필요 없지만 `ai-written.log`도 같은 렌더를 하므로 따로 줄이지 않았다.
- flow 테스트 3개 추가(칸 구성, 다섯 개 상한과 M, 0편 생략). 상한을 6으로 바꾸면 상한 테스트가 실패하는 것을 확인했다. `pnpm verify` 통과. `pnpm qa`는 돌리지 않았다(이동 시나리오는 티켓 05).
