# 01: 폴더가 있는 글 모델과 AI 글 화면

**What to build:** `src/content/ai-written/`에 글 파일을 넣기만 하면 그 글이 `/ai-written/<슬러그>/`에서 열린다. 제목·작성 정보 아래에 "AI가 작성한 글입니다." 한 줄이 본문 블록으로 붙고, 탭과 경로 표시줄에 `ai-written › <연도> › <슬러그>.mdx`가 보이며, 경로 표시줄의 `ai-written` 조각과 글 끝 이동 줄이 `ai-written.log`(`/ai-written/`)로 간다. `/ai-written/`은 홈과 같은 흐름 로그 모양으로 AI 글만 쌓는다. 직접 쓴 글과 홈·탐색기·검색은 이 티켓에서 바뀌지 않는다(발행 글 조회를 `posts` 폴더로 명시해 부른다).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

스펙 `.scratch/ai-written-posts/spec.md`의 "글의 종류는 컬렉션이 정한다"·"주소와 경로"·"글 화면"·"홈과 로그(ai-written.log)"를 따른다. 용어는 `GLOSSARY.md`, 근거는 ADR 0005.

- [ ] 컬렉션이 `blog`와 `ai-written` 둘이고 스키마를 공유한다. frontmatter에 종류 필드가 없다
- [ ] 글의 폴더(`posts` | `ai-written`)를 돌려주는 함수 하나가 있고, 주소·파일 경로·로그 주소가 모두 거기서 갈라진다
- [ ] 발행 글 조회가 폴더 인자를 받는다. 없으면 두 폴더 합산 최신순, `draft`·미래 날짜 규칙은 공통
- [ ] 기존 홈·탐색기·검색 색인·글 목록·태그 화면은 `posts` 폴더만 보도록 명시해 부르고 동작이 그대로다
- [ ] `/ai-written/<슬러그>/`가 열리고 고정 문구 블록(사이트 상수)이 제목 아래, 대표 이미지 위에 줄 번호와 함께 있다. 직접 쓴 글에는 없다
- [ ] 글 끝 이동 줄이 다음 파일 → 그 폴더의 로그(`posts.log` 또는 `ai-written.log`) → 맨 위로이고, 로그 이름·주소가 폴더에서 나온다
- [ ] 경로 표시줄 첫 조각 링크: `posts` → `/`, `ai-written` → `/ai-written/`
- [ ] `/ai-written/`이 `ai-written.log` 탭(로그 종류)으로 열리고 배너·주석·연도별 AI 글(장 흐름 포함)·끝 줄 `글 M편`, 상태줄 요약이 AI 글 수다
- [ ] 첫 AI 글 한 편이 `src/content/ai-written/`에 있다(장 두세 개, 태그 포함). 기존 2023 회고는 그대로다
- [ ] utils 테스트: 폴더별·합산 조회, 폴더별 주소·경로, 글 끝 이동 줄의 로그, `ai-written.log` 줄 구성(선례 `blog.test.ts`·`ide.test.ts`)
- [ ] `pnpm verify` 통과
