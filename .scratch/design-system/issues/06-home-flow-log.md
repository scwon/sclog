# 06: 홈 `posts.log` 흐름 로그

**What to build:** 홈 에디터가 시안 `index.html`처럼 보인다. 1번 줄에 Bricolage 블로그 이름, 2번 줄 주석 `// 원성철 · github.com/scwon`, 이어서 연도 줄(`2023/ ---- 1`), 글 로그 줄(코랄 노드, `날짜 [분류] 파일명`), 글 카드(코랄 매트 썸네일, 날짜 → 제목 → 첫 문장 → 분류·읽는 시간), 장 노드 `01–05`와 하위 절 점선 노드가 화살표로 이어지고, 끝 줄은 `(END)`와 코랄 커서다. 모든 값은 실제 글 파일에서 읽는다.

**Blocked by:** 05 (창 틀과 레이아웃 교체)

**Status:** done

참고: DESIGN.md "IDE 작업 화면과 흐름 로그" 표(에디터 줄 구조, 노드 치수, 접기, 반응형), "전체 화면 IDE" 홈 항목, 시안 `index.html`과 `ide.css` "home: the flow log" 절, `app.js` 접기·현재 줄 처리.

- [x] 줄 번호 열(56px, 760px 미만 34px) + 레일 열(28px) + 내용 구조로 모든 줄에 번호가 있고, 포커스·마우스가 있는 줄은 밝은 배경과 흰 줄 번호로 표시되며 상태줄 `Ln N`이 따라간다
- [x] 글 로그 줄·카드·장 노드·하위 절 노드가 각각 글, 글, 글의 해당 제목 앵커로 가는 링크다. 장·절 목록은 글의 `headings`에서 만든다
- [x] 글 로그 줄의 `▾`로 장 흐름을 접으면 줄 번호가 건너뛰고 `··· N개 장 접힘` 줄이 남는다. 접힘 상태는 JS 없이는 펼친 상태가 기본
- [x] 장 노드 36px·반경 8px·테두리 26% 선, 마우스 올림 시 코랄 테두리와 옅은 코랄 바탕. 하위 노드 30px 점선, 올림 시 실선 코랄. 전환은 모션 토큰을 쓰고 reduced-motion에서 꺼진다
- [x] 760px 미만: 접기·파일명 숨김, 카드 세로 배치, 하위 흐름은 장 노드 아래로
- [x] 카드 본문 첫 문장은 글 본문에서 뽑고, 빈 공간을 채우는 가상 줄·가상 글은 없다
- [x] 흐름 로그를 이루는 React 없는 Astro 컴포넌트가 디자인 시스템 2층 유틸리티·`@layer components` 스타일만 쓴다
- [x] 홈 상태의 `Shell` 스토리 또는 흐름 로그 정적 HTML 스토리가 두 테마에서 a11y 위반이 없다
- [x] `CI=1`로 `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, `pnpm build-storybook` 통과

## Comments

### 2026-10-26 구현 (브랜치 `design-system`)

**결정**

- 흐름 로그는 React 없는 Astro 컴포넌트 `src/components/flow/FlowLog.astro` 하나다. 줄 모델(줄 번호 붙이기, 장 흐름, 첫 문장)은 `src/utils/flow.ts`의 `flowPost`·`flowLines`·`firstSentence`가 만든다. 값은 모두 글 파일(frontmatter, `render()`의 `headings`, 본문)에서 읽는다. 가상 줄이나 가상 글은 없다.
- 스타일은 2층 `styles/ide.css`의 `.flow*`(`@layer components`)에 있고 의미 토큰만 쓴다.
  - 줄 번호 열은 `--gutter-width`(56px, 760px 미만 `--gutter-width-sm` 34px), 레일 열은 `--track-width`(28px)다.
  - 장 노드는 36px, `--corner-md`, `--border-strong`이고, 마우스를 올리면 `--accent` 선과 `--state-selected` 바탕이 된다. 절 노드는 30px 점선이고, 올리면 실선 코랄이다.
  - 전환은 `--motion-*`을 쓴다. 코랄 커서 깜빡임은 움직임 줄이기 설정에서 멈춘다.
  - 카드 썸네일 매트는 `--accent` 바탕이다. 시안의 이미지 테두리·그림자 색(먹색 14%, 갈색 그림자)은 `color-mix(var(--on-accent) …)`로 토큰에서 만든다.
- 분류 꼬리표는 디자인 시스템 `Badge`(category)를 Astro에서 정적 HTML로 그린다(클라이언트 JS 없음). 분류는 첫 태그다.
- 줄 번호는 `<span class="flow-ln" aria-hidden="true" data-ln="N">`에 CSS `content: attr(data-ln)`로 그린다.
  - 글자로 두면 IDE 관례대로 흐린 줄 번호(`--text-faint`)가 명암비 검사에 걸렸다.
  - 장식이므로 읽기 순서·복사에 섞이지 않게 생성 콘텐츠로 바꿨다. 시안의 글 화면도 CSS 카운터로 줄 번호를 그린다.
- 현재 줄: 줄에 포커스나 마우스가 있으면 `--state-current` 바탕과 본 글자색 줄 번호가 된다. 스크립트가 그 줄 번호를 새 `reading` 스토어(`stores/reading.ts`, nanostores `map`)에 쓰고, 창 틀이 구독해 상태줄 `Ln N`으로 보인다. 파일을 열 때마다 읽기 위치는 비워진다.
- 접기: 글 로그 줄의 `▾` 버튼(`aria-expanded`, `aria-controls` = 장 줄 id들)이 장 줄을 숨기고, 줄 번호 없는 `··· N개 장 접힘` 줄을 보인다. 그 줄을 누르면 펴지고 포커스는 접기 버튼으로 돌아간다. 접힘 줄은 처음부터 `hidden`이라 JS가 없으면 모두 펼친 채 보인다.
- 스크립트는 Astro 번들 스크립트라 화면 이동 뒤 다시 돌지 않는다. 그래서 문서에 이벤트를 한 번만 위임해 건다. `@/design-system`에서 `setReading`을 가져오지만 번들은 986B다. 창 틀 아일랜드와 같은 디자인 시스템 청크를 공유하므로 스토어 인스턴스도 하나다.
- 옛 홈 컴포넌트(`ProfileSection`·`CareerSection`·`RecentPosts`·`SocialLinks`·`icons/*`)와 `src/data/profile.ts`·`types.ts`는 지웠다. `public/images`의 프로필 이미지는 외부 링크가 있을 수 있어 남겼다.

**확인**

- ego-browser(1440·1024·390px, 두 테마)
  - 시안 `index.html`과 같은 구성이다: 1번 줄 Bricolage 이름(`’` 코랄), 2번 줄 주석, 연도 줄 `2023/ ---- 1`, 글 로그 줄, 카드, 장 노드 01–05와 절 노드, `(END)`와 커서.
  - 760px 미만에서는 접기·파일명이 숨고, 카드가 세로 배치가 되며, 절 흐름은 장 노드 아래로 간다.
  - 장 노드에 마우스를 올리면 상태줄이 `Ln 9`가 된다.
  - 접으면 보이는 줄 번호가 `1,2,3,4,5,,11`이 된다.
- 접근성: axe-core 4.14.0으로 실제 홈을 1440·390px × 두 테마에서 모든 규칙으로 검사했고 위반 0건이다(접은 상태 포함). 흐름 로그는 Astro 컴포넌트라 Storybook 대신 실제 페이지로 검사했다.
- 테스트 103개 통과. `CI=1`에서 lint·format:check·build·test·build-storybook 모두 통과했다.
