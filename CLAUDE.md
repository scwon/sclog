# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # 개발 서버 (localhost:4321)
pnpm build            # 타입 체크 + 빌드
pnpm astro check      # 타입 체크만
pnpm storybook        # Storybook (localhost:6006)
pnpm test             # Vitest 단발 실행 (watch: pnpm test:watch)
pnpm lint             # Oxlint
pnpm format           # Oxfmt로 포맷 적용 (검사만: pnpm format:check)
pnpm verify           # CI와 같은 다섯 검사(lint·format:check·build·test·build-storybook). 커밋 전 훅은 lint·format:check만 돈다
pnpm qa               # 빌드 뒤 ego-browser로 접근성(모든 페이지×두 테마×세 폭)과 화면 이동 시나리오 확인. 화면·이동을 바꿨으면 돌린다. 작업 트리 여럿에서 함께 돌리면 `QA_PORT=43NN pnpm qa`
uv run scripts/subset-maruburi.py  # 마루 부리 서브셋 재생성 (빌드에 포함 안 함, 글꼴을 바꿀 때만)
```

## Project Context

Personal blog built with Astro, TypeScript, and MDX. 버전은 `package.json`이 기준이다. 기능 작업은 `.scratch/<feature>/`의 스펙·티켓으로 진행한다(아래 Issue tracker). `specs/`는 이전 Speckit 산출물과 디자인 시안(`specs/010-blog-renewal/prototype/`)이다.

## Tech Stack

- **Framework**: Astro (static site generation)
- **Language**: TypeScript (strict mode)
- **Content**: MDX via @astrojs/mdx
- **MDX 처리**: Astro 7 기본 처리기 Sätteri(`satteri`, `@astrojs/markdown-satteri`)가 그린다. 사용자 hast 단계는 `astro.config.mjs`의 `satteri({ hastPlugins })`에 둔다. rehype 플러그인은 걸리지 않고 무시된다
- **UI Components**: React + shadcn/ui (Radix + Tailwind)
- **Design System**: `src/design-system/` (토큰 → CSS → React 컴포넌트 → Storybook). 소비자(`src/layouts`·`src/components`·`src/pages`)는 `src/design-system/index.ts`와 CSS 진입점만 쓴다. 토큰 값은 `tokens/`의 파일이 원본이고 여기에 적지 않는다. 구조는 ADR 0002·0003, 용어는 `GLOSSARY.md`
- **State**: nanostores(`nanostores`, `@nanostores/react`). 아일랜드 사이 공유 상태(테마·탭·읽기 위치)는 디자인 시스템 `stores/`에 둔다
- **Styling**: Tailwind CSS (utility-first)
- **Component Dev**: Storybook (`src/**/*.stories.tsx`)
- **Testing**: Vitest (node 환경). 화면 확인은 `scripts/qa/`(ego-browser + axe-core)
- **Lint/Format**: Oxlint + Oxfmt (`.astro` 포맷, Tailwind 클래스 정렬 포함)
- **Package Manager**: pnpm 12. 로컬 Node·pnpm 버전은 mise가 `package.json` 기준으로 맞춘다
- **Deployment**: Vercel (Edge Runtime compatible)

## Coding Conventions

- 모든 export 함수/컴포넌트에 JSDoc 작성
- Conventional Commits 형식 사용 (`feat:`, `fix:`, `chore:`)
- 클래스 합치기는 `@/lib/utils`의 `cn`(shadcn `cn` 패키지)을 쓴다
- 리뷰가 적용하는 판단 규칙은 `CODING_STANDARDS.md`
- 화면 이동(`ClientRouter`)·아일랜드·페이지 스크립트를 고칠 때는 `docs/agents/astro-client-router.md`를 먼저 읽는다
- 단축키를 붙이거나 키 처리를 고칠 때는 `docs/agents/shortcuts.md`를 먼저 읽는다

## Library Selection

검증된 라이브러리를 우선 사용하고 커스텀 구현을 피한다:
- 날짜 처리: `date-fns`
- 스키마 검증: `zod`
- 성능 측정: `web-vitals`

새로운 라이브러리 추가 시 번들 사이즈와 tree-shaking 지원 여부를 고려한다.

## Agent Harness

MCP 서버·플러그인·스킬은 항상 프로젝트 레벨로 설치한다: `.mcp.json`, `.claude/settings.json`의 `enabledPlugins`, `.claude/skills/`. 사용자 레벨에 설치하지 않는다. 새로 추가할 때는 공식 배포처이고 최근 3개월 안에 유지보수된 것만 고른다.

| 종류 | 이름 | 출처 | 쓰는 때 |
| --- | --- | --- | --- |
| MCP | `astro-docs` | Astro 공식 원격 서버 | Astro API·설정 확인 (문서·저장소 모두 v7) |
| MCP | `shadcn` | shadcn CLI | 레지스트리 검색, 컴포넌트 추가 |
| 플러그인 | `frontend-design` | Anthropic 공식 마켓 | 화면 디자인 품질 |
| 플러그인 | `modern-web-guidance` | Google Chrome (공식 마켓) | 최신 HTML·CSS·Web API 패턴 |
| 스킬 | `shadcn` | shadcn/ui | 컴포넌트 추가·테마·레지스트리 |
| 스킬 | `web-design-guidelines` | Vercel Labs | UI·접근성 점검 |
| 스킬 | `vercel-composition-patterns` | Vercel Labs | React 컴포넌트 API 설계 |

- 외부 스킬은 `skills` CLI로 받은 사본이며 `skills-lock.json`이 출처와 해시를 기록한다. 갱신: `pnpm dlx skills@1.7.4 update -p`
- 브라우저 확인은 ego-browser를 쓴다. Playwright·Chrome DevTools MCP는 추가하지 않는다.

## Adding New Tech/Skills

작업 중 새로운 기술이나 구조가 필요한 경우:
1. 작업을 멈추고 사용자에게 필요성 설명
2. 사용자와 논의 후 결정
3. 결정된 내용을 CLAUDE.md 또는 새 skill로 추가
4. 작업 계속

## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature-slug>/` (spec.md + issues/NN-slug.md). Speckit's `specs/` is separate. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root (created lazily) + `docs/adr/`. See `docs/agents/domain.md`.
