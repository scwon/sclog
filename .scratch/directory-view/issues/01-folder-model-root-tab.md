# 01: 폴더 표·파일 종류·루트 탭

**What to build:** 폴더 표에 `dir`을 두고 `log` 주소를 폴더 안으로 옮긴다. 파일 종류에 `root`·`dir`을 더하고, 고정 첫 탭을 `/`(`ROOT_TAB`)로 바꾼다. 경로 표시줄·글 끝 이동 줄·패널 규칙이 새 표를 따른다. 줄 모델에 `rootLines`·`dirLines`·`file` 줄을 더하고 `homeLines`를 지운다.

**Blocked by:** 없음

**Status:** in-progress

스펙의 "폴더 표"·"주소와 경로"·"줄 모델"을 따른다.

- [ ] `FOLDER_ROUTES`: `list` 대신 `dir`, `log.url`이 `/blog/posts.log/`·`/ai-written/ai-written.log/`. `ROOT` 상수
- [ ] `FileKind`에 `root`·`dir`. `viewForFile`: `root` → 프로필, `log`는 지금 화면 유지
- [ ] `ROOT_TAB`(`/`)으로 이름 바꾸기(탭 스토어, 탭 컴포넌트, 디자인 시스템 export)
- [ ] `fileCrumbs`: 루트 `/`, 로그 `posts › posts.log`, 폴더 조각 → 디렉터리 뷰
- [ ] `docEndLinks`: 다음 파일 → 폴더 → 로그 → 맨 위로
- [ ] `rootLines`·`dirLines`·`file` 줄. `homeLines`·`HOME_AI_WRITTEN_LIMIT` 삭제
- [ ] 단위 테스트(flow·ide·tabs·storage·file·panel) 갱신

## Comments
