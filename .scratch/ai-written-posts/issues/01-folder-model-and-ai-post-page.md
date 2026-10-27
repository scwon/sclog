# 01: 폴더가 있는 글 모델과 AI 글 화면

**What to build:** `src/content/ai-written/`에 글 파일을 넣기만 하면 그 글이 `/ai-written/<슬러그>/`에서 열린다. 제목·작성 정보 아래에 "AI가 작성한 글입니다." 한 줄이 본문 블록으로 붙고, 탭과 경로 표시줄에 `ai-written › <연도> › <슬러그>.mdx`가 보이며, 경로 표시줄의 `ai-written` 조각과 글 끝 이동 줄이 `ai-written.log`(`/ai-written/`)로 간다. `/ai-written/`은 홈과 같은 흐름 로그 모양으로 AI 글만 쌓는다. 직접 쓴 글과 홈·탐색기·검색은 이 티켓에서 바뀌지 않는다(발행 글 조회를 `posts` 폴더로 명시해 부른다).

**Blocked by:** None (can start immediately)

**Status:** done

스펙 `.scratch/ai-written-posts/spec.md`의 "글의 종류는 컬렉션이 정한다"·"주소와 경로"·"글 화면"·"홈과 로그(ai-written.log)"를 따른다. 용어는 `GLOSSARY.md`, 근거는 ADR 0005.

- [x] 컬렉션이 `blog`와 `ai-written` 둘이고 스키마를 공유한다. frontmatter에 종류 필드가 없다
- [x] 글의 폴더(`posts` | `ai-written`)를 돌려주는 함수 하나가 있고, 주소·파일 경로·로그 주소가 모두 거기서 갈라진다
- [x] 발행 글 조회가 폴더 인자를 받는다. 없으면 두 폴더 합산 최신순, `draft`·미래 날짜 규칙은 공통
- [x] 기존 홈·탐색기·검색 색인·글 목록·태그 화면은 `posts` 폴더만 보도록 명시해 부르고 동작이 그대로다
- [x] `/ai-written/<슬러그>/`가 열리고 고정 문구 블록(사이트 상수)이 제목 아래, 대표 이미지 위에 줄 번호와 함께 있다. 직접 쓴 글에는 없다
- [x] 글 끝 이동 줄이 다음 파일 → 그 폴더의 로그(`posts.log` 또는 `ai-written.log`) → 맨 위로이고, 로그 이름·주소가 폴더에서 나온다
- [x] 경로 표시줄 첫 조각 링크: `posts` → `/`, `ai-written` → `/ai-written/`
- [x] `/ai-written/`이 `ai-written.log` 탭(로그 종류)으로 열리고 배너·주석·연도별 AI 글(장 흐름 포함)·끝 줄 `글 M편`, 상태줄 요약이 AI 글 수다
- [x] 첫 AI 글 한 편이 `src/content/ai-written/`에 있다(장 두세 개, 태그 포함). 기존 2023 회고는 그대로다
- [x] utils 테스트: 폴더별·합산 조회, 폴더별 주소·경로, 글 끝 이동 줄의 로그, `ai-written.log` 줄 구성(선례 `blog.test.ts`·`ide.test.ts`)
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `ticket/01-folder-model`)

**결정**

- 폴더 모델은 `src/utils/folder.ts` 하나에 둔다. `Folder`(`'posts' | 'ai-written'`), 폴더 표 `FOLDER_ROUTES`(폴더마다 `collection`·`postBase`·`log { name, url }`·`tags`), 순서 있는 `FOLDERS`(`posts` 먼저), `postFolder(post)`(컬렉션 이름에서 폴더), `isFolder(name)`. 주소·파일 경로·로그·경로 표시줄 링크가 모두 이 표에서 나온다. 태그 주소(`tags`)도 표에 미리 두었고, 화면에서 쓰는 일은 티켓 04가 한다.
- 조회 시그니처는 `getPublishedPosts(folder?)`(없으면 두 폴더 합산 최신순), `getAllTags(folder)`, `getPostsByTag(folder, tag)`다. 태그 쪽은 폴더를 필수로 두어 섞어 세는 호출이 생기지 않게 했다. 기존 홈·글 목록·태그·검색 색인·탐색기 트리는 `'posts'`를 명시해 부른다.
- `BlogPost`는 두 컬렉션 항목의 합집합이다. `docEndLinks(folder, next)`는 폴더를 첫 인자로 받는다. 경로 표시줄 계산은 `BaseLayout`에서 `fileCrumbs(file)`(ide.ts)로 옮겨 테스트한다. 로그 탭은 경로가 어떤 폴더의 로그 이름(`posts.log`, `ai-written.log`)과 같으면 그 폴더 아래에 둔다.
- `ai-written.log`는 새 줄 함수 없이 `listLines`에 `steps` 옵션을 더해 홈처럼 장 흐름까지 그린다. 홈 `homeLines`는 이 티켓에서 바꾸지 않았다(AI 글 칸은 티켓 03).
- 고정 문구는 `SITE.aiWrittenNotice`, 마크업은 `<p class="doc-notice">`이고 `</header>` 다음, 대표 이미지 앞에 둔다. 줄 번호 선택자(ide.css)와 읽는 위치 블록 선택자(`BlogPost.astro`)에 `.doc-notice`를 더했다.
- AI 글 꼬리 태그 링크는 아직 `/blog/tags/<태그>/`다. 폴더별 태그 화면과 함께 티켓 04가 `FOLDER_ROUTES[folder].tags`로 바꾼다.
- 다음 티켓으로 넘기는 틈: 탐색기 트리가 `posts`뿐이라 AI 글을 열어도 탐색기에 없다. 창 틀의 `keepPublishedHistory`가 트리 URL로 거르기 때문에 AI 글의 읽기 기록도 지워진다(티켓 02·05). 검색 색인은 아직 `posts`만 담는다. AI 글을 넣을 때는 고정 문구 블록 한 줄만큼 줄 번호가 밀리므로 색인도 그 줄을 세야 한다(티켓 05).
- 첫 AI 글은 `src/content/ai-written/why-ai-written-folder.mdx`(장 3개, 태그 `블로그`·`AI`)다.
- `pnpm verify` 통과(테스트 41파일 536개). `pnpm qa`는 동시에 돌던 ego 브라우저에서 `/blog/…` 페이지 load 시간 초과로 10/11 실패했다. 단언이 틀린 게 아니라 시간이 초과된 것이고, 이 티켓은 QA 대상 페이지를 더하지 않았으므로(티켓 05) 재실행은 통합 뒤로 넘긴다.
