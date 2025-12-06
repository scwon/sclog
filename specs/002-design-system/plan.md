# Implementation Plan: 디자인 시스템 적용

**Branch**: `002-design-system` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-design-system/spec.md`

## Summary

CSS Custom Properties 기반 디자인 토큰 시스템을 구축하고, 라이트/다크 테마 스위칭 기능을 구현한다.
FOUC 방지를 위한 인라인 스크립트, localStorage 기반 테마 저장, prefers-color-scheme 감지를 포함한다.
브랜드 컬러 `rgb(233, 172, 159)`와 Roboto/Noto Sans KR 폰트를 적용한다.

## Technical Context

**Language/Version**: TypeScript 5.6, Astro 5.x
**Primary Dependencies**: Astro, @astrojs/mdx, Google Fonts (Roboto, Noto Sans KR)
**Storage**: localStorage (테마 저장), 폴백으로 sessionStorage
**Testing**: 시각적 검증 (UI 컴포넌트), `astro check` (타입)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - CSS Custom Properties 지원)
**Project Type**: Web (Astro SSG)
**Performance Goals**: 테마 전환 150ms 이내, FOUC 0ms (인라인 스크립트로 즉시 적용)
**Constraints**: IE11 미지원, localStorage 미지원 시 세션 폴백
**Scale/Scope**: 단일 블로그, 10개 미만 페이지, 5개 미만 컴포넌트

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 체크 | 비고 |
|------|------|------|
| I. Test-Smart | ✅ | UI 중심 기능으로 시각적 검증 적용, 테마 로직은 단순하여 별도 테스트 불필요 |
| II. Code Quality First | ✅ | TypeScript strict 모드, ESLint/Prettier 적용 |
| III. Documentation First | ✅ | JSDoc 주석 포함 |
| IV. SEO & Accessibility | ✅ | WCAG AA 가독성 기준 충족 (Design Tokens 명도대비 확인 필요) |
| V. Portfolio Showcase | ✅ | N/A (디자인 시스템은 기반 기능) |
| VI. Design System | ✅ | Constitution에 정의된 Design Tokens 그대로 적용 |

**Gate Status**: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-design-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Header.astro        # [NEW] 헤더 + 테마 토글 버튼
│   ├── ThemeToggle.astro   # [NEW] 테마 토글 버튼 컴포넌트
│   ├── BlogCard.astro      # [UPDATE] 디자인 토큰 적용
│   └── TagList.astro       # [UPDATE] 디자인 토큰 적용
├── layouts/
│   ├── BaseLayout.astro    # [UPDATE] 글로벌 스타일, 폰트, FOUC 방지 스크립트
│   └── BlogPost.astro      # [UPDATE] 디자인 토큰 적용
├── pages/
│   ├── index.astro         # [UPDATE] 헤더 추가
│   └── blog/*.astro        # [UPDATE] 헤더 추가
└── styles/
    └── global.css          # [NEW] 디자인 토큰 정의 (선택적, BaseLayout에 통합 가능)
```

**Structure Decision**: Astro 단일 프로젝트 구조 유지. 글로벌 스타일은 BaseLayout.astro에 통합하여 별도 CSS 파일 생성 최소화.

## Complexity Tracking

> **No violations. Design follows Constitution-defined tokens exactly.**

| 항목 | 결정 | 이유 |
|------|------|------|
| 별도 global.css | 불필요 | BaseLayout.astro에 `<style is:global>` 통합으로 충분 |
| 상태 관리 라이브러리 | 불필요 | localStorage + 인라인 스크립트로 단순 구현 |
| CSS-in-JS | 불필요 | Astro 컴포넌트 스타일 + CSS Custom Properties로 충분 |
