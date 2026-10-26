# 04: 탭 스토어와 원자 컴포넌트(Tabs·Badge)

**What to build:** 열린 글이 에디터 탭으로 쌓이고 `×`로 닫히며, 새로고침해도 같은 브라우저 세션 동안 남는 탭 상태 모델을 만든다. `posts.log`는 항상 첫 탭이고 닫히지 않는다. 탭 표시줄 컴포넌트 `Tabs`와 태그·분류용 `Badge`를 두 테마 스토리로 확인한다. 이 티켓에서는 아직 사이트에 붙이지 않고 Storybook에서 동작한다.

**Blocked by:** 03 (테마 스토어와 원자 컴포넌트, nanostores 도입)

**Status:** done

참고: 스펙 "3층" 탭 스토어 항목, ADR 0001 Consequences, 시안 `ide.css` "editor" 탭 절(`.tab`, 코랄 윗선, 새 탭 .32s 펼침)과 `app.js` 탭 처리부.

- [x] 탭 스토어가 순수 로직 모듈(`addOrActivate(state, file)`, `close(state, url)` → 다음 상태와 다음 활성 URL, `posts.log` 닫기 거부, 중복 추가 무시)과 바인딩 모듈(nanostores `map`, `sessionStorage` 거울 저장·복원)로 나뉘고, 순수 로직에 Vitest 테스트가 있다: 추가·중복·활성 탭 닫기 → 왼쪽 탭·마지막 탭 닫기 → `posts.log`·`posts.log` 닫기 거부
- [x] `Tabs`가 스토어를 구독해 탭 목록·활성 탭·닫기 버튼을 그리고, 탭은 링크(`<a>`)라 JS 없이도 이동한다. 활성 탭은 코랄 윗선, 새 탭은 왼쪽에서 320ms 펼침, `prefers-reduced-motion`에서는 즉시
- [x] 키보드: 탭 사이 좌우 화살표 이동, 닫기 버튼은 `aria-label="<제목> 닫기"`
- [x] `Badge`(태그·분류·읽는 시간용, 작은 모노 글자 변형 포함)가 의미 토큰만 쓴다
- [x] 두 컴포넌트 스토리가 있고 두 테마에서 a11y 위반이 없다. `Tabs` 스토리는 탭 3개 + 닫기 상호작용을 보여 준다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 구현 (브랜치 `design-system`)

**결정**

- 탭 스토어
  - 순수 로직 `stores/tabs.logic.ts`: `TabFile`(url·title·path), `TabsState`(열린 파일 목록, 첫 칸은 항상 `posts.log` + 활성 URL), `POSTS_LOG`, `initialTabs`, `addOrActivate`, `close`, `restoreTabs`.
    - 함수 이름은 티켓에 적힌 대로 `addOrActivate`·`close`다.
    - `close`는 `{ state, next }`를 돌려준다. 활성 탭을 닫으면 왼쪽 탭이 다음 활성 탭이 되고, 맨 왼쪽은 언제나 `posts.log`다. `posts.log`나 열려 있지 않은 탭은 닫지 않는다.
  - `restoreTabs`는 `sessionStorage`에서 꺼낸 값을 다시 상태로 만든다. 모양이 틀린 항목, 중복, `posts.log` 사본은 버리고, 활성 탭이 목록에 없으면 `posts.log`를 활성 탭으로 둔다. 검증은 손으로 썼다. CLAUDE.md는 스키마 검증에 zod를 권하지만 zod가 설치돼 있지 않고, 필드 세 개짜리 검증에 새 라이브러리를 들일 이유가 약하다.
  - 테스트 `stores/tabs.test.ts` 12개: 처음 상태, 추가, 중복, `posts.log` 다시 열기, 활성 탭 닫기 → 왼쪽 탭, 마지막 탭 닫기 → `posts.log`, 비활성 탭 닫기, `posts.log` 닫기 거부, 없는 탭 무시, 복원 3개.
  - 바인딩 `stores/tabs.ts`: `$openTabs`는 nanostores `map`(키 = 글 URL, 넣은 순서 = 탭 순서, 스펙·ADR 0001)이고 `$activeTab`은 `atom`이다. `openTab`·`closeTab`이 바꿀 때마다 `sessionStorage` `tabs`에 상태를 거울처럼 저장하고, 모듈을 읽을 때 복원한다.
- `Tabs`
  - 스토어를 구독해 그린다. 탭은 `<a href>`라 JS 없이도 이동하고, 활성 탭은 `aria-current="page"`와 코랄 윗선, 바탕 이음(시안 `.tab-item.is-active`)으로 표시한다.
  - 탭 글자는 시안처럼 파일 이름(`…/pro-developer-2023-days.mdx`의 마지막 조각)이고 전체 경로는 `title`이다. 글자 크기는 시안 12.5px 대신 스케일의 `text-xs`(12px)를 썼다.
  - 탭 앞 기호(`posts.log`의 로그 줄, 글의 접힌 종이)는 시안 `.log-glyph`·`.file-dot`의 픽셀 치수를 그대로 옮겼다(장식용 그림이라 토큰으로 두지 않음).
  - 닫기 버튼의 이름은 `aria-label="<제목> 닫기"`다.
  - 활성 탭을 닫으면 `onNavigate(next)`를 부른다. 기본은 `location.assign`이고, 티켓 05에서 Astro `navigate`를 넘긴다(디자인 시스템이 Astro를 모르게 하기 위해).
  - 닫은 뒤에는 키보드 포커스를 닫은 뒤의 활성 탭 링크로 옮긴다(버튼이 사라져 포커스가 `body`로 떨어지던 문제).
  - 키보드: 탭 링크에서 좌우 화살표로 오가고, 끝에서는 반대쪽 끝으로 돈다.
  - 새 탭 등장: 2층 `styles/motion.css`의 `@utility animate-unroll`(clip-path, `--motion-enter` 320ms, `--motion-easing`)을 쓴다. 움직임 줄이기 설정에서는 유틸리티 안에서 `animation: none`이 된다. 용어집의 "펼침"은 에디터 줄이 나타나는 움직임만 가리키므로, 탭 쪽은 "등장"이라고 부른다. `motion.css`는 스펙 "폴더와 경계"의 2층 파일 목록에 추가했다.
  - 등장 대상 고르기: 렌더가 아니라 커밋 뒤에 직전 탭 목록과 비교해, 새로 생긴 탭 요소에만 클래스를 붙인다(`useNewTabEntrance`). 첫 프레임 전에 있던 탭, 곧 하이드레이션 직후 복원된 탭은 움직이지 않는다.
  - 서버 스냅샷은 `posts.log`만이다. 세션 탭은 하이드레이션 뒤에 그린다.
- `Badge`: 시안처럼 바탕을 칠하지 않고 글자와 기호로만 구분한다. tag(`#회고`, 흐린 글자에 코랄 `#`), category(`[회고]`, 작은 모노·코랄, 흐름 로그 줄), meta(작은 모노·흐린 색·고정폭 숫자, 읽는 시간·날짜)가 있다. `asChild`로 링크에 쓰면 마우스를 올렸을 때 본 글자색이 된다.
- 스토리: `Tabs`는 탭 3개(posts.log + 글 2개)를 깔고, 탭 클릭·닫기·화살표·"새 탭 열기"를 해 볼 수 있다.
  - Storybook 안에서는 링크 이동을 가로채 활성 탭만 바꾼다.
  - 탭은 미리보기를 처음 열 때 한 번만 깐다. 데코레이터나 `beforeEach`에서 깔면 툴바 테마를 바꿀 때마다 다시 돌아, 닫은 탭이 되살아났다.
  - `Badge`는 변형 3개, 태그 링크 목록, 로그 줄 조합 스토리가 있다.
- 공개 진입점에 `Badge`, `Tabs`, `$openTabs`·`$activeTab`·`openTab`·`closeTab`, `POSTS_LOG`, `TabFile`을 추가했다. 사이트에는 아직 붙이지 않았다(티켓 05).

**측정값·확인**

- 접근성: axe-core 4.14.0(a11y 애드온과 같은 엔진)으로 `Tabs`·`Badge` 스토리 6개 × 두 테마를 검사했고 위반 0건이다. 페이지 단위 규칙은 뺐다.
- 동작(빌드한 Storybook, ego-browser):
  - 탭 클릭 → 활성 전환, 좌우 화살표 이동과 끝에서 돌기
  - 새 탭에만 `animate-unroll`이 붙고, 움직임 줄이기에서는 `animation-name: none`
  - 활성인 마지막 탭 닫기 → 왼쪽, 비활성 탭 닫기 → 활성 유지, 마지막 글 닫기 → `posts.log`
  - 닫은 뒤 포커스가 활성 탭 링크로 감
  - 탭을 닫고 툴바 테마를 두 번 바꿔도 닫은 상태가 남음
- 테스트 93개 통과(탭 로직 12, 테마 로직 7, 토큰 37, 빌드 결과물 30, 기존 `blog.test.ts` 7). `CI=1`에서 lint·format:check·build(astro check 0 errors·0 warnings·0 hints)·test·build-storybook 모두 통과했다.

**티켓 05로 넘기는 것**

- 정적 빌드에서 서버 렌더링 중에 `openTab`을 부르면 안 된다. 모듈 단위 스토어가 페이지 사이에 공유돼 탭이 쌓인다. 페이지의 탭은 클라이언트에서 `astro:page-load` 때 `data-file`을 읽어 연다(스펙 계약).
- 지금 서버 HTML의 탭 표시줄에는 `posts.log`만 있다. 글 페이지를 JS 없이 열면 그 글의 탭이 보이지 않는다. 필요하면 `Shell`이 현재 페이지 파일을 서버 스냅샷에 더하는 방식을 정한다.
