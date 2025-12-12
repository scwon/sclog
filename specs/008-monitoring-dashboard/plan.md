# Implementation Plan: 모니터링 대시보드

**Branch**: `008-monitoring-dashboard` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-monitoring-dashboard/spec.md`

## Summary

블로그의 실시간 성능 정보를 보여주는 대시보드 페이지를 구현한다. Web Performance API를 활용하여 Core Web Vitals (LCP, INP, CLS), 추가 지표 (TTFB, FCP), 리소스 분석, 네비게이션 타이밍을 순수 클라이언트 사이드에서 측정하고 시각화한다. 외부 저장소나 유료 서비스 없이 브라우저 API만 사용한다.

## Technical Context

**Language/Version**: TypeScript 5.6, Astro 5.x
**Primary Dependencies**: Astro (이미 설치됨), web-vitals (Core Web Vitals 측정용 - 선택적)
**Storage**: N/A (클라이언트 측 실시간 측정, 데이터 저장 없음)
**Testing**: 시각적 검증 + 수동 테스트 (헌법 I. Test-Smart 준수)
**Target Platform**: 최신 브라우저 (Chrome, Edge, Firefox, Safari)
**Project Type**: Web (Astro SSG)
**Performance Goals**: 모니터링 페이지 로딩 2초 이내, Core Web Vitals 표시 3초 이내
**Constraints**: 외부 API 호출 0건, 순수 클라이언트 측정
**Scale/Scope**: 단일 페이지 (/monitoring), 컴포넌트 4-6개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| I. Test-Smart | ✅ PASS | 핵심 로직(지표 계산)이 브라우저 API 직접 호출이므로 단위 테스트 불필요. 시각적 검증으로 대체. |
| II. Code Quality First | ✅ PASS | TypeScript strict 모드, ESLint, Prettier 적용 |
| III. Documentation First | ✅ PASS | 모든 컴포넌트와 유틸리티 함수에 JSDoc 작성 |
| IV. SEO & Accessibility | ✅ PASS | 시맨틱 HTML, aria 라벨, 키보드 네비게이션 지원 |
| V. Portfolio Showcase | ✅ PASS | 모니터링 회사 경력 어필용 인터랙티브 시연 페이지 |
| VI. Design System | ✅ PASS | 기존 디자인 토큰 활용, 다크 모드 지원 |

## Project Structure

### Documentation (this feature)

```text
specs/008-monitoring-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - 내부 API 없음)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Header.astro              # 기존 헤더 (Monitoring 탭 추가)
│   └── monitoring/               # 모니터링 전용 컴포넌트
│       ├── MetricCard.astro          # 개별 지표 카드
│       ├── CoreWebVitals.astro       # LCP, INP, CLS 섹션
│       ├── AdditionalMetrics.astro   # TTFB, FCP 섹션
│       ├── ResourceAnalysis.astro    # 리소스 분석 섹션
│       └── NavigationTiming.astro    # 워터폴 타이밍 섹션
├── pages/
│   └── monitoring.astro          # 모니터링 페이지
├── utils/
│   └── performance.ts            # Performance API 유틸리티
└── layouts/
    └── BaseLayout.astro          # 기존 레이아웃 재사용
```

**Structure Decision**: 기존 Astro 프로젝트 구조 유지. `src/components/monitoring/` 디렉토리에 모니터링 전용 컴포넌트를 모아 관리. 새로운 페이지는 `src/pages/monitoring.astro`로 생성.

## Complexity Tracking

> Constitution Check 통과 - 위반 사항 없음
