# 03: QA와 문서

**What to build:** `pnpm qa`가 새 화면 구조에서 통과한다. 접근성 페이지 확인 목록에 `ai-written/` 디렉터리 뷰와 새 로그 주소를 넣고, 이동 시나리오가 루트 → `posts/` → 글로 시작한다. 용어집·DESIGN.md·ADR을 새 구조에 맞춘다.

**Blocked by:** 02

**Status:** done

스펙의 "Testing Decisions(QA)"를 따른다.

- [x] `a11y.mjs`: AI 화면 목록(`/ai-written/`, `/ai-written/ai-written.log/`)
- [x] 시나리오 시작 경로: `scenario.mjs`·`tabs-and-theme`·`unfold`·`resume`가 루트 → `posts/` → 글
- [x] `ai-written.mjs`: 루트 `ai-written/` 줄 → 디렉터리 뷰 → `ai-written.log` → AI 글 → 글 끝 `ai-written.log`
- [x] `GLOSSARY.md`: 디렉터리 뷰·파일 줄·루트, 흐름 로그·링크 줄 갱신, AI 글 칸 삭제
- [x] `DESIGN.md` 사이트 방향, ADR 0006, ADR 0005 끝에 참조 한 줄
- [x] `pnpm qa` 통과

## Comments

### 2026-10-28 구현 (브랜치 `feat/directory-view`)

**결정**

- `scenario.mjs`의 `homePostUrl()`은 화면을 옮기지 않고 `/blog/` HTML을 내려받아 첫 파일 줄의 주소를 읽는다. 글로 바로 `goto`하는 시나리오 여덟 개(find·search·shortcuts 등)는 그래서 손대지 않았다. 루트에서 클릭으로 시작하는 시나리오(tabs-and-theme·unfold·resume)는 새 `openPostsDir()`로 `posts/`를 거친다.
- `tabs-and-theme`: 탭 수가 3(루트·`posts/`·글)이고 뒤로 가기는 세 번이다. 디렉터리 뷰가 패널을 그대로 두는지(프로필)도 본다. 글 탭을 닫은 뒤에는 `posts/` 탭 → 파일 줄로 다시 연다.
- `resume`: 홈으로 갔다가 돌아올 때 열린 탭을 눌러 돌아온다. 루트에는 글 링크가 없다.
- `ai-written`: 루트 `ai-written/` 줄 → 디렉터리 뷰(`kind: dir`) → `ai-written.log` 줄 → 로그 → AI 글. 글 끝의 로그 주소는 `/ai-written/ai-written.log/`, `posts.log` 줄 없음은 `/blog/posts.log/`로 본다.
- `a11y.mjs`: 읽기 기록 씨앗의 글 URL 정규식에서 `posts.log`·`ai-written.log` 주소를 뺐다. AI 화면 확인 목록은 다섯 곳.
- 결과: axe 142회 위반 0, 이동 시나리오 11개 통과(`pnpm qa` 12개 모두).
- 문서: 용어집에 루트·디렉터리 뷰·파일 줄을 더하고 흐름 로그·링크 줄·폴더·읽음 꼬리표를 고쳤다. AI 글 칸은 지웠다. DESIGN.md 사이트 방향 한 줄과 탭 시안 값, ADR 0006, ADR 0005 끝 한 줄.
