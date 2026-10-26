# 17: 검색 색인 빌드

**What to build:** 빌드가 발행된 글 전체의 본문 색인 `/search-index.json`을 만든다. 블록마다 글 화면의 줄 번호와 같은 줄 번호, 속한 장·절이 붙는다. 색인이 gzip 100KB를 넘으면 빌드 검사가 실패해 Pagefind를 다시 볼 때라고 알린다. 이 티켓만으로 화면에 보이는 것은 없고 빌드 결과물로 확인한다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

참고: 스펙 [블로그 디테일 1차](../spec.md) "검색 색인(빌드)", 결정 [검색 방법](01-search-options.md). 측정과 근거는 브랜치 `research/blog-search`의 `docs/research/blog-search.md`.

- [ ] 블로그 쪽 엔드포인트가 아래 모양의 JSON을 만든다(스펙의 type shape). 초안·예약 글은 넣지 않는다

```ts
interface SearchIndex {
  v: 1;
  posts: {
    url: string;
    title: string;
    path: string;
    blocks: {
      line: number;
      chapter: { id: string; no: string; text: string } | null;
      section: { id: string; text: string } | null;
      text: string;
    }[];
  }[];
}
```

- [ ] 블록 나누기와 줄 번호 규칙은 글 화면의 줄 번호 카운터와 같다. frontmatter 줄(태그·대표 이미지 유무에 따라 달라짐), 제목, 작성 정보, 본문 블록 순서로 세고 대표 이미지는 세지 않는다
- [ ] 장·절 배정은 탐색기 개요와 같은 id·번호·제목을 쓴다. 본문 글자는 MDX 문법과 HTML을 걷어 낸 순수 텍스트이고 코드 블록 글자도 넣는다
- [ ] 단위 테스트: frontmatter 줄 수 경우별 줄 번호, 블록별 장·절 배정, MDX 벗기기
- [ ] 빌드 결과물 테스트: 색인이 있고 `v: 1`이며 발행된 글이 모두 있다. 글마다 마지막 블록의 줄 번호가 그 글 HTML의 줄 번호 블록 수와 같다
- [ ] 빌드 결과물 테스트: gzip 크기가 100KB 미만이다. 실패 메시지가 티켓 01의 재검토 조건을 가리킨다
- [ ] 연구 문서 `docs/research/blog-search.md`를 main으로 가져온다
- [ ] `pnpm verify` 통과
