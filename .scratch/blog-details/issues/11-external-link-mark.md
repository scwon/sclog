# 11: 외부 링크 표시

**What to build:** 글 본문에서 다른 도메인으로 가는 링크 뒤에 ↗가 붙고 스크린 리더는 링크를 "(외부 링크)"와 함께 읽는다. 표시는 빌드 때 HTML에 들어가므로 JS가 꺼져 있어도 보인다. 링크는 지금처럼 같은 탭에서 열린다.

**Blocked by:** None (can start immediately)

**Status:** done

참고: 스펙 [블로그 디테일 1차](../spec.md) "외부 링크", 결정 [1차 묶음 고르기](06-first-bundle.md).

- [x] 외부 링크 판정이 순수 함수로 있다. `http(s)`이면서 호스트가 사이트 호스트와 다를 때만 참이다(`www.` 유무는 같은 호스트로 본다). 상대 주소·해시·`mailto:`는 거짓이다. 단위 테스트가 이 다섯 경우를 덮는다
- [x] 빌드의 MDX 처리에 rehype 단계가 더해져, 외부 링크 글자 뒤에 창 틀 GitHub 링크와 같은 ↗ SVG(`aria-hidden`)와 숨은 글자 "(외부 링크)"를 넣는다
- [x] 마지막 낱말과 ↗ 사이에서 줄이 바뀌지 않는다
- [x] `target="_blank"`를 넣지 않고 링크에 이미 있던 속성은 그대로 둔다
- [x] 창 틀 안 링크(프로필 연락처 등)는 대상이 아니다
- [x] 빌드 결과물 테스트: 본문의 외부 링크에는 아이콘과 숨은 글자가 있고 `target="_blank"`가 없다. 같은 사이트 링크에는 표시가 없다
- [x] `pnpm verify` 통과

## Comments

### 2026-10-27 구현 (브랜치 `blog-details/11-external-link-mark`)

**결정**

- Astro 7은 MDX를 Sätteri로 그리고, `mdx({ rehypePlugins })`는 경고만 내고 무시한다. 그래서 rehype 대신 같은 자리의 Sätteri hast 플러그인(`hastExternalLinks`, `src/utils/external-link.ts`)으로 만들었다. 설정은 `mdx({ processor: satteri({ hastPlugins: [...] }) })`라서 MDX에만 걸린다. unified로 돌아가려면 `@astrojs/markdown-remark`를 새로 들여야 해서 고르지 않았다.
- 이미 설치돼 있던 `@astrojs/markdown-satteri`(0.4.5, astro 의존성)와 `satteri`(0.10.5, @astrojs/mdx 의존성)를 직접 의존성으로 올렸다. 잠금 파일에 새 패키지는 없다.
- 줄바꿈 없는 묶음에는 마지막 낱말 전체 대신 마지막 글자(자소 묶음) 하나와 ↗만 넣는다. 본문이 `word-break: keep-all`이라 낱말 안에서는 원래 줄이 바뀌지 않으니 보이는 결과는 같다. 낱말 전체를 묶으면 긴 URL이 `overflow-wrap: break-word`로 끊기지 못하고 넘친다. 링크가 인라인 코드 같은 요소로 끝나면 그 요소를 ↗와 묶는다.
- 마크업은 `…저장<span class="whitespace-nowrap">소<svg aria-hidden="true" class="ml-px inline size-[0.95em]">…</svg></span><span class="sr-only"> (외부 링크)</span>`이다. 크기·간격은 제목 표시줄 GitHub 링크와 같다. SVG 경로는 `ExternalIcon`의 사본이고, 같은 모양인지는 단위 테스트가 React로 그린 아이콘과 맞대어 본다.
- 판정은 `new URL(href, site)`로 푼다. 그래서 `//host` 같은 프로토콜 상대 주소도 외부 링크가 되고, 깨진 주소는 거짓이 된다. MDX에 JSX로 쓴 `<a href="…">`도 글자 그대로인 `href`면 표시한다.
- 지금 발행된 글에는 본문 링크가 없다. 그래서 빌드 결과물 테스트의 외부/같은 사이트 검사는 링크가 생겨야 실제로 걸린다. 표시 규칙은 단위 테스트가 시험용 글 조각을 빌드와 같은 Sätteri로 그려 확인한다. 빌드 결과물 테스트에서 지금 바로 걸리는 검사는 본문 밖(창 틀)에 숨은 글자가 없다는 것이다. 글에 링크를 잠깐 넣고 빌드해 보니 검사가 통과했고, 플러그인을 빼면 실패했다. 그 글은 원래대로 되돌렸다.
- 용어집에 "외부 링크 표시"를 더했다.

**측정값**

- 1200px 화면에서 ↗ 상자는 17.6px(본문 글자 크기 × 0.95)이고 링크 글자 줄 안에 들어간다. 숨은 글자는 1×1px이다. `target`은 비어 있다(ego-browser, `astro preview` 4311).

### 2026-10-27 satteri 유지 결정

- 이 티켓이 더한 직접 의존성 `satteri`·`@astrojs/markdown-satteri`는 그대로 둔다(사용자 결정). CLAUDE.md Tech Stack에 "MDX 처리" 줄로 적었다. 사용자 hast 단계는 `satteri({ hastPlugins })`에 두고, rehype 플러그인은 무시된다.
