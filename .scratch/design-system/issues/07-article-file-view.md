# 07: 글 파일 화면과 읽기 진행

**What to build:** 글이 시안 `article.html`처럼 "연 파일"로 보인다. frontmatter(title·pubDate·tags·heroImage)가 코드 색으로 먼저 나오고, 제목과 세리프 본문의 모든 블록에 줄 번호가 있으며, 읽는 위치의 줄 번호는 코랄이다. 탐색기 개요의 세로선이 읽은 만큼 채워지고, 경로 표시줄 끝과 상태줄에 `04 개발자란? › 3~4년차` 같은 현재 장·절, 상태줄에 `Ln N`과 읽은 비율이 따라온다. 파일을 열면 첫 1.4화면의 줄이 위에서부터 펼쳐진다.

**Blocked by:** 05 (창 틀과 레이아웃 교체)

**Status:** ready-for-agent

참고: DESIGN.md "전체 화면 IDE" 글 파일·탐색기·경로·펼침 항목, 시안 `article.html`, `ide.css` "article"·"opening a file" 절, `styles.css` prose 타이포, `app.js` 읽기 상태·펼침. 미니맵과 출력 패널은 범위 밖.

- [ ] 글 페이지 에디터가 frontmatter 블록(키는 보조색, 문자열은 `code-string` 토큰), 제목, 본문 순이며 모든 블록(문단·제목·이미지·코드·인용)에 줄 번호가 붙는다. 인용 따옴표는 본문 칸 안에 둔다. MDX 원본과 글 URL은 바뀌지 않는다
- [ ] 본문은 `font-serif` 18.5px/행간 1.92(모바일 17px/1.9), 폭 680px, `keep-all`. 본문 이미지는 매트 없이 얇은 테두리, 대표 이미지는 코랄 매트
- [ ] `reading` 스토어(nanostores)가 현재 줄 번호·현재 장·절·읽은 비율을 갖고, 에디터 쪽 스크립트가 `IntersectionObserver`로 갱신한다. 비율 계산은 순수 함수로 분리되고 Vitest 테스트가 있다(맨 위 0%, 맨 아래 100%, 중간값)
- [ ] `Shell`이 `reading`을 구독해 탐색기 개요의 현재 항목과 세로선 채움, 상태줄 `Ln N`·비율, 경로 표시줄 끝의 현재 장·절을 바꾼다. 개요 항목은 해당 제목으로 가는 링크다
- [ ] 1180px 미만에서는 개요가 경로 표시줄의 `개요` 버튼으로 펼쳐지는 고정 막대(현재 장 + 진행선)로 보인다
- [ ] 펼침: 에디터 루트의 `data-unfold`로 첫 1.4화면 안 줄·블록이 34ms 간격, 420ms(위→아래 잘라내기 + 6px 이동)로 나타난다. `prefers-reduced-motion`에서는 즉시 표시. 모든 시간은 모션 토큰
- [ ] 댓글 등 기존 글 페이지 기능이 본문 아래 에디터 안에 그대로 있고 줄 번호 열과 정렬된다
- [ ] 글 열림 상태의 `Shell` 스토리가 개요·상태줄 값을 보여 주며 두 테마에서 a11y 위반이 없다
- [ ] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과
