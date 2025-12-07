# Implementation Plan: 블로그 읽기 경험 개선

**Branch**: `004-reading-experience` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-reading-experience/spec.md`

## Summary

블로그 글 읽기 경험을 개선하기 위한 5개 핵심 기능 추가:
1. ~~읽기 시간 표시~~ (이미 구현됨 - `src/utils/blog.ts:getReadingTime`)
2. 목차(TOC) - 사이드 고정, 현재 섹션 하이라이트
3. 코드 복사 버튼 + 언어 라벨
4. 스크롤 진행률 바
5. 맨 위로 버튼

**기존 구현 확인**: 읽기 시간은 `BlogPost.astro`에서 이미 "N분 읽기"로 표시 중

## Technical Context

**Language/Version**: TypeScript 5.6, Astro 5.x
**Primary Dependencies**: Astro, @astrojs/mdx (이미 설치됨)
**Storage**: N/A (정적 사이트, localStorage로 상태 유지 불필요)
**Testing**: 시각적 검증 (UI 컴포넌트)
**Target Platform**: 웹 브라우저 (Chrome, Safari, Firefox)
**Project Type**: Single Astro project (SSG)
**Performance Goals**: 60fps 스크롤, Core Web Vitals 준수
**Constraints**: JS 비활성화 시에도 콘텐츠 정상 표시 (progressive enhancement)
**Scale/Scope**: 블로그 글 페이지에만 적용

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 적용 | 상태 |
|------|------|------|
| I. Test-Smart | UI 컴포넌트는 시각적 검증, 유틸 함수만 테스트 대상 | ✅ |
| II. Code Quality First | TypeScript strict, ESLint 준수 | ✅ |
| III. Documentation First | 새 컴포넌트에 JSDoc 추가 | ✅ |
| IV. SEO & Accessibility | 키보드 네비게이션, 시맨틱 HTML | ✅ |
| V. Portfolio Showcase | N/A (이 기능은 시연 아님) | ✅ |
| VI. Design System | 브랜드 컬러, 폰트, 테마 토큰 사용 | ✅ |

**게이트 통과**: 모든 원칙 준수

## Project Structure

### Documentation (this feature)

```text
specs/004-reading-experience/
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
│   ├── blog/
│   │   ├── TableOfContents.astro    # 목차 컴포넌트
│   │   ├── CodeBlock.astro          # 코드 복사 + 언어 라벨
│   │   ├── ProgressBar.astro        # 스크롤 진행률 바
│   │   └── ScrollToTop.astro        # 맨 위로 버튼
│   └── ... (기존 컴포넌트)
├── layouts/
│   └── BlogPost.astro               # 수정: TOC, ProgressBar 통합
└── utils/
    └── blog.ts                      # 기존 (getReadingTime 이미 있음)
```

**Structure Decision**: 블로그 전용 컴포넌트는 `src/components/blog/` 하위에 그룹화하여 관리

## Complexity Tracking

> 헌법 위반 없음 - 이 섹션 생략
