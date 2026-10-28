# 04: 폴더 화면은 흐름 로그, 탐색기는 평평하게

**What to build:** `/blog/`·`/ai-written/`를 디렉터리 뷰 대신 그 폴더의 흐름 로그(`posts/`·`ai-written/`)로 되돌리고 `posts.log`·`ai-written.log` 페이지와 파일 줄을 없앤다. 탐색기 트리는 연도 폴더 없이 평평하게, 루트 폴더 머리는 폴더 화면 링크다.

**Blocked by:** 03

**Status:** done

스펙의 "2026-10-28 수정"을 따른다.

- [x] 폴더 표에서 `log` 삭제, 파일 종류에서 `log` 삭제
- [x] `TreeRoot`를 `{ name, url, files }`로. `nextFile`·`treeUrls`·팔레트가 평평한 트리를 본다
- [x] 탐색기 구역 머리가 폴더 화면 링크(현재 폴더면 강조), 파일 줄은 한 단계 들여쓰기
- [x] `FolderLog.astro`가 폴더 화면. `posts.log.astro`·`ai-written.log.astro`·`FolderDir.astro` 삭제. `dirLines`·`file` 줄·`.flow-file*` 삭제
- [x] 글 끝 이동 줄 세 줄, 404 갈 곳 다섯 줄, 경로 표시줄 로그 특수 처리 삭제
- [x] 단위·빌드 결과물 테스트, 스토리 고정값, QA 시나리오, 용어집·DESIGN.md·ADR 0006
- [x] `pnpm verify`·`pnpm qa` 통과

## Comments

### 2026-10-28 구현 (브랜치 `feat/flat-folder-log`)

**결정**

- 글의 파일 경로 `posts/<연도>/<슬러그>.mdx`는 그대로 두었다. 검색 색인·경로 표시줄·탭이 모두 이 경로를 쓰고, 연도는 파일이 놓인 자리로서 뜻이 있다. 탐색기와 폴더 화면만 연도로 묶지 않는다.
- 탐색기 구역 머리는 `h2` 안의 링크다. 글 수를 머리 오른쪽에 두어 연도 줄이 하던 "N" 표시를 이어받았다.
- 다음 파일이 연도를 넘게 되었다. 같은 폴더 안이면 지난해 가장 새 글 다음은 올해 가장 오래된 글이다.
- 티켓 02에서 만든 파일 줄(`file`)과 CSS는 지웠다. 쓰는 곳이 없다.
