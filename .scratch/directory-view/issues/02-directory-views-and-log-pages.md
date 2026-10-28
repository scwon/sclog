# 02: 루트·폴더 디렉터리 뷰와 로그 페이지

**What to build:** 홈을 루트 디렉터리 뷰로, `/blog/`·`/ai-written/`를 폴더 디렉터리 뷰로 바꾸고, 흐름 로그를 `/blog/posts.log/`·`/ai-written/ai-written.log/`로 옮긴다. `FlowLog.astro`가 파일 줄을 그리고 `ide.css`가 입힌다. 404 갈 곳과 빌드 결과물 테스트, Storybook `Home` 스토리를 맞춘다.

**Blocked by:** 01

**Status:** done

스펙의 "화면"·"스타일"을 따른다.

- [x] `src/pages/index.astro` 루트 디렉터리 뷰(`kind: 'root'`, 요약 `폴더 N개`)
- [x] `FolderDir.astro`와 `/blog/`·`/ai-written/` 페이지
- [x] `FolderLog.astro`와 `posts.log.astro`·`ai-written.log.astro`
- [x] `FlowLog.astro`의 `file` 줄과 읽음 꼬리표, `ide.css`의 `.flow-file*`
- [x] 404 갈 곳: `/` → 폴더마다 디렉터리 뷰·로그·태그 목록
- [x] 빌드 결과물 테스트(`pages`, `doc-end-lines`)와 `Home` 스토리
- [x] `pnpm verify` 통과

## Comments

### 2026-10-28 구현 (브랜치 `feat/directory-view`)

**결정**

- 로그 페이지 파일은 `src/pages/blog/posts.log.astro`·`src/pages/ai-written/ai-written.log.astro`다. Astro가 점이 든 파일 이름을 그대로 경로로 쓰므로 `dist/blog/posts.log/index.html`이 생긴다. 사이트맵에도 저절로 든다.
- 디렉터리 뷰의 링크 줄 순서는 `tags/` → 로그 → 글 파일 줄이다. 폴더가 파일보다 먼저라는 `ls` 관례를 따랐다. 로그 줄의 메모는 `흐름 로그`.
- `ai-written/` 안의 태그 줄 이름도 `tags/`다(경로가 `ai-written/tags/`이지만 그 폴더 안에서는 상대 이름).
- 파일 줄은 링크 하나(`.flow-file-link`: 날짜·파일 이름·제목)와 읽는 시간, 꼬리표 자리로 나뉜다. 읽음 꼬리표는 `[data-post-url]`+`[data-reading-mark]`라 기존 스크립트가 그대로 채운다. 좁은 폭(760px 미만)은 파일 이름·읽는 시간을 숨긴다.
- 레일의 점은 `--border-strong` 6px, 줄에 포커스·마우스가 오면 코랄이다. 글 로그 줄의 12px 코랄 노드보다 작게 두어 "파일 한 줄"로 읽힌다.
- 루트 요약은 `폴더 N개`, 디렉터리 뷰 요약은 `글 N편`.
- 빌드 결과물 테스트: 루트에 폴더 줄 두 개만(글 카드·파일 줄 없음), 두 디렉터리 뷰의 링크 줄과 파일 줄이 그 폴더의 글 주소와 같음, 연도 줄 없음, 404 갈 곳 일곱 줄, 글 끝 네 줄. 562개 통과.
- 1440·390px 화면을 ego-browser로 확인했다(루트·`posts/`).
