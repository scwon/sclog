# 08: 네 화면을 두 테마로 확인하고 main에 합친다

**What to build:** scwon.me가 시안 그대로의 전체 화면 IDE로 바뀐다. 통합 브랜치 `design-system`의 홈·글·태그·404를 두 테마에서 ego-browser로 확인해 Orca 탭으로 보여 주고, 문서(DESIGN.md·CLAUDE.md)를 현재 상태에 맞춘 뒤 main에 합쳐 배포한다.

**Blocked by:** 06 (홈 흐름 로그), 07 (글 파일 화면)

**Status:** done

참고: 스펙 "진행 방식"·"문서 갱신", 사용자 완료 기준(글 URL·원본 보존, ego-browser 확인, Orca 탭).

- [x] `pnpm build` 결과를 `astro preview`로 띄워 ego-browser로 홈·글(`/blog/pro-developer-2023-days/`)·태그·404를 어두운/밝은 테마, 1440·1024·390px 폭에서 스크린샷으로 남기고 Orca 탭(`orca tab create --url file://…`)으로 연다. 발견한 차이는 이 티켓의 Comments에 적고 고친다
- [x] 홈 → 글 → 다른 장 → 뒤로가기 → 탭 닫기 → 테마 전환 흐름에서 창 틀이 유지되고, 콘솔 오류가 없으며, JS를 끈 상태에서도 글이 읽힌다
- [x] 기존 글 URL·태그 URL·RSS·사이트맵 경로가 배포 전과 같다(빌드 결과물 테스트 + 수동 확인)
- [x] DESIGN.md "미정 항목" 중 다크 팔레트·글꼴·반경·모션을 확정 절로 옮기고, 토큰 파일을 출처로 가리킨다. 시안 수치 표는 고치지 않는다
- [x] CLAUDE.md Tech Stack에 nanostores와 디자인 시스템 폴더 포인터를 추가한다. 토큰 값은 적지 않는다
- [x] `design-system` 브랜치에서 `/code-review`를 돌리고 지적을 반영한 뒤, Conventional Commits로 정리해 main에 합친다. Vercel 배포 뒤 scwon.me를 ego-browser로 한 번 더 연다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 통합 확인 (브랜치 `design-system`, 병합 전)

**발견한 차이와 고친 것**

- 태그·글 목록·태그 목록·404는 아직 옛 마크업이었다. 티켓 05가 "06·07이 바꾼다"고 적었지만 06·07은 홈과 글만 맡았다. 이 네 화면을 흐름 로그와 같은 줄 구조로 옮겼다.
  - `src/utils/flow.ts`에 `homeLines`·`listLines`·`linkLines`와 `loadFlows`를 두었다.
  - 1번 줄 큰 이름(`posts/`, `tags/`, `#태그`, `404`), 주석 줄, 글 카드 또는 링크 줄(`#태그 ---- 글 N편`), 끝 줄 순서다.
  - 옛 `BlogCard`·`TagList`는 지웠다. 용어집의 "흐름 로그" 정의를 넓히고 "링크 줄"을 더했다.
- 목록 화면에서 장 줄 없이 접기 버튼이 나와, `aria-controls`가 없는 요소를 가리켰다(axe `aria-valid-attr-value`). 장 흐름을 그릴 때만 버튼을 둔다(`foldable`).
- 서버 HTML의 탭 표시줄에 `posts.log`만 있어, JS가 없거나 하이드레이션 전에는 지금 글의 탭·창 제목·탐색기 강조가 비었다. 레이아웃이 현재 파일(제목·경로·URL)을 `Shell`·`Tabs`에 넘겨 서버 스냅샷에 넣는다. 계약의 원본은 여전히 에디터 루트 `data-file-*`이고, 이 값은 서버 HTML을 위한 사본이다.
- 개요에서 `05 마치며`로 앵커 이동하면 상태줄이 `04 › 5~6년차`를 가리켰다. 앵커 이동은 제목을 읽는 선에 정확히 맞추는데, 소수점 픽셀 차이로 아직 안 지난 것으로 판정됐다. 읽는 선에 8px 여유를 두었다.
- Giscus가 iframe을 불러오기 전에 테마 메시지를 보내 콘솔 경고가 났고, 첫 순간 밝은 테마로 보였다. 이제 giscus의 준비 메시지를 받은 뒤 iframe마다 한 번 맞추고, 정적 초기값은 사이트 기본인 `dark`다.

**확인**

- 화면: `astro build` 결과(`astro preview`)를 ego-browser로 찍었다. 홈·글(`/blog/pro-developer-2023-days/`)·태그(`/blog/tags/회고/`)·404를 어두운/밝은 테마 × 1440·1024·390px로 24장, 글 목록·태그 목록 1440px 두 테마로 4장이다. Orca 탭으로 열었다.
- 접근성: axe-core 4.14.0, 모든 규칙으로 위 24개 조합과 글 목록·태그 목록 두 테마를 검사했고 위반 0건이다.
- 이동 시나리오(1440px)
  - 홈 → 글(카드) → 개요의 `05 마치며` → 뒤로 → 뒤로(홈) → 글 탭 닫기 → 테마 전환 → 다시 글.
  - 매 단계 창 틀 아일랜드가 같은 요소로 남았다(표시해 둔 속성이 유지됨). 탭·테마·상태줄이 맞게 바뀌었고, 콘솔 오류·경고는 0건이다(댓글이 뜬 뒤 포함).
- JS를 끈 상태: 글 본문·frontmatter·줄 번호가 모두 보인다. 서버 HTML에 그 글의 탭이 활성으로 있고, 접기는 펼친 채다.
- 경로: 빌드된 페이지는 `/`, `/404`, `/blog/`, `/blog/pro-developer-2023-days/`, `/blog/tags/`, `/blog/tags/{회고,개발자,프론트엔드,커리어}/`다. 티켓 01 첫 빌드의 목록과 같다.
  - 빌드 결과물 테스트에 "404를 뺀 모든 페이지가 사이트맵에 같은 URL로 실림"을 더했다. 앞서 넣은 "글 원본마다 `/blog/<slug>/`"와 함께 경로 변화를 지킨다.
  - RSS는 main에도 없다(`rss.xml` 경로 없음). 이번에 바뀐 것은 없다.
- 긴 태그 이름: 가장 긴 `#프론트엔드` 배너가 390px와 320px에서 칸을 넘치지 않는다(글자 폭 = 칸 폭).
- 문서
  - DESIGN.md: "미정 항목"의 다크 팔레트·글꼴·반경·모션을 "디자인 시스템 토큰 — 2026-10-26 확정" 절로 옮기고 토큰 파일을 가리켰다. 시안 수치 표는 그대로다.
  - CLAUDE.md Tech Stack에 디자인 시스템 폴더와 nanostores를 더했다(토큰 값은 적지 않음).
  - 스펙의 타이포 스케일 "제목 68/38"은 구현값 54/34로 고치고 이유(티켓 07)를 적었다.
- 코드 리뷰: 05~07 변경분 리뷰는 `8f5f257`에서 반영했다. 이 티켓 변경분(`8f5f257` 이후)에 Standards·Spec 리뷰를 다시 돌려 반영했다.
  - 반영: 용어집, `Tabs` 주석, 글 로딩 중복 → `loadFlows`, 창 틀 `current` 타입 → `CurrentFile`, 404 끝 줄을 링크 수에서 계산, Giscus 메시지는 iframe마다 한 번.
  - 남긴 것: 탭이 많을 때 하이드레이션 뒤 세션 순서로 바뀌며 활성 탭 위치가 한 번 움직이는 점은 판단 사항으로 남겼다. 하이드레이션 불일치는 없다.
- 테스트 113개 통과. `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.

**남은 것**

- main 병합, push(Vercel 배포), 배포된 사이트 확인은 되돌리기 어려운 외부 작업이라 사용자 확인 뒤에 한다.
- `astro.config.mjs`의 `site`가 `https://sclog.dev`여서 사이트맵·canonical URL이 그 주소로 나갔다. 사용자 결정에 따라 배포 주소인 `https://scwon.me`로 바꿨다. 글·태그 경로는 그대로다.

### 2026-10-26 병합·배포

- 사용자 결정: `--no-ff`로 main에 병합하고 push한다. 사이트 주소는 scwon.me로 바꾼다(`12b86b2`).
- main 병합 커밋 `2b712d4`를 push했다. 함께 올라간 것은 그전까지 push하지 않았던 main 커밋 2개(스펙·티켓 문서 `a0d3f6d`, MCP 설정 `5340b0a`)다.
- GitHub CI(run 40269932088): lint·format:check·build·test·build-storybook 모두 성공. Vercel Production 배포 성공(`2b712d4`).
- 배포 확인(ego-browser, 1440px): `https://scwon.me/`, 글, `/blog/tags/회고/`, 없는 주소(404)를 열었다.
  - 모두 IDE 창 안에 열리고, 화면을 옮기면 탭이 쌓인다.
  - 에디터 루트 `data-file-url`이 맞고, 글꼴 요청은 모두 같은 사이트(`www.scwon.me`)로 간다.
  - 콘솔에는 404 페이지 응답 한 건만 있다(의도한 요청).
- `scwon.me`가 `www.scwon.me`로 넘어가는데 canonical·사이트맵은 `https://scwon.me/…`를 썼다. 사용자 결정에 따라 `site`를 실제로 도착하는 주소인 `https://www.scwon.me`로 바꿨다.
