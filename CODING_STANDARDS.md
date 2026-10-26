# Coding Standards

리뷰(`/code-review`의 Standards 축)가 diff에 적용하는 판단 규칙이다. 기계로 잡을 수 있는 규칙은 여기 두지 않고 검사로 둔다: 타입·`any`(oxlint), import 경계(`.oxlintrc.json`의 `no-restricted-imports`), 포맷(oxfmt), 토큰 구조·명암비(`tokens.test.ts`), 빌드 결과물(`src/test/build-output.test.ts`), 화면 이동·접근성(`pnpm qa`).

함께 읽을 원본: `CLAUDE.md`의 Coding Conventions, `GLOSSARY.md`, `docs/adr/`, 작업 중인 `.scratch/<feature>/spec.md`.

## 용어

- 코드 이름, 주석, 화면 문구, 문서는 `GLOSSARY.md`의 용어를 쓰고 각 항목의 _Avoid_ 목록에 있는 말은 쓰지 않는다.
- 용어의 쓰임이 넓어지거나(흐름 로그가 홈 밖에서도 쓰임) 새 개념이 생기면(링크 줄) 같은 변경에서 `GLOSSARY.md`를 고친다.

## 주석과 JSDoc

- 주석은 지금의 동작을 말한다. 동작을 바꾼 diff에서 그 동작을 설명하던 주석·JSDoc이 그대로면 결함으로 본다.
- 타입 JSDoc에 적은 값의 예(경로 모양 등)가 실제로 들어오는 값과 맞는지 본다. 넓어졌으면 타입을 나누거나 설명을 고친다.

## 단일 원본

- 페이지 ↔ 창 틀 계약의 원본은 에디터 루트(`<main id="editor">`)의 `data-file-*`와 개요 JSON이다. 같은 값을 다른 경로(props 등)로도 넘기면 그 이유와 "사본"임을 주석에 적는다.
- 토큰 값은 `src/design-system/tokens/`에만 쓴다. 문서(DESIGN.md, CLAUDE.md)는 값을 다시 적지 않고 파일을 가리킨다.
- 디자인 결정은 ADR, 시안 수치는 DESIGN.md, 작업 결정·측정값은 티켓 Comments에 둔다. 같은 결정을 두 곳에 풀어 쓰지 않는다.

## 디자인 시스템 컴포넌트

- 컴포넌트와 CSS는 의미 토큰(역할 이름)만 쓴다. 쓰임새 이름은 의미 토큰에, 값 이름은 원시 토큰에 둔다(ADR 0003).
- 디자인 시스템 안의 문구·URL·글 데이터는 props로 받는다. 블로그 고유 값(`src/site.ts` 등)을 컴포넌트 안에 하드코딩하지 않는다(ADR 0002, 다른 프로젝트에서 재사용).
- 새 컴포넌트는 Storybook 스토리를 함께 둔다. 두 테마에서 확인할 수 있어야 한다.

## 화면 이동

- 화면 이동·아일랜드 스크립트를 바꾼 diff는 `docs/agents/astro-client-router.md`의 규칙(이벤트 위임, `after-swap`/`page-load` 분리, SSR 가드, 서버 스냅샷)에 맞는지 본다.
