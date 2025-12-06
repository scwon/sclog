# Implementation Plan: MDX 기반 블로그 포스트 시스템

**Branch**: `001-mdx-blog-post` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mdx-blog-post/spec.md`

## Summary

MDX 형식의 블로그 포스트 시스템을 구현한다. Astro Content Collections를 활용하여 타입 안전한 MDX 콘텐츠 관리, 구문 강조가 적용된 코드 블록, 태그 기반 분류, SEO 최적화된 메타 태그를 제공한다. 정적 사이트 생성(SSG) 방식으로 빌드 타임에 모든 페이지를 생성한다.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Astro 5.x, @astrojs/mdx, @astrojs/sitemap
**Storage**: 파일 시스템 (MDX 파일)
**Testing**: 시각적 검증 + astro check (타입 검사)
**Target Platform**: 정적 웹사이트 (CDN 배포)
**Project Type**: Single (Astro SSG)
**Performance Goals**: LCP < 1초, Lighthouse SEO 90+
**Constraints**: 빌드 타임 처리, 런타임 서버 없음
**Scale/Scope**: 100+ 블로그 글 지원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-Smart | ✅ PASS | 핵심 유틸리티(날짜 필터링 등)에 테스트 적용, UI는 시각적 검증 |
| II. Code Quality First | ✅ PASS | TypeScript strict 모드, ESLint/Prettier 적용 |
| III. Documentation First | ✅ PASS | 컴포넌트에 JSDoc, 설정 파일에 주석 포함 |
| IV. SEO & Accessibility | ✅ PASS | 모든 페이지에 메타 태그, 시맨틱 HTML, alt 텍스트 |
| V. Portfolio Showcase | N/A | 이 기능은 블로그 시스템 (시연 페이지는 별도 기능) |

## Project Structure

### Documentation (this feature)

```text
specs/001-mdx-blog-post/
├── plan.md              # 이 파일
├── spec.md              # 기능 명세
├── research.md          # 기술 리서치
├── data-model.md        # 데이터 모델
├── quickstart.md        # 빠른 시작 가이드
├── contracts/
│   └── routes.md        # 라우트 계약
└── checklists/
    └── requirements.md  # 요구사항 체크리스트
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── config.ts            # Content Collections 스키마
│   └── blog/                # MDX 블로그 글
│       └── *.mdx
├── layouts/
│   └── BlogPost.astro       # 블로그 글 레이아웃
├── pages/
│   └── blog/
│       ├── index.astro      # 블로그 목록
│       ├── [slug].astro     # 블로그 상세
│       └── tags/
│           ├── index.astro  # 태그 목록
│           └── [tag].astro  # 태그별 글 목록
├── components/
│   ├── BlogCard.astro       # 글 카드 컴포넌트
│   ├── TagList.astro        # 태그 목록 컴포넌트
│   └── SEO.astro            # SEO 메타 태그 컴포넌트
└── utils/
    └── blog.ts              # 블로그 유틸리티 함수

public/
└── images/                  # 블로그 이미지
```

**Structure Decision**: Astro 표준 구조를 따르며, Content Collections를 활용한 파일 기반 콘텐츠 관리 방식 채택.

## Implementation Phases

### Phase 1: 기반 구조 (User Story 1 - P1)

1. @astrojs/mdx, @astrojs/sitemap 통합 설치 및 설정
2. Content Collections 스키마 정의 (`src/content/config.ts`)
3. 블로그 글 레이아웃 생성 (`BlogPost.astro`)
4. 블로그 상세 페이지 (`/blog/[slug]`)
5. 샘플 MDX 글 작성 및 검증

### Phase 2: 목록 및 SEO (User Story 2, 4 - P2)

1. 블로그 목록 페이지 (`/blog`)
2. BlogCard 컴포넌트
3. SEO 컴포넌트 (메타 태그)
4. 사이트맵 생성 확인

### Phase 3: 태그 시스템 (User Story 3 - P3)

1. TagList 컴포넌트
2. 태그 목록 페이지 (`/blog/tags`)
3. 태그별 글 목록 페이지 (`/blog/tags/[tag]`)
4. 글 상세 페이지에 태그 표시

### Phase 4: 마무리

1. 예약 발행 필터링 (미래 날짜 글 숨김)
2. 코드 스타일링 및 UI 개선
3. Lighthouse 점수 확인 및 최적화

## Complexity Tracking

> 헌법 위반 사항 없음. 단순한 구조 유지.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (없음) | - | - |
