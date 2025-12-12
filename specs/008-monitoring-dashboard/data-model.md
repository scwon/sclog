# Data Model: 모니터링 대시보드

**Feature**: 008-monitoring-dashboard
**Date**: 2025-12-12

## Overview

모니터링 대시보드는 외부 저장소 없이 클라이언트 측에서만 동작하므로, 이 데이터 모델은 **런타임 데이터 구조**를 정의한다. 데이터베이스 스키마가 아닌 TypeScript 인터페이스로 표현된다.

---

## Core Entities

### 1. PerformanceMetric (성능 지표)

개별 성능 지표의 측정 값을 표현한다.

```typescript
interface PerformanceMetric {
  /** 지표 식별자 (lcp, inp, cls, fcp, ttfb) */
  id: MetricId;
  /** 지표 표시명 */
  name: string;
  /** 측정값 (밀리초 또는 점수) */
  value: number | null;
  /** 측정 단위 */
  unit: 'ms' | 's' | 'score';
  /** 상태 (좋음/개선필요/나쁨) */
  status: MetricStatus;
  /** 지표 설명 */
  description: string;
  /** 측정 완료 여부 */
  isMeasured: boolean;
  /** 브라우저 지원 여부 */
  isSupported: boolean;
}

type MetricId = 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb';
type MetricStatus = 'good' | 'needs-improvement' | 'poor' | 'pending' | 'unsupported';
```

### 2. ResourceEntry (리소스 항목)

로딩된 개별 리소스 정보를 표현한다.

```typescript
interface ResourceEntry {
  /** 리소스 URL */
  url: string;
  /** 리소스 유형 */
  type: ResourceType;
  /** 전송 크기 (bytes) */
  transferSize: number;
  /** 압축 해제 크기 (bytes) */
  decodedSize: number;
  /** 로딩 시간 (ms) */
  duration: number;
  /** initiator 유형 */
  initiatorType: string;
}

type ResourceType = 'JavaScript' | 'CSS' | 'Images' | 'Fonts' | 'Other';
```

### 3. ResourceSummary (리소스 요약)

카테고리별 리소스 집계 정보를 표현한다.

```typescript
interface ResourceSummary {
  /** 리소스 유형 */
  type: ResourceType;
  /** 리소스 개수 */
  count: number;
  /** 총 전송 크기 (bytes) */
  totalSize: number;
  /** 총 로딩 시간 (ms) */
  totalDuration: number;
  /** 전체 대비 비율 (0-1) */
  percentage: number;
}
```

### 4. TimingPhase (타이밍 단계)

네비게이션 타이밍의 각 단계를 표현한다.

```typescript
interface TimingPhase {
  /** 단계 식별자 */
  id: TimingPhaseId;
  /** 단계 표시명 */
  name: string;
  /** 단계 설명 */
  description: string;
  /** 시작 시간 (ms, navigationStart 기준) */
  start: number;
  /** 종료 시간 (ms) */
  end: number;
  /** 소요 시간 (ms) */
  duration: number;
  /** 시각화 색상 */
  color: string;
}

type TimingPhaseId =
  | 'dns'
  | 'tcp'
  | 'ssl'
  | 'request'
  | 'response'
  | 'dom'
  | 'load';
```

---

## Aggregate Types

### DashboardState (대시보드 전체 상태)

모니터링 대시보드의 전체 상태를 관리한다.

```typescript
interface DashboardState {
  /** Core Web Vitals 지표 */
  coreWebVitals: {
    lcp: PerformanceMetric;
    inp: PerformanceMetric;
    cls: PerformanceMetric;
  };
  /** 추가 성능 지표 */
  additionalMetrics: {
    fcp: PerformanceMetric;
    ttfb: PerformanceMetric;
  };
  /** 리소스 분석 결과 */
  resources: {
    entries: ResourceEntry[];
    summary: ResourceSummary[];
    totalCount: number;
    totalSize: number;
  };
  /** 네비게이션 타이밍 */
  timing: {
    phases: TimingPhase[];
    totalDuration: number;
  };
  /** 측정 상태 */
  measurementStatus: 'idle' | 'measuring' | 'complete';
  /** 마지막 업데이트 시간 */
  lastUpdated: Date | null;
}
```

---

## Constants

### 지표 임계값 (Google 기준)

```typescript
const METRIC_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },      // ms
  inp: { good: 200, poor: 500 },         // ms
  cls: { good: 0.1, poor: 0.25 },        // score
  fcp: { good: 1800, poor: 3000 },       // ms
  ttfb: { good: 800, poor: 1800 },       // ms
} as const;
```

### 상태 색상

```typescript
const STATUS_COLORS = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
  pending: '#6b7280',
  unsupported: '#9ca3af',
} as const;
```

### 타이밍 단계 색상

```typescript
const TIMING_COLORS = {
  dns: '#4ade80',      // green
  tcp: '#60a5fa',      // blue
  ssl: '#a78bfa',      // purple
  request: '#fbbf24',  // yellow
  response: '#f97316', // orange
  dom: '#ec4899',      // pink
  load: '#14b8a6',     // teal
} as const;
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser APIs                              │
├─────────────────────────────────────────────────────────────┤
│  web-vitals    │  Resource Timing  │  Navigation Timing     │
│  (onLCP, etc.) │  API              │  API                   │
└───────┬────────┴────────┬──────────┴──────────┬─────────────┘
        │                 │                     │
        ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              performance.ts (유틸리티)                        │
│  - measureCoreWebVitals()                                    │
│  - analyzeResources()                                        │
│  - getNavigationTiming()                                     │
│  - getMetricStatus()                                         │
└───────┬────────────────────────────────────────┬─────────────┘
        │                                        │
        ▼                                        ▼
┌───────────────────┐                ┌─────────────────────────┐
│   Astro 컴포넌트   │                │    클라이언트 스크립트    │
│   (초기 렌더링)     │                │    (동적 업데이트)        │
└───────────────────┘                └─────────────────────────┘
```

---

## Validation Rules

### PerformanceMetric

- `value`: null (측정 전/미지원) 또는 0 이상의 숫자
- `status`: value가 null이면 'pending' 또는 'unsupported'

### ResourceEntry

- `transferSize`: 0 이상 (0은 캐시된 리소스)
- `duration`: 0 이상

### TimingPhase

- `start` ≤ `end`
- `duration` = `end` - `start`

---

## Notes

- 모든 데이터는 페이지 로드 시점에 측정되며 저장되지 않음
- INP(Interaction to Next Paint)는 사용자 인터랙션 후에만 측정 가능
- Safari에서는 일부 지표(LCP, CLS, INP)가 지원되지 않음
