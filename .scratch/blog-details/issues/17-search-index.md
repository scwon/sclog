# 17: 검색 색인 빌드

**What to build:** 빌드가 발행된 글 전체의 본문 색인 `/search-index.json`을 만든다. 블록마다 글 화면의 줄 번호와 같은 줄 번호, 속한 장·절이 붙는다. 색인이 gzip 100KB를 넘으면 빌드 검사가 실패해 Pagefind를 다시 볼 때라고 알린다. 이 티켓만으로 화면에 보이는 것은 없고 빌드 결과물로 확인한다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "검색 색인(빌드)", 결정 [검색 방법](01-search-options.md). 측정과 근거는 브랜치 `research/blog-search`의 `docs/research/blog-search.md`.

- [x] 블로그 쪽 엔드포인트가 아래 모양의 JSON을 만든다(스펙의 type shape). 초안·예약 글은 넣지 않는다

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

- [x] 블록 나누기와 줄 번호 규칙은 글 화면의 줄 번호 카운터와 같다. frontmatter 줄(태그·대표 이미지 유무에 따라 달라짐), 제목, 작성 정보, 본문 블록 순서로 세고 대표 이미지는 세지 않는다
- [x] 장·절 배정은 탐색기 개요와 같은 id·번호·제목을 쓴다. 본문 글자는 MDX 문법과 HTML을 걷어 낸 순수 텍스트이고 코드 블록 글자도 넣는다
- [x] 단위 테스트: frontmatter 줄 수 경우별 줄 번호, 블록별 장·절 배정, MDX 벗기기
- [x] 빌드 결과물 테스트: 색인이 있고 `v: 1`이며 발행된 글이 모두 있다. 글마다 마지막 블록의 줄 번호가 그 글 HTML의 줄 번호 블록 수와 같다
- [x] 빌드 결과물 테스트: gzip 크기가 100KB 미만이다. 실패 메시지가 티켓 01의 재검토 조건을 가리킨다
- [x] 연구 문서 `docs/research/blog-search.md`를 main으로 가져온다
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/17-search-index`)

**결정**

- 색인 모양(`SearchIndex`·`SearchPost`·`SearchBlock`)은 소비자인 검색 화면 쪽, 곧 디자인 시스템의 `stores/search-index.ts`에 두고 `@/design-system`으로 내보낸다. 블로그 쪽 엔드포인트 `src/pages/search-index.json.ts`가 이 타입으로 `/search-index.json`을 만든다. `posts`는 `getPublishedPosts()` 순서라 최신 글이 먼저다. 검색 화면의 "최신 글 순" 순위는 이 순서를 쓰면 된다.
- 블록 나누기는 MDX 원문을 줄 단위로 읽는 순수 함수 `searchPost`(`src/utils/search-index.ts`)가 맡는다. Astro 7의 MDX 파서(satteri)는 직접 의존성이 아니어서 들이지 않았고, 렌더된 HTML을 쓰는 Container API는 실험 단계라 피했다(연구 문서와 같은 판단). 문단·ATX/setext 제목·코드 울타리·인용·목록(빈 줄을 낀 느슨한 목록 포함)·표·가로줄·여러 줄 JSX 요소를 하나씩 세고, import·export와 줄 전체가 표현식(`{/* */}`)인 것은 그려지지 않으므로 뺀다.
- 글자가 없는 블록(가로줄, 그림만 있는 문단)도 빈 `text`로 넣어 줄 번호가 끊기지 않게 했다. `line`은 1부터 빈틈없이 이어지고, frontmatter 줄과 제목·작성 정보 줄도 화면에 보이는 글자 그대로 들어간다. 작성 정보는 `원성철 · 2023.04.30 · 읽는 시간 7분` 모양이다.
- 장·절은 Astro가 준 `headings`를 제목 블록과 문서 순서대로 짝지은 뒤 `buildOutline`과 `locateInOutline`으로 정한다. 글 화면의 읽기 위치가 쓰는 함수와 같아서 id·번호·제목이 개요와 어긋나지 않는다. 장 머리 블록은 그 장에 속하고, 절보다 깊은 제목은 위 절에 남는다.
- 순수 텍스트에서는 강조·링크(글자만 남김)·그림(지움)·인라인 코드(글자 남김)·JSX/HTML 태그·표현식·이스케이프·엔티티를 걷어 내고 공백을 하나로 줄인다. 코드 블록은 안의 글자를 그대로 두고 공백만 줄인다. `snake_case` 안의 `_`는 강조로 보지 않는다.
- 빌드 결과물 테스트는 글 HTML에서 줄 번호가 붙는 블록(`.doc-fm-line`·`.doc-title`·`.doc-byline`·`.doc-prose`의 직계 자식)을 태그 깊이로 센다. 색인의 줄 번호가 1부터 그 수까지 이어지는지, 장·절 제목 블록이 HTML에서 같은 id를 가진 블록과 같은 줄에 있는지를 본다. 발행된 글 목록은 원본 MDX의 frontmatter(`draft`, `pubDate`)에서 따로 구한다.
- 크기는 연구 문서와 같은 gzip -9로 잰다. 100KB를 넘으면 실패 내용에 티켓 01의 "다시 볼 때"와 연구 문서의 "다시 검토할 조건"이 나온다.
- 연구 문서 `docs/research/blog-search.md`는 `research/blog-search`의 마지막 판(`18748d8`)을 그대로 가져왔다.

**측정값**

- `/search-index.json`(글 1편, 55줄): 18,189B, gzip -9 5,480B. 연구 문서의 5.0KB보다 조금 큰 까닭은 블록마다 붙는 장·절 객체와 frontmatter·작성 정보 줄이다.

### 2026-10-27 리뷰 수정 (브랜치 `blog-details/review-fixes`)

- 판 번호 `v: 1`은 `SEARCH_INDEX_VERSION` 상수로 쓴다. 색인 페이지가 쓰고 검색 화면이 검사한다. 타입만 있던 `stores/search-index.ts`는 스토어가 아니어서 `components/Shell/search-index.ts`로 옮겼다. 장 타입은 이어 읽기와 같은 `NumberedChapter`이고, GLOSSARY에 **검색 색인**을 더했다.

### 2026-10-27 satteri 유지 결정 (브랜치 `blog-details/satteri-search-index`)

- satteri가 직접 의존성으로 남게 되어 위 "직접 의존성이 아니어서 들이지 않았다"는 이유가 사라졌다. 본문 블록 나누기와 순수 텍스트를 `satteri`의 `mdxToHast`로 바꿨다. hast 루트의 자식 중 요소와 JSX 흐름 요소가 블록이고, 글자는 text 노드만 모은다(엔티티·이스케이프는 파서가 푼다). 정규식 블록 나누기와 엔티티 표가 빠져 `search-index.ts`는 365줄에서 126줄이 됐다. frontmatter·제목·작성 정보 줄은 그대로다.
- 파서 기능은 GFM만 켜고 둥근 따옴표(smart punctuation)는 끈다. 글 화면은 `’`·`…`로 그리지만 자판으로 친 검색어(`'`·`...`)와 맞추려고 원문 글자를 둔다. 본문에는 frontmatter가 없으므로 frontmatter 인식도 끈다.
- 제목은 블록 안에 있는 Markdown 제목까지 문서 순서로 세어 `headings`와 짝짓는다. Astro가 JSX 요소 안의 Markdown 제목도 `headings`에 넣기 때문에, 전에는 그런 제목 뒤의 장·절이 한 칸씩 밀렸다.
- 단위 테스트 입력 두 개를 MDX로 실제 그려지는 것으로 고쳤다. `<https://…>`는 MDX에서 문법 오류라(빌드도 실패) 맨 URL로 바꿨고, 정의 없는 `[참조][ref]`는 화면에 글자 그대로 보이므로 정의 줄을 더했다.
- 바꾸기 전후 `dist/search-index.json`이 바이트 단위로 같다.
