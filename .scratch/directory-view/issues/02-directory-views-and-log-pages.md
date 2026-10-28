# 02: 루트·폴더 디렉터리 뷰와 로그 페이지

**What to build:** 홈을 루트 디렉터리 뷰로, `/blog/`·`/ai-written/`를 폴더 디렉터리 뷰로 바꾸고, 흐름 로그를 `/blog/posts.log/`·`/ai-written/ai-written.log/`로 옮긴다. `FlowLog.astro`가 파일 줄을 그리고 `ide.css`가 입힌다. 404 갈 곳과 빌드 결과물 테스트, Storybook `Home` 스토리를 맞춘다.

**Blocked by:** 01

**Status:** open

스펙의 "화면"·"스타일"을 따른다.

- [ ] `src/pages/index.astro` 루트 디렉터리 뷰(`kind: 'root'`, 요약 `폴더 N개`)
- [ ] `FolderDir.astro`와 `/blog/`·`/ai-written/` 페이지
- [ ] `FolderLog.astro`와 `posts.log.astro`·`ai-written.log.astro`
- [ ] `FlowLog.astro`의 `file` 줄과 읽음 꼬리표, `ide.css`의 `.flow-file*`
- [ ] 404 갈 곳: `/` → 폴더마다 디렉터리 뷰·로그·태그 목록
- [ ] 빌드 결과물 테스트(`pages`, `doc-end-lines`)와 `Home` 스토리
- [ ] `pnpm verify` 통과

## Comments
