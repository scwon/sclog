# Implementation Plan: 포트폴리오 홈페이지

**Branch**: `003-portfolio-home` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-portfolio-home/spec.md`

## Summary

기존 SCLOG 홈페이지를 포트폴리오 페이지로 확장한다. 현재 "최근 글" 섹션만 있는 페이지에 프로필 섹션(사진, 이름, 소개), 소셜 링크(GitHub, LinkedIn, Instagram, 이메일), 이력/경력 섹션을 추가한다. 기존 Astro 컴포넌트 구조를 활용하고, 헌법의 Design System 원칙을 준수한다.

## Technical Context

**Language/Version**: TypeScript 5.6, Astro 5.x
**Primary Dependencies**: Astro, @astrojs/mdx
**Storage**: 정적 데이터 (TypeScript 상수 또는 JSON)
**Testing**: 시각적 검증 (UI 컴포넌트), astro check (타입 체크)
**Target Platform**: Web (SSG - Static Site Generation)
**Project Type**: Single project (Astro SSG)
**Performance Goals**: Core Web Vitals (LCP < 2.5s, CLS < 0.1)
**Constraints**: 반응형 (320px ~ 1920px), 라이트/다크 테마 지원
**Scale/Scope**: 단일 페이지 확장, 4개 섹션 추가

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 적용 사항 |
|------|------|-----------|
| I. Test-Smart | ✅ | UI 컴포넌트는 시각적 검증으로 대체, 핵심 로직 없음 |
| II. Code Quality First | ✅ | ESLint, Prettier, TypeScript strict 모드 적용 |
| III. Documentation First | ✅ | 컴포넌트에 JSDoc 추가 |
| IV. SEO & Accessibility | ✅ | meta 태그, 시맨틱 HTML, alt 텍스트, 키보드 네비게이션 |
| V. Portfolio Showcase | ✅ | 포트폴리오 목적에 부합 |
| VI. Design System | ✅ | 브랜드 컬러, 타이포그래피, 레이아웃 토큰 사용 |

**Gate Result**: ✅ PASS - 모든 원칙 준수 가능

## Project Structure

### Documentation (this feature)

```text
specs/003-portfolio-home/
├── plan.md              # 이 파일
├── research.md          # Phase 0 - 기술 조사
├── data-model.md        # Phase 1 - 데이터 모델
├── quickstart.md        # Phase 1 - 빠른 시작 가이드
└── checklists/
    └── requirements.md  # 명세 품질 체크리스트
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Header.astro          # 기존
│   ├── BlogCard.astro        # 기존
│   ├── ProfileSection.astro  # 신규: 프로필 섹션
│   ├── SocialLinks.astro     # 신규: 소셜 링크
│   ├── CareerSection.astro   # 신규: 경력 섹션
│   └── RecentPosts.astro     # 신규: 최근 글 섹션 (기존 로직 추출)
├── data/
│   └── profile.ts            # 신규: 프로필/경력 데이터
├── layouts/
│   └── BaseLayout.astro      # 기존
├── pages/
│   └── index.astro           # 수정: 홈페이지 확장
└── utils/
    └── blog.ts               # 기존
```

**Structure Decision**: 기존 Astro 프로젝트 구조 유지. 새 컴포넌트는 `src/components/`에 추가하고, 프로필 데이터는 `src/data/`에 분리하여 관리.

## Complexity Tracking

> 헌법 위반 없음 - 이 섹션은 비어 있음

---

*Phase 0, Phase 1 산출물은 별도 파일로 생성됨*
