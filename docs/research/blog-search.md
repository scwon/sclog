# 정적 Astro 사이트의 글 검색 방법 조사

- 작성일: 2026-10-26
- 질문: 서버 없이 정적으로 빌드하는 Astro 7 사이트(MDX 글, React 아일랜드, `<ClientRouter />` 화면 이동, Vercel 배포)에서 글 검색을 어떻게 만들 것인가. 검색 결과는 (1) 사이드 패널의 검색 보기(본문 검색)와 (2) ⌘P 명령 팔레트(파일 이름·제목으로 글 찾기)가 함께 쓴다.
- 판단 기준: 한국어 검색 품질(부분 일치, 형태소 분석기 없이), 첫 사용 때 받는 용량, 첫 화면 JS에 넣지 않고 처음 열 때 불러올 수 있는지, `<ClientRouter />` 화면 교체와의 호환, 최근 3개월(2026-07-26 이후) 안의 유지보수 여부.
- 조사 범위: Pagefind 공식 문서와 `Pagefind/pagefind` 소스(Rust 색인기·브라우저 JS), `withastro/starlight`·`shishkin/astro-pagefind` 소스, Astro 공식 문서(v7), npm 레지스트리 메타데이터, GitHub API(마지막 커밋). 용량과 한국어 동작은 아래 "측정 방법"대로 직접 재서 확인했다. 추측은 "미확인/불확실"에 분리했다.
- 조사 시점의 최신 버전(npm `latest`): pagefind 1.5.2, astro-pagefind 2.0.1, minisearch 7.2.0, flexsearch 0.8.212, fuse.js 7.5.0, @orama/orama 3.1.18, @leeoniya/ufuzzy 1.0.19, es-hangul 2.4.0.

## 결론 요약

1. **팔레트는 새 색인이 필요 없다.** 창 틀 아일랜드 `Shell`이 이미 모든 글의 `{ url, title, path }`를 `tree` props로 받아 첫 화면 HTML에 싣고 있다(`src/layouts/BaseLayout.astro`, `src/design-system/components/Shell/Shell.tsx`). 팔레트는 이 값을 그대로 동기 검색하면 된다. 추가 다운로드가 0바이트이고 글 93편 규모에서도 제목 목록은 gzip 2.2KB다.
2. **본문 검색은 빌드 때 만든 JSON 하나를 처음 열 때 받아서 직접 만든 부분 문자열 매칭으로 찾는 방식을 권한다.** 지금 글 1편 기준으로 첫 검색에 받는 양은 JSON 5.0KB(gzip)와 매칭 코드뿐이고 Pagefind는 같은 글에 약 111KB가 든다. 직접 만든 매칭은 NFD 정규화 후 `includes`만으로 띄어 쓰지 않은 복합어 중간(“발자” → “개발자”)과 입력 중인 음절(“개바” → “개발”)까지 찾는다. MiniSearch는 단어 앞부분 일치만 해서 복합어 중간을 놓친다. Pagefind는 놓치는 대신 검색어를 더 짧은 색인 단어로 바꿔 무관한 결과를 낸다(“발자” → “바”로 9건 오탐).
3. **Pagefind는 한국어에서 장점이 약하다.** 문서는 한국어를 분절(segmentation) 대상 언어로 적지만 1.5.2 소스는 `zh`·`ja`·`th`만 분절하고 한국어는 공백으로만 자른다. 단어는 NFD(자모 분해)로 저장돼 한글 단어가 커지고 측정한 93편 말뭉치에서는 한글 단어 전체가 226KB짜리 색인 조각 하나에 몰렸다. 이 때문에 한국어 첫 검색이 약 329KB로 JSON 전체(171KB)보다 컸다. 대신 BM25 순위, 발췌·강조, 제목별 하위 결과, 필터를 공짜로 얻는다.
4. **두 검색이 쓰는 원본은 하나이고 전달 형태만 둘이다.** `getPublishedPosts()`가 원본이다. 팔레트는 이미 실린 `tree`를 쓰고 본문 검색은 `/search-index.json`을 지연 로드한다. JSON 하나로 둘 다 처리할 수는 있지만 그러면 팔레트를 열 때도 본문 전체를 받아야 한다. Pagefind로 팔레트까지 처리하는 방법은 비동기·단어 앞부분 일치·결과마다 조각 파일을 받아야 하는 구조라 맞지 않는다.
5. **유지보수 기준(2026-07-26 이후 배포)을 그대로 통과하는 후보는 fuse.js(7.6.0-beta.0, 2026-08-09) 하나뿐이다.** Pagefind는 마지막 배포가 2026-04-12지만 저장소 커밋이 2026-10-21까지 이어진다. MiniSearch(2025-09)·FlexSearch(2025-09 배포, 2026-05 커밋)·Orama(2025-12 배포)는 기준에 못 미친다. 권장안은 런타임 의존성이 없어 이 기준과 무관하다.

## 측정 방법

- 말뭉치 두 개를 만들었다. `site1`은 실제 글 `pro-developer-2023-days.mdx` 1편(본문 5,096자)이다. `site92`는 그 글과 저장소의 한국어 Markdown 92개(`docs/`·`specs/`·`.scratch/` 등)를 합친 93편(본문 342,839자)으로, 글이 늘었을 때를 가늠하려고 만들었다. 두 말뭉치 모두 `<html lang="ko">` HTML과 같은 내용의 JSON으로 썼다. HTML에는 실제 화면처럼 모든 글 링크가 든 탐색기 `<nav>`를 넣고 본문만 `data-pagefind-body`로 표시했다.
- Pagefind 1.5.2 CLI로 색인을 만들고 생성된 `pagefind.js`를 Node에서 불러 `fetch`를 가로채는 방식으로 검색어마다 받은 파일과 바이트를 기록했다. `pagefind.js`·`pagefind-worker.js`는 `import`로 불리므로 이 기록에 빠져 있어 gzip 크기를 따로 더했다.
- 라이브러리 크기는 esbuild로 번들·압축(minify)한 뒤 gzip -9로 쟀다. 한국어 동작은 같은 JSON으로 각 라이브러리 색인을 만들어 같은 검색어를 넣고 비교했다(Apple Silicon Mac, Node).
- `site92`의 내용은 블로그 글보다 기술 문서에 가까워 영어·코드 비율이 높다. 글이 늘었을 때의 경향만 보고 절대값은 실제 글이 쌓이면 다시 재야 한다.

## 후보 비교

### 한국어 검색 품질 (직접 측정)

검색어마다 찾은 문서 수다. 모두 `site92`(93편) 기준이다.

| 검색어 | 뜻 | 직접 구현(NFC `includes`) | MiniSearch `prefix` | FlexSearch `forward` | FlexSearch `full` | Fuse.js | Pagefind |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `개발` | 어절 앞부분 | 24 | 24 | 24 | 24 | 24 | 23 |
| `발자` | 어절 중간(복합어 안쪽) | 16 | 0 | 0 | 16 | 16 | 9 (모두 오탐, 아래 설명) |
| `개바` | 입력 중인 음절(“개발” 조합 중) | 0 (NFD로 바꾸면 찾음) | 0 | 24 | 24 | 0 | 23 |
| `프론트엔드 개발자` | 두 단어 AND | 7 | 7 | 7 | 7 | 4 | 7 |
| `엔드개발` | 본문에 없는 조합 | 0 | 0 | 0 | 0 | 4 (오탐) | 1 (오탐) |
| `ㄱㅂㅈ` | 초성 | 0 | 0 | 0 | 0 | 0 | 0 |

- 한국어는 조사가 어절 끝에 붙으므로(“개발자가”, “개발자를”) **앞부분 일치만으로 대부분의 검색이 된다.** 어느 후보도 형태소 분석기가 필요 없다.
- 차이는 **띄어 쓰지 않은 복합어**(“디자인시스템”에서 “시스템”, “프론트엔드”에서 “엔드”)에서 난다. 앞부분 일치만 하는 MiniSearch·FlexSearch `forward`는 이런 경우를 놓치고 Pagefind는 무관한 결과를 돌려준다. 부분 문자열 매칭(직접 구현, FlexSearch `full`)은 찾는다.
- **입력 중인 음절**: Pagefind는 단어를 NFD(자모 분해)로 저장하므로 “개바”가 “개발”의 앞부분으로 잡힌다. FlexSearch도 같은 결과를 냈지만 그 원인은 소스로 확인하지 않았다. 직접 구현도 `normalize('NFD')`로 바꾸면 같은 효과를 얻는다(`"개발자".normalize('NFD').includes("개바".normalize('NFD')) === true`로 확인). 첫소리 자모(U+1100대)와 끝소리 자모(U+11A8대)는 코드 포인트가 달라서 음절 경계를 넘는 엉뚱한 일치는 생기지 않는다(`"개발".includes("갭")`은 NFD에서도 `false`).
- 초성 검색(“ㄱㅂㅈ”)은 모든 후보가 기본으로 지원하지 않는다. 필요하면 `es-hangul`의 `getChoseong`(gzip 1.9KB)으로 제목에서만 따로 처리한다.
- Fuse.js는 문자 단위 퍼지(Bitap)라 없는 조합에도 4건을 돌려줬고 긴 본문에서는 검색 한 번에 10–28ms가 걸렸다(나머지는 0.0–2ms). 본문 검색보다 짧은 제목 검색에 맞는다.
- Pagefind는 검색어로 시작하는 단어가 하나도 없으면, 검색어의 앞부분과 같은 색인 단어 중 가장 긴 것을 대신 쓴다(`find_word_extensions`). 단어가 NFD로 저장되므로 이 대체는 자모 단위로 일어난다. 그래서 `발자`(발자)는 “진행률 바”의 `바`(바)로 바뀌어 “개발자”와 무관한 9건이 나왔고 `엔드개발`은 `엔드`로, `prodev`는 `pro`로 바뀌어 결과가 나왔다. 결과가 0건이 아니어도 실제로 일치한 것인지 알 수 없다는 점이 직접 구현과 다르다. `개발`이 23건으로 하나 적은 것은 앞부분 일치의 한계다. “개발”이 구두점에 붙어 어절 중간에만 나오는 글이 둘(`최적화·개발`, `{회고,개발자,…}`) 있고 그중 하나를 놓쳤다.

### 첫 사용 때 받는 용량 (직접 측정, gzip)

| 방식 | 고정 비용(코드) | 색인·결과 | 1편(`site1`) 합계 | 93편(`site92`) 합계 |
| --- | --- | --- | --- | --- |
| 직접 구현 + JSON | 자체 코드(측정 안 함, 수 KB 이하 예상) | JSON 5.0KB / 171KB(brotli 4.5KB / 132KB) | 약 5KB + 코드 | 약 171KB + 코드 |
| MiniSearch + JSON | 5.9KB | 위와 같음, 브라우저에서 색인 구축 106ms(93편) | 약 11KB | 약 177KB |
| FlexSearch + JSON | 17.3KB | 위와 같음, 색인 구축 99ms(`forward`)·287ms(`full`) | 약 22KB | 약 188KB |
| Fuse.js + JSON | 9.6KB(`fuse.js/basic` 8.0KB) | 위와 같음 | 약 15KB | 약 181KB |
| Orama | 21.8KB | 위와 같음 | 약 27KB | 약 193KB |
| Pagefind (JS API) | `pagefind.js` 12.8KB + worker 11.9KB + wasm 68.2KB | 색인 조각 13.2KB / 한국어 226KB, 결과 조각 1편당 약 1–5KB | 약 111KB | 한국어 검색어 약 329KB, 영어 검색어 약 155KB |
| Pagefind Component UI 추가 시 | +38.9KB(JS) +6.9KB(CSS) | — | 약 157KB | — |

- 지금 글 1편에서는 JSON 방식이 Pagefind의 약 1/20이다.
- Pagefind의 고정 비용 약 93KB 가운데 68KB가 wasm이다. 홈페이지는 “1만 쪽 사이트에서도 전체 300kB 미만, 대부분 100kB에 가깝다”고 설명한다([pagefind.app](https://pagefind.app/)). 1편 측정치 111KB는 그 설명과 맞는다.
- **93편에서 Pagefind 한국어 검색이 JSON 전체보다 컸던 이유**: 색인기는 단어를 정렬한 뒤 위치 수 20,000개마다 조각을 자른다(`chunk_index`, 기본값 `default_index_chunk_size() = 20000`). 단어는 NFD로 저장되고(조각 경계가 `ᄋ…`처럼 자모로 기록됨) 한글 음절 하나가 3바이트 자모 셋이 되므로 한글 단어가 커진다. 측정에서는 정렬 순서상 마지막인 한글 단어 전체가 226KB 조각 하나에 들어갔다. `컴포넌트`로 이 조각을 받은 뒤 `토큰`·`테마 전환`은 색인을 더 받지 않았다. 색인이 더 커지면 한글도 여러 조각으로 나뉠 것으로 보이지만 그 시점은 측정하지 않았다.
- Pagefind의 색인·조각·wasm 파일은 이미 gzip으로 압축된 채 배포되므로 Vercel의 brotli가 더 줄여 주지 못한다(문서: “Pagefind handles compression of the files in the bundle directly”, [Troubleshoot Hosting](https://pagefind.app/docs/hosting/)). JSON은 Vercel이 brotli로 보낼 수 있다.

### 지연 로드와 `<ClientRouter />` 호환

| 방식 | 첫 화면 JS에서 빼는 방법 | 화면 교체 때 | 개발 서버(`pnpm dev`) |
| --- | --- | --- | --- |
| 직접 구현 + JSON | 검색 보기를 처음 열 때 `fetch('/search-index.json')`. 매칭 코드도 `import()`로 분리할 수 있다 | 받은 데이터를 모듈 변수나 `stores/`의 nanostores에 두면 창 틀(`transition:persist`)과 함께 유지된다 | 정적 엔드포인트는 dev에서도 바로 응답 |
| MiniSearch / FlexSearch / Fuse | 위와 같고 라이브러리를 `import()`로 분리 | 위와 같음. 색인을 한 번 만든 뒤 재사용 | 위와 같음 |
| Pagefind JS API | `await import(/* @vite-ignore */ \`${bundlePath}pagefind.js\`)`. Pagefind 자신의 Component UI도 이 주석을 쓴다([instance.ts](https://github.com/Pagefind/pagefind/blob/main/pagefind_ui/component/core/instance.ts)). 공식 문서는 `await import("/pagefind/pagefind.js")`만 보여 준다([JS API](https://pagefind.app/docs/api/)) | 번들 모듈은 사이트에서 한 번만 실행되므로(Astro 문서 “Bundled module scripts … are only ever executed once”) 인스턴스가 유지된다. `lang`이 모든 화면에서 `ko`라 언어를 다시 고를 일도 없다 | 색인이 `dist/`에만 생긴다. `astro-pagefind`는 dev에서 미리 빌드한 색인을 대신 서빙한다([README](https://github.com/shishkin/astro-pagefind)) |

- 결과 링크를 일반 `<a href>`로 그리면 `<ClientRouter />`가 가로채 화면만 바꾼다. 창 틀 아일랜드 안에서 그리면 `docs/agents/astro-client-router.md`의 “클릭은 `document`에 위임” 규칙을 따로 신경 쓸 필요가 없다.
- 첫 화면 JS를 늘리지 않으려면, 창 틀에는 검색 보기의 껍데기와 “처음 열 때 불러오기”만 둔다. Starlight도 같은 방식이다. 검색 대화상자를 열 때 `requestIdleCallback` 뒤에 `import('@pagefind/default-ui')`를 부른다([Search.astro](https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/Search.astro)).
- Pagefind는 검색을 Web Worker에서 돌린다. 이 저장소에는 CSP 설정(`vercel.json` 헤더)이 없어 `wasm-unsafe-eval`·`worker-src` 문제는 해당하지 않는다([Troubleshoot Hosting](https://pagefind.app/docs/hosting/)).

### 빌드 통합

- **JSON**: `src/pages/search-index.json.ts`에서 `GET`을 내보내면 빌드 때 `/search-index.json`이 만들어진다([Static File Endpoints](https://docs.astro.build/en/guides/endpoints/#static-file-endpoints)). 글 목록은 기존 `getPublishedPosts()`를 쓴다. 다만 `post.body`는 MDX 원문이라(제목 `#`, `**강조**`, `<p align="center"><img …/></p>` 포함) 순수 텍스트로 벗겨 내는 단계가 필요하다. 렌더된 HTML에서 텍스트를 뽑는 Container API(`experimental_AstroContainer`)도 있지만 문서가 “experimental and subject to breaking changes, even in minor or patch releases”라고 적고 있어 MDX 원문을 정규식이나 Markdown 파서로 벗기는 편이 안전하다([Container API](https://docs.astro.build/en/reference/container-reference/)).
- **Pagefind**: `astro build` 뒤에 `pagefind --site dist`를 돌리거나, `astro:build:done` 훅에서 Node API(`createIndex` → `addDirectory` → `writeFiles`)를 부른다. Starlight가 후자를 쓴다([pagefind.ts](https://github.com/withastro/starlight/blob/main/packages/starlight/src/integrations/pagefind.ts)). npm 패키지는 플랫폼별 바이너리를 `optionalDependencies`로 받고 설치 스크립트가 없으므로 `pnpm-workspace.yaml`의 `allowBuilds` 정책을 건드리지 않는다(esbuild와 같은 구조). 바이너리 자체는 약 58MB(darwin-arm64 `pagefind_extended`)다.
- Pagefind를 쓰면 글 본문에 `data-pagefind-body`를 꼭 붙여야 한다. 창 틀의 탐색기가 모든 화면에 모든 글 제목을 그리므로 이 표시가 없으면 탐색기 내용이 모든 쪽에 색인된다. 한 쪽이라도 `data-pagefind-body`가 있으면 표시가 없는 쪽은 색인에서 빠진다([Indexing](https://pagefind.app/docs/indexing/)).

### 유지보수 (2026-10-26 조회, 기준일 2026-07-26)

| 패키지 | 최신 배포 | 기준 이후 배포 | 마지막 커밋 | 스타 / 열린 이슈 | 비고 |
| --- | --- | --- | --- | --- | --- |
| pagefind | 1.5.2 (2026-04-12) | 없음 | 2026-10-21 | 5,529 / 143 | 1.5.0(2026-04-06)에 Component UI·Web Worker·CJK 검색어 분절 추가. 이후는 의존성 갱신과 작은 수정(#1382, 2026-10-19). CHANGELOG `Unreleased` 비어 있음 |
| astro-pagefind | 2.0.1 (2026-07-03) | 없음 | 2026-10-19 | 567 / 7 | peer `astro ^2 … ^7`. 자체 `Search.astro`는 유지보수 모드로 전환, Pagefind Component UI 직접 사용 권장 |
| minisearch | 7.2.0 (2025-09-16) | 없음 | 2025-09-16 | 6,178 / 15 | 기준 미달 |
| flexsearch | 0.8.212 (2025-09-06) | 없음 | 2026-05-29 | 13,811 / 39 | 기준 미달 |
| fuse.js | 7.5.0 (2026-07-13) | 7.6.0-beta.0 (2026-08-09) | 2026-08-09 | 20,510 / 21 | 유일하게 기준 통과 |
| @orama/orama | 3.1.18 (2025-12-19) | 없음 | 2026-07-03 | 10,585 / 35 | 기준 미달 |
| @leeoniya/ufuzzy | 1.0.19 (2025-08-22) | 없음 | 2026-09-08 | 3,039 / 15 | 짧은 문자열(제목) 퍼지 검색용, gzip 4.3KB |
| es-hangul | 2.4.0 (2026-07-09) | 없음 | 2026-08-27 | 1,887 / 24 | 초성·자모 분해 유틸, Toss |

출처: npm 레지스트리(`npm view <pkg> --json`의 `time`), GitHub API(`repos/<repo>/commits?per_page=1`).

## 한 색인으로 두 검색을 처리할 수 있는가

| 요구 | 팔레트(⌘P) | 본문 검색(사이드 패널) |
| --- | --- | --- |
| 찾는 대상 | 파일 이름(`posts/2023/pro-developer-2023-days.mdx`)과 제목 | 본문 전체 |
| 매칭 | 글자마다 바로 반응, 순서만 맞으면 되는 부분열(subsequence) 퍼지와 강조가 자연스럽다 | 단어·부분 문자열, AND, 발췌 |
| 데이터 | `Shell`의 `tree` props로 이미 HTML에 있음 | 처음 열 때 받아야 함 |
| 응답 방식 | 동기 | 비동기 허용 |

- **팔레트에 Pagefind를 쓰면 맞지 않는다.** 검색이 비동기이고 단어 앞부분만 맞추며(`days`·`developer`는 하이픈으로 잘려 찾지만 `pd2023` 같은 부분열은 못 찾음), 결과마다 `data()`로 조각 파일을 따로 받아야 한다([JS API](https://pagefind.app/docs/api/) “The data for each result … must be loaded independently”).
- **JSON 하나로 둘 다 처리할 수는 있다.** `title`·`path`·`body`를 다 담으면 된다. 다만 팔레트를 먼저 연 사람도 본문 전체를 받게 되고 팔레트에 필요한 값은 이미 `tree`에 있다.
- 따라서 원본은 `getPublishedPosts()` 하나로 두고 팔레트는 `tree`를, 본문 검색은 `/search-index.json`을 쓴다. JSON에 `url`·`title`·`path`를 같이 넣어 두면 본문 결과를 그릴 때 `tree`를 다시 찾지 않아도 된다.

## 권장안과 트레이드오프

**권장: 팔레트는 `tree`에 대한 직접 구현 매칭, 본문 검색은 빌드 때 만든 `/search-index.json` + 직접 구현한 NFD 부분 문자열 매칭.** 런타임 의존성은 추가하지 않는다.

- 팔레트: `path`와 `title`을 NFD로 정규화해 부분 문자열·부분열 매칭을 한다. 퍼지 정도가 부족하면 uFuzzy(4.3KB), 초성 검색이 필요하면 es-hangul `getChoseong`(1.9KB)을 그때 붙인다. 두 패키지 모두 2026-07-26 이후 배포가 없으니 붙일 때 다시 확인한다.
- 본문: 검색 보기를 처음 열 때 JSON을 받아 nanostores에 넣는다. 검색어를 공백으로 나눠 모든 조각이 들어 있는 글만 고르고(AND), 제목 일치를 본문 일치보다 위에 둔다. 첫 일치 주변을 잘라 발췌로 보여 준다. 받은 데이터는 창 틀과 함께 화면 이동 뒤에도 남는다.

이 방식으로 얻는 것:

- 지금 규모에서 첫 검색 용량이 가장 작다(약 5KB, Pagefind 약 111KB).
- 띄어 쓰지 않은 복합어 중간과 입력 중인 음절까지 찾는다. 측정한 후보 가운데 둘 다 되는 것은 직접 구현(NFD)과 FlexSearch `full`뿐이다.
- `pnpm dev`에서 그대로 동작하고 매칭 함수를 Vitest(node 환경)로 시험하기 쉽다.
- `specs/010-blog-renewal/reference-research.md`의 방향, 곧 직접 만든 검색을 공개 구현으로 보여 준다는 목표와 맞는다.

포기하는 것:

- BM25 순위, 제목(앵커)별 하위 결과, 강조, 필터를 직접 만들거나 생략해야 한다. Pagefind는 이것을 기본으로 준다.
- MDX 원문을 순수 텍스트로 벗기는 코드를 유지해야 한다. MDX 안의 JSX가 늘면 이 단계가 깨지기 쉽다.
- JSON은 글 수에 정비례해 커진다. 실제 글 기준으로 1편이 gzip 5KB이므로 20편이면 약 100KB로 Pagefind의 1편 첫 검색 비용과 비슷해진다.

**다시 검토할 조건**: `/search-index.json`이 gzip 100KB를 넘으면(실제 글 기준 약 20편), 그때의 실제 글로 Pagefind와 다시 잰다. 한글 색인이 여러 조각으로 나뉘는 규모라면 Pagefind로 옮기고 아니라면 JSON을 글별·연도별로 나누는 쪽을 먼저 본다. 둘 중 무엇을 고르든 팔레트는 `tree`를 계속 쓴다.

## 미확인/불확실

- **Pagefind 문서와 소스의 한국어 처리 차이**: 문서 “Specialized languages”는 중국어·일본어·한국어를 분절 대상으로 적는다([Multilingual](https://pagefind.app/docs/multilingual/)). 그러나 1.5.2 소스는 색인 때 `matches!(…, "zh" | "ja" | "th")`([fossick/mod.rs](https://github.com/Pagefind/pagefind/blob/main/pagefind/src/fossick/mod.rs)), 검색 때 `["zh", "ja", "th"].includes(primaryLang)`([coupled_search.ts](https://github.com/Pagefind/pagefind/blob/main/pagefind_web_js/lib/coupled_search.ts))만 분절한다. charabia도 `chinese`·`japanese`·`thai` 기능만 켜져 있다([Cargo.toml](https://github.com/Pagefind/pagefind/blob/main/pagefind/Cargo.toml)). 한국어 어절은 공백으로 나뉘므로 실제 동작에는 큰 차이가 없지만 문서를 근거로 “한국어 형태소 분절을 해 준다”고 판단하면 안 된다. 브라우저 `Intl.Segmenter('ko', { granularity: 'word' })`도 “블로그에서 검색을 했다”를 어절 셋으로 나눌 뿐이다(Node에서 확인).
- **한글 색인 조각이 언제 나뉘는가**: 93편 말뭉치에서는 226KB 한 조각이었다. 조각 기준이 바이트가 아니라 위치 수(20,000)라서 실제 블로그 글로 몇 편부터 나뉘는지는 재 보지 않았다. 말뭉치가 기술 문서라 블로그 글과 어휘 분포가 다르다.
- **직접 구현 매칭 코드의 크기**: 작성 전이라 재지 않았다. 정규화·AND·발췌·강조를 합쳐 gzip 수 KB 이하일 것으로 보지만 추정이다.
- **모바일에서의 검색 속도**: 직접 구현 매칭은 93편(34만 자)에서 Mac·Node 기준 검색 한 번에 0.2ms 이하였다. 저사양 휴대폰은 측정하지 않았다.
- **⌘P 가로채기**: 브라우저 기본 동작(인쇄)을 `preventDefault`로 막을 수 있는지, 브라우저마다 다른지는 이번 조사 범위 밖이라 확인하지 않았다. 팔레트 티켓에서 따로 확인해야 한다.
- **Pagefind 결과 URL과 사이트 링크 형식**: Pagefind는 `dist`의 파일 경로로 URL을 만든다(`/blog/<slug>/`). `postUrl()`이 만드는 링크와 끝 슬래시가 같은지는 Pagefind를 고를 경우에만 확인하면 된다.

## 출처

- Pagefind: [홈](https://pagefind.app/), [JS API](https://pagefind.app/docs/api/), [Multilingual](https://pagefind.app/docs/multilingual/), [Indexing](https://pagefind.app/docs/indexing/), [Troubleshoot Hosting](https://pagefind.app/docs/hosting/), [Releases](https://github.com/Pagefind/pagefind/releases), [CHANGELOG](https://github.com/Pagefind/pagefind/blob/main/CHANGELOG.md)
- Pagefind 소스: [pagefind_web/src/search.rs](https://github.com/Pagefind/pagefind/blob/main/pagefind_web/src/search.rs)(`find_word_extensions`, 앞부분 일치), [pagefind/src/fossick/mod.rs](https://github.com/Pagefind/pagefind/blob/main/pagefind/src/fossick/mod.rs)(색인 때 분절 언어), [pagefind_web_js/lib/coupled_search.ts](https://github.com/Pagefind/pagefind/blob/main/pagefind_web_js/lib/coupled_search.ts)(검색 때 분절 언어), [pagefind/src/index/mod.rs](https://github.com/Pagefind/pagefind/blob/main/pagefind/src/index/mod.rs)(`chunk_index`), [pagefind/src/options.rs](https://github.com/Pagefind/pagefind/blob/main/pagefind/src/options.rs)(조각 기본값 20000)
- Astro: [Static File Endpoints](https://docs.astro.build/en/guides/endpoints/#static-file-endpoints), [Script behavior with view transitions](https://docs.astro.build/en/guides/view-transitions/#script-behavior-with-view-transitions), [Container API](https://docs.astro.build/en/reference/container-reference/)
- Starlight: [Search.astro](https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/Search.astro), [integrations/pagefind.ts](https://github.com/withastro/starlight/blob/main/packages/starlight/src/integrations/pagefind.ts)
- [astro-pagefind README](https://github.com/shishkin/astro-pagefind)
- npm 레지스트리: [pagefind](https://www.npmjs.com/package/pagefind), [minisearch](https://www.npmjs.com/package/minisearch), [flexsearch](https://www.npmjs.com/package/flexsearch), [fuse.js](https://www.npmjs.com/package/fuse.js), [@orama/orama](https://www.npmjs.com/package/@orama/orama), [@leeoniya/ufuzzy](https://www.npmjs.com/package/@leeoniya/ufuzzy), [es-hangul](https://www.npmjs.com/package/es-hangul)
- 저장소 안: `src/layouts/BaseLayout.astro`, `src/design-system/components/Shell/Shell.tsx`, `src/utils/ide.ts`, `src/utils/blog.ts`, `docs/adr/0001-keep-astro-with-persisted-ide-shell.md`, `docs/agents/astro-client-router.md`, `specs/010-blog-renewal/reference-research.md`
