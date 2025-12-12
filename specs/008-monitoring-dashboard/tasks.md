# Tasks: 모니터링 대시보드

**Input**: Design documents from `/specs/008-monitoring-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 시각적 검증 + 수동 테스트로 대체 (헌법 I. Test-Smart 준수)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Story → Task Mapping

| User Story | Priority | 달성 목표 |
|------------|----------|-----------|
| US1: Core Web Vitals 실시간 확인 | P1 | LCP, INP, CLS 카드 표시 + 상태 색상 |
| US2: 추가 성능 지표 확인 | P2 | TTFB, FCP 섹션 표시 + 설명 툴팁 |
| US3: 리소스 로딩 분석 | P2 | 카테고리별 리소스 분석 + 차트 |
| US4: 네비게이션 타이밍 시각화 | P3 | 워터폴 타임라인 차트 |

---

## Phase 1: Setup (의존성 및 기본 구조)

**Purpose**: web-vitals 라이브러리 설치 및 기본 구조 생성

- [ ] T001 web-vitals 라이브러리 설치 (pnpm add web-vitals)
- [ ] T002 [P] 모니터링 컴포넌트 디렉토리 생성 (mkdir -p src/components/monitoring)
- [ ] T003 [P] performance 유틸리티 파일 생성 in src/utils/performance.ts
  - TypeScript 타입 정의 (MetricId, MetricStatus, ResourceType, TimingPhaseId)
  - 상수 정의 (METRIC_THRESHOLDS, STATUS_COLORS, TIMING_COLORS)
  - getMetricStatus() 함수 구현
  - JSDoc 문서화

**Checkpoint**: 의존성 설치 완료, 기본 유틸리티 함수 사용 가능

---

## Phase 2: Foundational (공통 컴포넌트)

**Purpose**: 모든 User Story에서 사용하는 기반 컴포넌트

- [ ] T004 MetricCard.astro 컴포넌트 생성 in src/components/monitoring/MetricCard.astro
  - Props: id, name, description, unit
  - 지표 값 표시 영역 (data-value attribute)
  - 상태 표시 영역 (data-status attribute)
  - 상태별 색상 스타일 (good/needs-improvement/poor/pending/unsupported)
  - 다크 모드 지원
  - 반응형 레이아웃
  - JSDoc 문서화

- [ ] T005 모니터링 페이지 기본 레이아웃 생성 in src/pages/monitoring.astro
  - BaseLayout 사용
  - Header 포함
  - 페이지 타이틀 및 설명 섹션
  - 섹션별 컨테이너 준비 (Core Web Vitals, Additional Metrics, Resources, Timing)
  - 반응형 그리드 레이아웃
  - SEO meta 태그

- [ ] T006 Header.astro에 Monitoring 탭 추가 in src/components/Header.astro
  - nav에 `/monitoring` 링크 추가

**Checkpoint**: 기본 페이지 구조 완료, /monitoring 접속 가능

---

## Phase 3: User Story 1 - Core Web Vitals 실시간 확인 (Priority: P1) MVP

**Goal**: LCP, INP, CLS 세 가지 핵심 지표를 카드 형태로 표시하고 상태 색상 적용

**Independent Test**: 모니터링 페이지 접속 시 LCP, INP, CLS 카드가 표시되고, 값 측정 후 상태 색상이 적용되는지 확인

### Implementation for User Story 1

- [ ] T007 [US1] CoreWebVitals.astro 컴포넌트 생성 in src/components/monitoring/CoreWebVitals.astro
  - MetricCard 3개 사용 (LCP, INP, CLS)
  - 섹션 타이틀 "Core Web Vitals"
  - 3열 그리드 레이아웃 (데스크톱), 1열 (모바일)
  - JSDoc 문서화

- [ ] T008 [US1] web-vitals 측정 로직 구현 in src/pages/monitoring.astro (client script)
  - web-vitals import (onLCP, onINP, onCLS)
  - 각 지표별 콜백에서 MetricCard 업데이트
  - getMetricStatus() 사용하여 상태 결정
  - 측정 중 상태 표시 ("측정 중...")
  - 5초 타임아웃 후 미지원 표시 처리
  - INP는 "인터랙션 대기 중" 상태 처리

- [ ] T009 [US1] monitoring.astro에 CoreWebVitals 컴포넌트 통합 in src/pages/monitoring.astro

**Checkpoint**: US1 완료 - Core Web Vitals 실시간 측정 및 표시 기능 동작

---

## Phase 4: User Story 2 - 추가 성능 지표 확인 (Priority: P2)

**Goal**: TTFB, FCP 추가 지표를 별도 섹션에 표시하고 설명 툴팁 제공

**Independent Test**: 모니터링 페이지에서 TTFB, FCP 지표가 표시되고 툴팁이 동작하는지 확인

### Implementation for User Story 2

- [ ] T010 [US2] AdditionalMetrics.astro 컴포넌트 생성 in src/components/monitoring/AdditionalMetrics.astro
  - MetricCard 2개 사용 (TTFB, FCP)
  - 섹션 타이틀 "Additional Metrics"
  - 2열 그리드 레이아웃 (데스크톱), 1열 (모바일)
  - 각 지표별 상세 설명 텍스트
  - JSDoc 문서화

- [ ] T011 [US2] TTFB, FCP 측정 로직 추가 in src/pages/monitoring.astro (client script)
  - web-vitals import 확장 (onTTFB, onFCP)
  - 측정 콜백에서 AdditionalMetrics 카드 업데이트

- [ ] T012 [US2] monitoring.astro에 AdditionalMetrics 컴포넌트 통합 in src/pages/monitoring.astro

**Checkpoint**: US2 완료 - 추가 성능 지표 표시 기능 동작

---

## Phase 5: User Story 3 - 리소스 로딩 분석 (Priority: P2)

**Goal**: 페이지 리소스를 카테고리별로 분류하여 개수와 용량 표시, 차트 시각화

**Independent Test**: 리소스 분석 섹션에서 JS/CSS/이미지/폰트/기타 카테고리별 정보와 차트가 표시되는지 확인

### Implementation for User Story 3

- [ ] T013 [US3] Resource Timing API 유틸리티 함수 추가 in src/utils/performance.ts
  - analyzeResources() 함수: Resource Timing API로 리소스 수집
  - getResourceType() 함수: initiatorType과 URL로 카테고리 분류
  - calculateResourceSummary() 함수: 카테고리별 집계
  - formatBytes() 함수: 바이트를 KB/MB로 변환

- [ ] T014 [US3] ResourceAnalysis.astro 컴포넌트 생성 in src/components/monitoring/ResourceAnalysis.astro
  - 섹션 타이틀 "Resource Analysis"
  - 카테고리별 리스트 (JS, CSS, Images, Fonts, Other)
  - 각 카테고리: 개수, 총 용량 표시
  - 막대 차트 (순수 CSS로 구현)
  - 전체 리소스 수 및 총 용량 요약
  - 다크 모드 지원
  - JSDoc 문서화

- [ ] T015 [US3] 리소스 분석 클라이언트 로직 구현 in src/pages/monitoring.astro (client script)
  - window.onload 또는 DOMContentLoaded에서 analyzeResources() 호출
  - ResourceAnalysis 컴포넌트 데이터 업데이트 (data attributes 또는 DOM 조작)

- [ ] T016 [US3] monitoring.astro에 ResourceAnalysis 컴포넌트 통합 in src/pages/monitoring.astro

**Checkpoint**: US3 완료 - 리소스 분석 기능 동작

---

## Phase 6: User Story 4 - 네비게이션 타이밍 시각화 (Priority: P3)

**Goal**: 페이지 로딩 단계별 타이밍을 워터폴 타임라인으로 시각화

**Independent Test**: 워터폴 차트에서 DNS, TCP, Request, Response, DOM, Load 단계가 타임라인으로 표시되는지 확인

### Implementation for User Story 4

- [ ] T017 [US4] Navigation Timing API 유틸리티 함수 추가 in src/utils/performance.ts
  - getNavigationTiming() 함수: Navigation Timing API로 단계별 시간 수집
  - calculateTimingPhases() 함수: 각 단계의 시작/종료/소요 시간 계산
  - TIMING_PHASES 상수: 단계별 이름, 설명, 색상 정의

- [ ] T018 [US4] NavigationTiming.astro 컴포넌트 생성 in src/components/monitoring/NavigationTiming.astro
  - 섹션 타이틀 "Navigation Timing"
  - 워터폴 타임라인 차트 (순수 CSS/HTML로 구현)
  - 각 단계별 막대 (left, width로 위치/크기 결정)
  - 단계별 색상 (TIMING_COLORS 사용)
  - 마우스 오버 시 툴팁 (단계명, 소요 시간)
  - 전체 로딩 시간 표시
  - 다크 모드 지원
  - JSDoc 문서화

- [ ] T019 [US4] 네비게이션 타이밍 클라이언트 로직 구현 in src/pages/monitoring.astro (client script)
  - 페이지 로드 완료 후 getNavigationTiming() 호출
  - NavigationTiming 컴포넌트 데이터 업데이트

- [ ] T020 [US4] monitoring.astro에 NavigationTiming 컴포넌트 통합 in src/pages/monitoring.astro

**Checkpoint**: US4 완료 - 네비게이션 타이밍 시각화 기능 동작

---

## Phase 7: Polish & Verification

**Purpose**: 전체 기능 검증 및 최종 정리

- [ ] T021 [P] 다크 모드 전환 테스트 - 모든 섹션에서 색상 정상 전환 확인
- [ ] T022 [P] 모바일 반응형 테스트 - 모든 섹션에서 레이아웃 정상 확인
- [ ] T023 [P] 브라우저 호환성 테스트 - Chrome, Firefox, Safari에서 기능 확인
- [ ] T024 빌드 테스트 실행 (pnpm build) - 빌드 성공 및 타입 체크 통과 확인
- [ ] T025 spec.md 상태를 Draft에서 Complete로 변경
- [ ] T026 커밋 생성: "feat: 모니터링 대시보드 페이지 추가"

**Checkpoint**: 모든 검증 완료 - 배포 준비 완료

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001-T003)
    ↓
Phase 2: Foundational (T004-T006)
    ↓
Phase 3-6: User Stories (병렬 가능하나 순차 권장)
    ↓
Phase 7: Polish (T021-T026)
```

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 가능 - MVP
- **US2 (P2)**: Phase 2 완료 후 시작 가능 - US1과 병렬 가능
- **US3 (P2)**: Phase 2 완료 후 시작 가능 - US1, US2와 병렬 가능
- **US4 (P3)**: Phase 2 완료 후 시작 가능 - 다른 US와 병렬 가능

### Within Each User Story

- 유틸리티 함수 → 컴포넌트 → 통합 순서

### Parallel Opportunities

**Phase 1 (병렬 가능):**
```
T002 (디렉토리 생성) || T003 (유틸리티 파일)
```

**Phase 7 (병렬 가능):**
```
T021 (다크 모드) || T022 (모바일) || T023 (브라우저 호환성)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T009)
4. **STOP and VALIDATE**: /monitoring 페이지에서 Core Web Vitals 확인
5. Deploy if ready - MVP 달성

### Incremental Delivery

1. Setup + Foundational → 기반 완료
2. Add US1 (Core Web Vitals) → Test → Deploy (MVP!)
3. Add US2 (Additional Metrics) → Test → Deploy
4. Add US3 (Resource Analysis) → Test → Deploy
5. Add US4 (Navigation Timing) → Test → Deploy
6. Polish → Final Deploy

---

## Summary

| 항목 | 값 |
|------|-----|
| **총 태스크 수** | 26 |
| **Setup 태스크** | 3 (T001-T003) |
| **Foundational 태스크** | 3 (T004-T006) |
| **US1 태스크** | 3 (T007-T009) |
| **US2 태스크** | 3 (T010-T012) |
| **US3 태스크** | 4 (T013-T016) |
| **US4 태스크** | 4 (T017-T020) |
| **Polish 태스크** | 6 (T021-T026) |
| **병렬 기회** | 5개 태스크 |
| **MVP 범위** | Phase 1-3 (9 태스크) |

---

## Notes

- web-vitals 라이브러리는 ~2KB로 가벼움
- 차트는 순수 CSS/HTML로 구현 (외부 라이브러리 없음)
- INP는 사용자 인터랙션 필요 - "인터랙션 대기 중" 상태 처리
- Safari는 LCP, CLS, INP 미지원 - Graceful Degradation 적용
- 모든 컴포넌트에 JSDoc 문서화 필수 (헌법 III. Documentation First)
