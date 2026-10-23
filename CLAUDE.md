# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # 개발 서버 (localhost:4321)
pnpm build            # 타입 체크 + 빌드
pnpm astro check      # 타입 체크만
pnpm storybook        # Storybook (localhost:6006)
pnpm test             # Vitest 단발 실행 (watch: pnpm test:watch)
```

## Project Context

Personal blog built with Astro, TypeScript, and MDX. 버전은 `package.json`이 기준이다. Features are developed using Speckit workflow (`specs/` directory).

## Tech Stack

- **Framework**: Astro (static site generation)
- **Language**: TypeScript (strict mode)
- **Content**: MDX via @astrojs/mdx
- **UI Components**: React + shadcn/ui (Radix + Tailwind)
- **Styling**: Tailwind CSS (utility-first)
- **Component Dev**: Storybook (`src/**/*.stories.tsx`)
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm
- **Deployment**: Vercel (Edge Runtime compatible)

## Coding Conventions

- `any` 타입 사용 금지
- 모든 export 함수/컴포넌트에 JSDoc 작성
- Conventional Commits 형식 사용 (`feat:`, `fix:`, `chore:`)
- 빌드 전 `pnpm astro check` 통과 필수

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
| 스킬 | `storybook-stories`, `astro-components`, `design-tokens`, `content-schema`, `blog-writing` | 이 저장소 | 프로젝트 규칙 |

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
