# 02: 탐색기의 루트 폴더

**What to build:** 탐색기 최상위가 `posts`와 `ai-written` 두 구역으로 나뉘고, 각 구역 안은 지금처럼 연도 폴더와 파일 줄이다. AI 글이 한 편도 없으면 `ai-written` 구역이 없다. 다음 파일은 같은 연도 폴더 안에서만 이어져 루트를 넘지 않고, 명령 팔레트는 두 루트의 파일을 모두 연다.

**Blocked by:** 01 (폴더가 있는 글 모델과 AI 글 화면)

**Status:** done

스펙의 "탐색기 트리"를 따른다.

- [x] 트리의 최상위가 루트 폴더(이름 + 연도 폴더 목록)이고 `posts`가 먼저, `ai-written`이 다음이다. AI 글 0편이면 `ai-written` 루트가 없다
- [x] 창 틀이 두 폴더의 발행 글로 트리를 만들고, 탐색기가 루트마다 이름 있는 구역을 그린다(지금 `posts` 구역 머리와 같은 모양)
- [x] 다음 파일이 루트를 넘지 않는다. AI 글의 다음 파일은 AI 글이다
- [x] 명령 팔레트 파일 목록에 두 루트의 파일이 모두 있고 줄의 경로로 루트가 보인다
- [x] Shell 로직 테스트: 루트 두 개 트리로 `nextFile`·`paletteFiles`(선례 `tree.test.ts`·`palette.test.ts`)
- [x] Storybook: 탐색기가 두 루트를 그리는 스토리 하나
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `ticket/02-explorer-roots`)

**결정**

- 트리 타입은 `TreeRoot { name: string; years: TreeYear[] }`(Shell.tsx)이고 `ShellProps.tree`·`Palette`의 `tree`는 `TreeRoot[]`다. 디자인 시스템은 소비자 쪽 `Folder` 타입을 모르므로 `name`은 `string`이다. `TreeRoot`는 `@/design-system`에서 export한다.
- `buildTree(posts)`(ide.ts)는 넘긴 글을 폴더별로 갈라 `FOLDERS` 순서(`posts` 먼저)로 루트를 만들고, 글이 없는 루트는 뺀다. 루트 안 연도는 최신 먼저, 파일 순서는 넘긴 순서(발행 글 조회의 최신순)다. `BaseLayout`은 `getPublishedPosts()`(두 폴더 합산)로 트리를 만든다. `BlogPost.astro`는 바꾸지 않았다. `getPublishedPosts(folder)`로 루트 하나짜리 트리를 만들어도 다음 파일은 같다.
- `nextFile(tree: TreeRoot[], url)`은 연도 폴더 안에서만 찾으므로 루트를 넘지 않는다(같은 연도라도). `paletteFiles(tree: TreeRoot[], query)`는 두 루트를 루트 순서로 평평하게 담고, 줄의 `folder`는 `ai-written/2026`처럼 루트부터 보인다.
- 트리의 모든 URL은 `treeUrls(tree)`(tree.logic.ts)로 얻는다. 창 틀의 `keepPublishedHistory`가 이것을 쓰므로 이제 두 폴더의 URL을 넘긴다. 티켓 01이 남긴 "AI 글 읽기 기록이 지워지는" 틈은 이 변경으로 닫혀야 하고, 브라우저에서 확인하는 일은 티켓 05에 남긴다.
- 탐색기 구역은 루트마다 `<section aria-labelledby="explorer-<루트>">` + `SectionHead`(지금 `posts` 머리와 같은 모양)다. 두 번째 루트부터는 개요 구역처럼 위 테두리(`border-t`)로 나눈다.
- Storybook: `Shell` 스토리 `TwoRootFolders`(AI 글을 연 상태로 두 구역).
- `pnpm verify` 통과. `pnpm qa`는 돌리지 않았다. QA 페이지·시나리오 추가는 티켓 05다.
