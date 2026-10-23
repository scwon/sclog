# 02: 네 글꼴을 셀프호스팅한다

**What to build:** 블로그 이름·숫자는 Bricolage Grotesque, 제목·UI는 Pretendard Variable, 본문은 마루 부리, 코드·줄 번호·경로는 JetBrains Mono로 보이며, 글꼴 파일은 전부 사이트가 직접 제공한다. 외부 글꼴 요청이 하나도 없다. Storybook 토큰 문서에 글꼴 견본(Typeset)이 추가된다.

**Blocked by:** 01 (토큰·CSS 기반)

**Status:** done

참고: 스펙 "2층: CSS" 글꼴 항목, `docs/research/design-system-tokens.md` 부록(패키지 버전·크기), 시안 `styles.css`의 `@font-face`·폴백 스택, 시안 `README.md` 라이선스 표. 서브셋 생성은 시안 `build.py`의 fonttools 사용법을 참고한다.

- [x] `pretendard`, `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`가 의존성으로 추가되고 디자인 시스템 2층 글꼴 파일이 Pretendard 동적 서브셋 CSS와 fontsource 가변 woff2(라틴)를 import한다. `pretendard` npm 패키지는 2023-11이 마지막 배포라는 사실을 package.json 주석이 아닌 이 티켓의 Comments에 남긴다
- [x] 마루 부리 Regular·Bold를 KS X 1001 한글 2,350자 + 기본 라틴·문장부호로 서브셋한 woff2가 `public/fonts/`에 OFL 라이선스 전문과 함께 있고, 재생성 명령이 `scripts/` 아래 스크립트로 남아 있다(빌드에는 포함하지 않음). 파일당 크기를 Comments에 기록한다
- [x] 글꼴 토큰 `--font-display`·`--font-sans`·`--font-serif`·`--font-mono`가 `@theme inline`으로 노출돼 `font-display` 등 유틸리티가 생기고, 폴백 스택은 시안을 따른다
- [x] 기존 페이지의 제목·본문·코드가 새 글꼴로 렌더링된다(글 본문은 마루 부리, `word-break: keep-all`)
- [x] `Tokens.mdx`에 네 글꼴의 `Typeset` 견본(한글 문장과 `scwon’s blog`)이 추가된다
- [x] 빌드 결과물 테스트에 "HTML·CSS에 `fonts.googleapis.com`·`fonts.gstatic.com`·`cdn.jsdelivr.net` 글꼴 참조 없음, `@font-face` `url()`은 모두 같은 출처 경로" 검사가 추가된다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-23 구현 (브랜치 `design-system`)

**결정**

- 의존성은 티켓에 적힌 세 개만 추가했다: `pretendard@^1.3.9`, `@fontsource-variable/bricolage-grotesque@^5.3.0`, `@fontsource-variable/jetbrains-mono@^5.3.0`. `pretendard` npm 패키지는 1.3.9가 마지막이고 배포일은 2023-11-05다(npm `time`). 글꼴 자체가 1.3.9에서 멈춰 있어 그대로 쓴다.
- 토큰은 티켓 01의 규칙을 따른다.
  - 원시 토큰은 폴백까지 포함한 글꼴 묶음이다: `--font-family-bricolage`·`-pretendard`·`-maruburi`·`-jetbrains-mono`. 폴백 순서는 시안 `styles.css`와 같고, 첫 이름만 패키지의 실제 family 이름(`… Variable`)으로 바꿨다.
  - 의미 토큰은 `--family-display/sans/serif/mono`이고, `@theme inline`이 `--font-display/sans/serif/mono`로 노출한다. 처음에는 `--typeface-*`로 지었지만 타이포 스케일 `--type-*`와 접두어가 겹쳐 리뷰 뒤 바꿨다. 역할 이름 `family`는 ADR 0003과 GLOSSARY "역할"에 추가했다.
  - `--font-*: initial`은 쓰지 않았다. `--font-weight-*` 네임스페이스까지 지울 수 있어서, 네 글꼴 값만 덮어썼다. Preflight의 기본 글꼴(`--default-font-family`·`--default-mono-font-family`)이 이 값을 따라가 문서 전체는 Pretendard, `code`·`pre`는 JetBrains Mono가 된다.
- 2층 `styles/fonts.css`는 Pretendard 동적 서브셋 CSS, Bricolage `opsz.css`, JetBrains Mono `wght.css`를 import하고 마루 부리 `@font-face` 두 개를 둔다.
  - Bricolage는 `wght.css`(라틴 41.3KB)가 아니라 `opsz.css`(굵기 + 광학 크기, 라틴 76.9KB)를 쓴다. 시안이 opsz 축(12~96)을 살려 두었고, 블로그 이름처럼 큰 글자에서 모양이 달라진다. 실제 렌더링 글꼴이 `Bricolage Grotesque 96pt ExtraBold`인 것을 CDP로 확인했다.
  - fontsource CSS는 하위 집합 파일을 따로 고르지 않고 통째로 import했다. 라틴 외 하위 집합(라틴 확장·베트남어·키릴·그리스) woff2도 dist에 실리지만, 각 `@font-face`에 `unicode-range`가 있어 브라우저는 쓰인 범위의 파일만 받는다. 홈·글 페이지에서 Bricolage는 라틴 파일 하나만 받았다. 라틴 확장 글자(é 등)도 같은 글꼴로 보이는 편이 낫다고 판단했다.
- 마루 부리 서브셋은 `scripts/subset-maruburi.py`다. uv 인라인 의존성(fonttools 4.60.1, brotli 1.1.0)을 쓰고, 실행은 `uv run scripts/subset-maruburi.py`다(CLAUDE.md Commands에 추가, 빌드에는 넣지 않음). 원본은 네이버 배포 TTF를 `~/.cache/sclog-fonts`에 받아 쓴다.
  - 담는 글자: KS X 1001 한글 2,350자(EUC-KR 0xB0A1–0xC8FE), 한글 호환 자모 51자, 기본 라틴, 라틴-1 문장부호·기호(U+00A0–00BF, ×, ÷), 일반 문장부호(‘’“”…— 등), CJK 괄호·마침표. 호환 자모는 KS X 1001에 있는 글자이고 "ㅋㅋ" 같은 본문에 쓰여서 넣었다.
  - 라이선스: `public/fonts/MaruBuri-OFL.txt`. 글꼴 name 테이블의 저작권 줄("© NAVER Corp. © NAVER Cultural Foundation Corp.")에 SIL OFL 1.1 전문을 붙였다.
- 적용: `body`에 `word-break: keep-all`, `overflow-wrap: break-word`를 줬다(시안 body와 같음). 옛 화면에서는 로고 `SCLOG`만 Bricolage 800(시안 display 굵기)이고, 글 본문은 마루 부리, 본문 안 장 제목은 Pretendard다. 옛 컴포넌트 코드 글꼴은 `var(--family-mono)`다. 본문 글자색은 `--text` 대신 본문 역할인 `--prose`로 바꿨다.
- Storybook: `staticDirs: ['../public']`로 `/fonts/…`를 사이트와 같은 경로에서 연다. `Tokens.mdx`의 글꼴 절은 `--family-*` 토큰마다 `Typeset` 견본(굵기 400·800, 크기 `--type-body-sm`·`--type-title-sm`)을 그리고, 제목의 설명은 `semantic.css` 주석을 읽어 온다.
  - `Typeset` 상자와 문서의 `li`는 Storybook이 캐스케이드 레이어 밖 스타일로 칠한다. 그래서 툴바 테마를 따르도록 `!` 유틸리티로 의미 토큰을 입혔다. 이 선택자는 `Typeset`의 DOM 구조에 기대므로 Storybook을 올릴 때 확인해야 한다.
- 빌드 결과물 테스트에 글꼴 검사 여섯 개를 더했다.
  - 외부 글꼴 호스트(`fonts.googleapis.com`·`fonts.gstatic.com`·`cdn.jsdelivr.net`) 참조가 없는지 본다.
  - 네 글꼴의 `@font-face`가 실렸는지 본다(4개).
  - 모든 `@font-face` `url()`이 루트 기준 경로이고 `dist`에 실제 파일이 있는지 본다. Vite가 4KB 미만 파일을 CSS에 인라인한 `data:` URI는 요청이 없으므로 허용한다. 마루 부리 Bold 파일을 지웠을 때 이 검사가 실패하는 것을 확인했다.

**측정값**

- 마루 부리 서브셋: Regular 206,488B, Bold 214,980B, 각 2,563글자. 기존 글(`pro-developer-2023-days`)의 한글 3,390자(고유 393자)는 모두 2,350자 안에 있다.
- 패키지 글꼴 파일: Bricolage 라틴 opsz 76,888B, JetBrains Mono 라틴 wght 40,404B, Pretendard 동적 서브셋 92개 합계 약 3.0MB(dist에 실리는 양이고 페이지는 일부만 받는다).
- 페이지가 실제로 받은 글꼴(ego-browser, 캐시 없음):
  - 홈: Pretendard 7묶음 177KB, Bricolage 75KB
  - 글: Pretendard 9묶음 229KB, Bricolage 75KB, 마루 부리 Regular 202KB·Bold 210KB, 합계 약 716KB
  - 외부 글꼴 요청 0건
- 실제 렌더링 글꼴(CDP `CSS.getPlatformFontsForNode`): 본문 `MaruBuri Regular/Bold`, 장 제목·글 제목 `Pretendard Variable`, 로고 `Bricolage Grotesque 96pt ExtraBold`
- 빌드 CSS: 전역 `Header.*.css` 73,842B(gzip 22,723B), 티켓 01 끝의 18,750B보다 커졌다. 늘어난 양은 대부분 Pretendard 동적 서브셋 CSS(`@font-face` 92개, 패키지 원본 55.8KB)다.
- 테스트 61개 통과(토큰 37, 빌드 결과물 17, 기존 `blog.test.ts` 7). `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.

**남은 것**

- 글 페이지는 마루 부리 두 굵기에만 412KB를 받는다. 스펙이 정한 2,350자 단일 파일 방식의 비용이다. 더 줄이려면 Pretendard처럼 사용 빈도로 묶음을 나눈 `unicode-range` 분할이 필요하고, 이건 스펙 변경이다.
- 전역 CSS 73.8KB(gzip 22.7KB)는 렌더링을 막는 CSS다. 줄이려면 Pretendard 동적 서브셋 CSS를 한글 빈도 상위 묶음만 남기는 식으로 손봐야 하고, 이것도 스펙 변경이다.
