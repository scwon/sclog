# Astro를 유지하고 IDE 창 틀은 화면 이동 때 유지한다

전체 화면 IDE 디자인(DESIGN.md "사이트 방향")은 모든 주소를 완성된 HTML로 제공하면서, 화면을 이동할 때 창 틀(제목 표시줄·탐색기·탭·상태줄)은 두고 내용만 바꾸는 것을 요구한다. Astro의 정적 렌더링과 `<ClientRouter />` + `transition:persist`가 이를 그대로 지원하고, 글 본문은 JS 없이 정적 HTML로 남기 때문에 Astro를 유지한다. 창 틀은 고정한 React 아일랜드 하나로 묶어, 열린 탭 같은 상태가 이동해도 유지되게 한다. 동작은 `specs/010-blog-renewal/prototype/blog-opus/`(SSR 페이지 + 영역 교체 라우터)로 검증했다.

## Considered Options

- **Next.js App Router**: 공용 레이아웃이 기본으로 유지되고 React 상태도 이동 사이에 남지만, 모든 페이지에 React 런타임이 실리고 글 처리 파이프라인을 다시 짜야 한다. 명령 팔레트, 창 분할, 전역 단축키처럼 한 페이지 안에서 상태를 강하게 공유하는 IDE 기능이 늘어 아일랜드가 페이지 전체를 덮게 되면 다시 검토한다.
- **직접 만든 빌더와 라우터**: 시안이 이 방식이지만 RSS·사이트맵·이미지 최적화·개발 서버를 계속 직접 유지해야 해서, 글 중심 블로그에는 비용이 크다.

## Consequences

- 창 틀 아일랜드(`Shell`)는 제목 표시줄·활동 막대·탐색기·탭·상태줄을 모두 `position: fixed`로 그리고, 에디터 내용(흐름 로그·글 본문·경로 표시줄)은 아일랜드 밖의 정적 HTML로 둬서 `<ClientRouter />`가 바꾼다. 에디터 영역은 창 치수 토큰만큼 여백을 둔다.
- 열린 탭은 nanostores `map`(키 = 글 URL)에 두고 `sessionStorage`에 거울처럼 저장한다. 페이지가 바뀔 때(`astro:page-load`) 창 틀이 에디터 HTML의 `data-file` 속성을 읽어 탭을 추가·활성화한다. 테마는 `html[data-theme]`에만 있어 이동과 무관하게 유지된다.
