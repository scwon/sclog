# 01: 폴더 표·파일 종류·루트 탭

**What to build:** 폴더 표에 `dir`을 두고 `log` 주소를 폴더 안으로 옮긴다. 파일 종류에 `root`·`dir`을 더하고, 고정 첫 탭을 `/`(`ROOT_TAB`)로 바꾼다. 경로 표시줄·글 끝 이동 줄·패널 규칙이 새 표를 따른다. 줄 모델에 `rootLines`·`dirLines`·`file` 줄을 더하고 `homeLines`를 지운다.

**Blocked by:** 없음

**Status:** done

스펙의 "폴더 표"·"주소와 경로"·"줄 모델"을 따른다.

- [x] `FOLDER_ROUTES`: `list` 대신 `dir`, `log.url`이 `/blog/posts.log/`·`/ai-written/ai-written.log/`. `ROOT` 상수
- [x] `FileKind`에 `root`·`dir`. `viewForFile`: `root` → 프로필, `log`는 지금 화면 유지
- [x] `ROOT_TAB`(`/`)으로 이름 바꾸기(탭 스토어, 탭 컴포넌트, 디자인 시스템 export)
- [x] `fileCrumbs`: 루트 `/`, 로그 `posts › posts.log`, 폴더 조각 → 디렉터리 뷰
- [x] `docEndLinks`: 다음 파일 → 폴더 → 로그 → 맨 위로
- [x] `rootLines`·`dirLines`·`file` 줄. `homeLines`·`HOME_AI_WRITTEN_LIMIT` 삭제
- [x] 단위 테스트(flow·ide·tabs·storage·file·panel) 갱신

## Comments

### 2026-10-28 구현 (브랜치 `feat/directory-view`)

**결정**

- `ROOT`는 `folder.ts`에 두되 폴더 표 밖이다. 루트는 폴더가 아니고(`isFolder('/')`는 거짓) 경로 표시줄도 `/` 한 조각이다.
- 파일 종류는 `root`와 `dir`을 따로 둔다. 패널 규칙이 루트만 프로필로 바꾸고 디렉터리 뷰는 지금 화면을 두기 때문이다. `log`는 더 이상 프로필로 바꾸지 않는다(폴더 안 파일).
- `fileName('/')`은 빈 문자열이라 쓰지 않는다. 탭 라벨은 `.mdx`가 아니면 경로를 그대로 보이므로 `/`·`posts/`가 그대로 나온다.
- `dirLines`는 `BlogPost[]`를 받아 `postFile`로 주소·읽는 시간을 뽑는다. 장 흐름이 필요 없어 `render`를 하지 않는다(`loadFlows` 불필요).
- 링크 줄(`tags/`, `posts.log`)은 페이지가 `entries`로 넘긴다. 줄 모델은 폴더 표를 모른다.
- 글 끝 이동 줄은 네 줄(다음 파일 → 폴더 → 로그 → 맨 위로)이다. 폴더로 돌아가는 줄이 로그보다 먼저다.
- 단위 테스트: flow(`rootLines`·`dirLines` 4개, `homeLines` 3개 삭제), ide(루트·디렉터리 뷰 crumbs, 네 줄), panel(`root`), file(`open /`), tabs·storage(이름). 400개 통과.
