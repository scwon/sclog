# 선택 텍스트 링크 복사: Text Fragment 조사

조사일 2026-10-27. 확인 수준을 각 항목에 적는다: **[확인]** 원문을 직접 읽음, **[미확인]** 기억·간접 근거라 구현 전 재확인 필요.

## 1. Chrome "Copy link to highlight" 생성 방식

Chrome의 생성기(Blink `text_fragment_selector_generator.cc`)와 GoogleChromeLabs 폴리필의 `fragment-generation-utils.js`는 같은 알고리즘을 쓴다. 아래 상수와 흐름은 폴리필 원본에서 확인했다 **[확인]**.

- 출처: https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/main/src/fragment-generation-utils.js
- Chromium: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/fragment_directive/text_fragment_selector_generator.cc **[미확인: 상수 일치 여부]**
- 스펙: https://wicg.github.io/scroll-to-text-fragment/ (문법 `#:~:text=[prefix-,]textStart[,textEnd][,-suffix]`)

| 상수 | 값 | 뜻 |
| --- | --- | --- |
| `MAX_EXACT_MATCH_LENGTH` | 300 | 선택이 300자 이하이고 block 경계를 넘지 않으면 `textStart`만 쓰는 exact match |
| `MIN_LENGTH_WITHOUT_CONTEXT` | 20 | exact 텍스트가 20자 이상이고 유일하면 바로 반환. 짧으면 context를 일찍 붙임 |
| `WORDS_TO_ADD_FIRST_ITERATION` | 3 | range 모드에서 첫 반복에 start·end 각각 3단어 |
| `WORDS_TO_ADD_SUBSEQUENT_ITERATIONS` | 1 | 이후 반복마다 1단어씩 확장 |
| `ITERATIONS_BEFORE_ADDING_CONTEXT` | 1 | 1회 확장 뒤에도 유일하지 않으면 prefix/suffix 추가 |
| timeout | 500ms | 초과 시 `TIMEOUT` |

흐름:
1. exact 가능(≤300자, block 경계 없음) → 전체 텍스트를 `textStart`로. 유일하고 ≥20자면 끝. 아니면 exact는 고정한 채 prefix/suffix만 단어 단위로 늘린다.
2. range 모드(>300자 또는 block 경계를 넘음) → 선택의 앞에서 `textStart`, 뒤에서 `textEnd`를 3단어부터 시작해 1단어씩 늘린다. 경계가 있으면 첫 경계까지/마지막 경계부터로 제한하고, 두 후보가 겹치지 않게 막는다.
3. 매 반복마다 문서 전체에서 유일한지 검사한다. 더 늘릴 공간이 없으면 실패.
4. 실패 상태: `INVALID_SELECTION`(빈 선택, 구두점만, input/textarea/contenteditable, 하위 frame), `AMBIGUOUS`(끝까지 늘려도 중복), `TIMEOUT`, `EXECUTION_FAILED`.
5. 단어 경계는 `Intl.Segmenter`(word granularity)의 `isWordLike` 조각을 쓰고, 없으면 정규식 경계 문자로 대체한다.

## 2. 한글 URL 길이

- 한글 한 음절은 UTF-8 3바이트, percent-encoding하면 `%EA%B0%80`처럼 9자가 된다. 공백은 `%20`(3자). exact 300자 한글 선택은 대략 2,700자 URL 조각이 된다.
- 브라우저 한계는 문제 되지 않는다. Chrome은 URL을 2MB까지 받는다(https://chromium.googlesource.com/chromium/src/+/main/docs/security/url_display_guidelines/url_display_guidelines.md) **[미확인: 정확한 수치]**. 실제 제약은 사람이 보는 곳이다.
- 메신저·SNS: X는 링크를 t.co로 줄여 길이와 상관없이 23자로 센다(https://developer.x.com/en/docs/counting-characters) **[미확인]**. Slack·KakaoTalk의 미리보기는 서버가 fragment 없이 페이지를 긁으므로 미리보기 자체엔 영향이 없지만, 메시지 본문에 `%EA%B0…` 덩어리가 그대로 보여 읽기 나쁘다. 일부 클라이언트는 fragment의 `%`를 다시 인코딩하거나 `,`·`-`를 잘라 링크가 깨진다는 보고가 있다 **[미확인: 메신저별 공식 문서 없음]**.
- "압축": percent-encoding 자체를 줄이는 방법은 없다. 브라우저가 해석하는 형식이 고정이라 gzip·base64는 `:~:text=`에 쓸 수 없다. 줄이는 유일한 길은 **넣는 글자 수를 줄이는 것**(range 모드에서 앞뒤 몇 단어만)이다. 한글 3단어(약 10음절) ×2면 약 200자 안팎.

선택지 비교 (Vercel 정적 사이트, DB 없음):

| 안 | 장점 | 단점 |
| --- | --- | --- |
| (a) 단어 수 제한 `textStart,textEnd` (스펙 방식) | 브라우저 네이티브 하이라이트, JS 없이도 동작, 외부 사이트·검색엔진과 호환, 영구적 | 한글이면 URL이 수백 자, 메신저 본문에서 지저분함 |
| (b) 짧은 ID/해시 (`#q-<hash>` 또는 `?q=`) | URL 짧음 | DB가 없으니 해시→텍스트 역변환 불가. 클라이언트가 문서의 모든 후보 구간 해시를 계산해 맞춰야 함(블록 단위 해시면 가능하나 임의 선택 범위는 어려움). 글이 바뀌면 깨짐. 우리 JS가 없으면 무의미. `?q=`는 정적 페이지 캐시 키도 바꿈 |
| (c) 둘 다 | 공유 위치에 따라 고를 수 있음 | UI·코드 두 벌 |

(b)를 현실적으로 하려면 "문단 id + 문단 안 오프셋"(`#p-12:30-58`) 같은 위치 기반 형식이 된다. 짧지만 글을 고치면 어긋난다.

## 3. 브라우저 지원과 대체 경로

- caniuse: Chrome/Edge 81+, Safari 16.1+, Firefox 131+ 모두 지원(https://caniuse.com/url-scroll-to-text-fragment) **[확인]**. Firefox는 열린 이슈가 남아 있다고 표시.
- 기능 감지: `'fragmentDirective' in document` (https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments) **[미확인: 페이지 경로]**.
- 페이지 로드 후 `location.hash`에서 `:~:` 이하는 스크립트에 보이지 않는다(스펙상 fragment directive는 제거됨). 미지원 브라우저에선 그대로 남으므로 직접 파싱 가능하다. 지원 브라우저에선 대체 경로가 필요 없다.
- `ClientRouter`(View Transitions) 안의 이동에선 브라우저 네이티브 하이라이트가 돌지 않을 수 있다. 문서 단위 로드가 아니기 때문이다 **[미확인: 직접 테스트 필요]**. 이 경우 `performance.getEntriesByType('navigation')[0].name`로 원래 URL을 읽어 우리 쪽에서 CSS Custom Highlight API(`CSS.highlights`, `::highlight()`)로 칠하고 scroll한다. Custom Highlight API는 Chrome 105+, Safari 17.2+, Firefox 140+ **[미확인: Firefox 버전]** (https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API).

## 4. 재사용 라이브러리

- `text-fragments-polyfill` (GoogleChromeLabs) 최신 6.7.0, npm 수정일 2025-11-10, unpacked 167KB **[확인: `npm view`]**. 생성기는 `text-fragments-polyfill/dist/fragment-generation-utils.js`의 `generateFragment(selection)`로 따로 import할 수 있다. gzip 크기는 측정하지 않았다. 아일랜드 안에서 선택 시점에 dynamic import하면 초기 번들엔 들지 않는다.
- 같은 패키지의 `text-fragment-utils.js`(`processFragmentDirectives`)는 대체 경로에서 파싱·매칭에 쓸 수 있다.
- 1년 가까이 릴리스가 없지만 스펙이 안정돼 있어 큰 문제는 아니다.

## 5. 한글 단어 분할

- 한국어는 띄어쓰기 단위(어절)가 단어 경계로 쓰기 좋다. `Intl.Segmenter('ko', {granularity:'word'})`는 한글에서 사실상 공백·구두점 기준으로 나누므로 결과가 어절과 거의 같다 **[미확인: 엔진별 차이]**. 폴리필도 Segmenter를 쓰므로 직접 구현할 이유가 적다.
- 스펙 매칭은 word boundary를 요구한다. 어절 중간에서 시작하는 선택(조사 앞에서 자르기 등)은 생성기가 어절 경계로 넓힌다. 사용자가 본 범위와 조금 다를 수 있다.

## 권장안

1. 표준 `#:~:text=`만 만든다(안 a). 생성은 `text-fragments-polyfill`의 `generateFragment`를 선택 시점에 dynamic import해서 쓰고, 상태가 `SUCCESS`가 아니면 버튼을 "링크 복사(위치 없음)"로 낮춘다.
2. 한글 길이 대책은 압축이 아니라 range 모드 우선이다. 선택이 짧으면(예: 40음절 이하) exact, 길면 `textStart,textEnd` 앞뒤 3어절로 시작해 유일해질 때까지 늘린다. 폴리필 기본 동작이 이와 같으므로 옵션만 확인한다.
3. 짧은 ID(안 b)는 DB 없는 정적 사이트에서 역변환이 어렵고 글 수정에 약하므로 하지 않는다.
4. 대체 경로: 미지원 환경과 `ClientRouter` 이동 시 `:~:text=`를 직접 파싱해 CSS Custom Highlight API로 칠하고 scroll한다. 구현 전 Chrome에서 ClientRouter 이동 뒤 네이티브 하이라이트가 도는지 먼저 확인한다.
