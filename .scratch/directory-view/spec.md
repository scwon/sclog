# 루트와 폴더의 디렉터리 뷰

Status: done (티켓 04로 폴더 화면을 흐름 로그로 되돌림)

용어는 `GLOSSARY.md`를 따른다(에디터, 탐색기, 루트 폴더, 폴더, 흐름 로그, 링크 줄, 파일 줄, 디렉터리 뷰, 다음 파일, 경로 표시줄). 결정의 근거는 ADR 0006이다. 이 스펙은 그 결정을 화면과 구조로 옮긴다.

## Problem Statement

홈은 `posts.log` 탭이다. 블로그에 들어오면 직접 쓴 글의 흐름 로그가 바로 열리고, AI 글은 그 맨 아래 칸에서만 보인다. 글이 두 폴더(`posts`, `ai-written`)로 나뉜 뒤로는 "홈 = 한 폴더의 로그"가 어색해졌다. 탐색기는 루트 폴더 둘을 보이는데 에디터의 홈은 그중 하나만 쌓고, `posts/`(`/blog/`)와 `ai-written/`(`/ai-written/`)는 같은 흐름 로그 모양을 되풀이한다. 폴더를 열었을 때 IDE라면 보일 "이 폴더에 무엇이 있는가"가 없다.

## Solution

홈을 루트 디렉터리 뷰로 바꾼다. 탭 이름은 `/`이고, 블로그 이름·주석 아래 폴더 줄 `posts/ ---- 글 N편`, `ai-written/ ---- 글 M편`이 놓인다. `posts/`(`/blog/`)와 `ai-written/`(`/ai-written/`)는 그 폴더의 디렉터리 뷰가 되어 `tags/` 폴더 줄, 흐름 로그 파일 줄, 글 파일 줄(최신순, 연도로 나누지 않음)을 보인다. 흐름 로그는 폴더 안의 파일로 남는다: `posts/posts.log`(`/blog/posts.log/`), `ai-written/ai-written.log`(`/ai-written/ai-written.log/`). 홈 아래 AI 글 칸은 없어진다. 루트의 `ai-written/` 줄이 그 역할을 한다.

## User Stories

1. 독자로서, 블로그에 들어오면 `/` 탭에 `posts/`와 `ai-written/` 두 폴더가 보이기를 원한다. 글이 두 갈래임을 첫 화면에서 안다.
2. 독자로서, 루트의 폴더 줄에 글 수가 함께 보이기를 원한다. 열기 전에 양을 안다.
3. 독자로서, AI 글이 한 편도 없으면 루트에 `ai-written/` 줄이 없기를 원한다.
4. 독자로서, `posts/`를 열면 그 폴더의 글이 파일 줄(날짜·파일 이름·제목·읽는 시간)로 최신순으로 나열되기를 원한다. 연도로 끊지 않는다.
5. 독자로서, 파일 줄을 누르면 그 글이 열리기를 원한다.
6. 독자로서, 파일 줄에도 읽음 꼬리표(`✓`·`42%`)가 붙기를 원한다.
7. 독자로서, `posts/` 디렉터리 뷰 안에 `posts.log` 파일 줄이 있고 누르면 지금의 흐름 로그(장 흐름 포함)가 열리기를 원한다.
8. 독자로서, `posts/` 안에 `tags/` 폴더 줄이 있어 태그 목록으로 갈 수 있기를 원한다.
9. 독자로서, `ai-written/`도 `posts/`와 같은 디렉터리 뷰이기를 원한다.
10. 독자로서, 흐름 로그 탭의 경로 표시줄이 `posts › posts.log`이고 `posts`를 누르면 `posts/` 디렉터리 뷰로 가기를 원한다.
11. 독자로서, 글의 경로 표시줄 첫 조각(`posts`·`ai-written`)을 누르면 그 폴더의 디렉터리 뷰로 가기를 원한다.
12. 독자로서, 글 끝 이동 줄에 다음 파일 → 그 폴더(`posts/`) → 그 폴더의 로그(`posts.log`) → 맨 위로가 있기를 원한다.
13. 독자로서, `/` 탭이 고정 탭이고 닫히지 않기를 원한다. 지금 `posts.log`가 그렇듯이.
14. 독자로서, 홈(`/`)을 열면 패널이 프로필이기를 원한다. 지금과 같다.
15. 독자로서, 404의 갈 곳에 루트·두 폴더·두 로그·두 태그 목록이 있기를 원한다.
16. 독자로서, 상태줄의 열기 요약이 `❯ open /` → `✓ 열림 · 폴더 2개`, `❯ open posts/` → `✓ 열림 · 글 N편`이기를 원한다.
17. 글쓴이로서, 폴더를 하나 더 두면 루트 줄·디렉터리 뷰·로그 주소가 폴더 표 한 줄로 따라오기를 원한다.
18. 글쓴이로서, `pnpm qa`가 루트·두 디렉터리 뷰·두 로그를 두 테마·세 폭으로 접근성 검사하고, 루트 → `posts/` → 글, 루트 → `ai-written/` → `ai-written.log` → AI 글 이동 시나리오를 통과하기를 원한다.
19. 보조 기술 사용자로서, 파일 줄이 링크 하나로 읽히기를 원한다(날짜·파일 이름·제목이 한 이름).

## Implementation Decisions

### 폴더 표

- `FOLDER_ROUTES`의 `list`를 없애고 `dir: { name, url }`(`posts/` → `/blog/`, `ai-written/` → `/ai-written/`)을 둔다. 두 폴더 모두 있다.
- `log`의 주소가 폴더 안으로 들어간다: `posts.log` → `/blog/posts.log/`, `ai-written.log` → `/ai-written/ai-written.log/`. 이름은 그대로다.
- 루트는 폴더가 아니므로 표 밖에 `ROOT = { name: '/', url: '/' }`로 둔다.

### 주소와 경로

| 화면 | 주소 | 파일 경로(탭·경로 표시줄) | 종류(`kind`) |
| --- | --- | --- | --- |
| 루트 | `/` | `/` | `root` |
| 폴더 디렉터리 뷰 | `/blog/`, `/ai-written/` | `posts/`, `ai-written/` | `dir` |
| 흐름 로그 | `/blog/posts.log/`, `/ai-written/ai-written.log/` | `posts.log`, `ai-written.log` | `log` |
| 글 | 그대로 | 그대로 | `post` |

- 파일 종류에 `root`와 `dir`을 더한다. 패널 규칙: `root`는 프로필, `post`는 탐색기, 나머지는 지금 화면을 둔다(`log`는 더 이상 프로필로 바꾸지 않는다. 폴더 안 파일이다).
- 경로 표시줄: 루트는 `/` 하나. 로그는 `posts › posts.log`. 폴더 조각(`posts`·`ai-written`)의 링크는 그 폴더의 디렉터리 뷰다. `tags` 조각은 그대로 태그 목록이다.
- 탭 스토어의 고정 첫 탭은 `ROOT_TAB = { url: '/', title: '/', path: '/' }`다. 저장값 복원 규칙은 이름만 바뀐다.

### 줄 모델(`src/utils/flow.ts`)

- `homeLines`와 `HOME_AI_WRITTEN_LIMIT`을 없앤다.
- `rootLines(site, folders)`: 배너(블로그 이름) · 주석(작성자 · GitHub 링크) · 빈 줄 · 폴더마다 링크 줄 `posts/ ---- 글 N편` · 끝 줄 `폴더 N개`. 글이 0편인 폴더는 넘기지 않는다(페이지가 거른다).
- `dirLines(posts, { title, comment, entries })`: 배너(`posts/`) · 주석 · 빈 줄 · `entries`의 링크 줄(`tags/ ---- 태그 T개`, `posts.log ---- 흐름 로그`) · 글마다 **파일 줄** · 끝 줄 `글 N편`. 연도 줄은 없다. 글은 넘긴 순서(최신순)다.
- 새 줄 종류 `file`: `{ href, name, title, date, reading? }`. `FlowLog.astro`가 한 링크(`.flow-file-link`: 날짜·파일 이름·제목)와 읽는 시간, 읽음 꼬리표 자리(`data-post-url` + `[data-reading-mark]`)로 그린다. 꼬리표는 글 로그 줄과 같은 스크립트가 채운다.
- `listLines`(로그·태그별 글)와 `linkLines`(태그 목록·404)는 그대로다.

### 화면

- `src/pages/index.astro`: 루트 디렉터리 뷰. 파일 `{ title: '/', path: '/', url: '/', kind: 'root', summary: '폴더 N개' }`.
- `src/components/dir/FolderDir.astro`: 한 폴더의 디렉터리 뷰. `src/pages/blog/index.astro`·`src/pages/ai-written/index.astro`가 쓴다. 파일 `{ title: 'posts/', path: 'posts/', url, kind: 'dir', summary: '글 N편' }`.
- `src/components/flow/FolderLog.astro`: 한 폴더의 흐름 로그(`listLines`, `steps: true`). `src/pages/blog/posts.log.astro`·`src/pages/ai-written/ai-written.log.astro`가 쓴다.
- 글 끝 이동 줄: 다음 파일 → `posts/`(디렉터리 뷰) → `posts.log` → 맨 위로.
- 404 갈 곳: `/`, 폴더마다 디렉터리 뷰 → 로그 → 태그 목록.
- 펼침 대상 선택자(`.flow > .flow-line`)는 파일 줄도 잡는다. 손대지 않는다.

### 스타일

- `ide.css`(2층)에 `.flow-file*`를 더한다. 그리드는 줄 번호 칸 · 레일 · 링크(1fr) · 읽는 시간 · 꼬리표. 레일에 작은 점. 좁은 폭(760px 미만)에서는 파일 이름과 읽는 시간을 숨기고 날짜·제목만 남긴다.
- 색은 의미 토큰만 쓴다. 날짜 `--text-muted`, 파일 이름 `--text`, 제목 `--text-soft`, 호버에 코랄 밑줄.

## Testing Decisions

- `flow.test.ts`: `rootLines`(폴더 줄과 끝 줄), `dirLines`(링크 줄 → 파일 줄 순서, 연도 줄 없음, 끝 줄 수). `homeLines` 테스트는 지운다.
- `ide.test.ts`: `docEndLinks` 네 줄, `fileCrumbs`의 루트·디렉터리 뷰·로그·글.
- `tabs.test.ts`·`storage.test.ts`·`file.test.ts`: `ROOT_TAB`과 `/` 경로.
- 빌드 결과물: `pages.test.ts`(루트에 폴더 줄 두 개, 404 갈 곳, 새 HTML 파일 존재), `doc-end-lines.test.ts`(네 줄).
- Storybook: `Home` 스토리의 파일을 루트로.
- QA: `a11y.mjs`의 AI 화면 목록에 `ai-written/` 디렉터리 뷰와 새 로그 주소. 이동 시나리오는 루트 → `posts/` → 글로 시작하도록 고치고, `ai-written.mjs`는 루트 → `ai-written/` → `ai-written.log` → AI 글 → 글 끝 `ai-written.log`로.

## Out of Scope

- 연도 폴더 페이지(`/blog/2023/`). 연도로 나누지 않기로 했다.
- 루트에 최신 글 미리보기나 `tags/` 줄. 폴더 두 줄만 둔다.
- 탐색기 트리의 모양. 그대로 연도 폴더를 둔다.
- 흐름 로그의 내용·접기 동작. 주소와 경로 표시줄만 바뀐다.
- 이전 주소(`/blog/`가 글 목록이던 것)의 리디렉션. 주소는 같고 모양만 바뀐다.

## 2026-10-28 수정: 폴더 화면은 흐름 로그, 탐색기는 평평하게

머지 뒤 피드백: 홈 → 폴더 → 로그 → 글이 너무 깊고, 폴더 화면이 "기존 posts.log 느낌"이어야 하며, 탐색기가 에디터의 단계를 그대로 보여야 한다. 그래서 티켓 04에서 아래를 바꾼다. 위 본문의 "디렉터리 뷰(폴더)"·"파일 줄"·`posts.log` 주소는 이 수정으로 없어졌다.

- `/blog/`·`/ai-written/`는 그 폴더의 흐름 로그다(이름 `posts/`·`ai-written/`, 종류 `dir`). `tags/`·`posts.log` 줄과 파일 줄은 두지 않는다. `posts.log`·`ai-written.log` 페이지는 없앤다.
- 탐색기 트리는 연도 폴더 없이 루트 폴더 아래 글 파일을 새 글 먼저 평평하게 둔다. 루트 폴더 머리는 폴더 화면 링크다. 다음 파일은 루트 폴더 안에서 연도를 넘어 이어진다.
- 글 끝 이동 줄: 다음 파일 → 폴더 → 맨 위로. 404 갈 곳: 루트 → 폴더마다 폴더 화면·태그 목록.
