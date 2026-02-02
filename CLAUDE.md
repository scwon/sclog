# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # 개발 서버 (localhost:4321)
pnpm build            # 타입 체크 + 빌드
pnpm astro check      # 타입 체크만
pnpm storybook        # Storybook (localhost:6006)
pnpm test             # Vitest 테스트
```

## Project Context

Personal blog built with Astro 5.x, TypeScript, and MDX. Features are developed using Speckit workflow (`specs/` directory).

## Tech Stack

- **Framework**: Astro 5.x (static site generation)
- **Language**: TypeScript 5.6 (strict mode)
- **Content**: MDX via @astrojs/mdx
- **UI Components**: React 19 + shadcn/ui (Radix + Tailwind)
- **Styling**: Tailwind CSS 4 (utility-first)
- **Component Dev**: Storybook 10 (`src/**/*.stories.tsx`)
- **Testing**: Vitest 4 + Testing Library
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

## Adding New Tech/Skills

작업 중 새로운 기술이나 구조가 필요한 경우:
1. 작업을 멈추고 사용자에게 필요성 설명
2. 사용자와 논의 후 결정
3. 결정된 내용을 CLAUDE.md 또는 새 skill로 추가
4. 작업 계속
