# Quickstart: 모니터링 대시보드

**Feature**: 008-monitoring-dashboard
**Date**: 2025-12-12

## Prerequisites

- Node.js 18+
- pnpm 설치
- 프로젝트 클론 및 의존성 설치 완료

## 1. 의존성 설치

```bash
# web-vitals 라이브러리 추가
pnpm add web-vitals
```

## 2. 파일 구조 생성

```bash
# 모니터링 컴포넌트 디렉토리 생성
mkdir -p src/components/monitoring
```

### 생성할 파일 목록

| 파일 | 설명 |
|------|------|
| `src/pages/monitoring.astro` | 모니터링 페이지 |
| `src/components/monitoring/MetricCard.astro` | 지표 카드 컴포넌트 |
| `src/components/monitoring/CoreWebVitals.astro` | Core Web Vitals 섹션 |
| `src/components/monitoring/AdditionalMetrics.astro` | 추가 지표 섹션 |
| `src/components/monitoring/ResourceAnalysis.astro` | 리소스 분석 섹션 |
| `src/components/monitoring/NavigationTiming.astro` | 타이밍 시각화 섹션 |
| `src/utils/performance.ts` | Performance API 유틸리티 |

## 3. 핵심 코드 스니펫

### 3.1 Performance 유틸리티 (src/utils/performance.ts)

```typescript
import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals';

export type MetricStatus = 'good' | 'needs-improvement' | 'poor';

export const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
} as const;

export function getMetricStatus(
  metricId: keyof typeof THRESHOLDS,
  value: number
): MetricStatus {
  const threshold = THRESHOLDS[metricId];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function initWebVitals(callback: (metric: Metric) => void): void {
  onLCP(callback);
  onINP(callback);
  onCLS(callback);
  onFCP(callback);
  onTTFB(callback);
}
```

### 3.2 MetricCard 컴포넌트 기본 구조

```astro
---
interface Props {
  id: string;
  name: string;
  description: string;
  unit: string;
}

const { id, name, description, unit } = Astro.props;
---

<div class="metric-card" data-metric-id={id}>
  <div class="metric-header">
    <h3 class="metric-name">{name}</h3>
    <span class="metric-status" data-status="pending">측정 중...</span>
  </div>
  <div class="metric-value" data-value>--</div>
  <div class="metric-unit">{unit}</div>
  <p class="metric-description">{description}</p>
</div>

<style>
  .metric-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 1.5rem;
  }
  /* ... 추가 스타일 */
</style>
```

### 3.3 클라이언트 스크립트 (페이지 내)

```html
<script>
  import { initWebVitals, getMetricStatus } from '../utils/performance';

  initWebVitals((metric) => {
    const card = document.querySelector(`[data-metric-id="${metric.name.toLowerCase()}"]`);
    if (!card) return;

    const valueEl = card.querySelector('[data-value]');
    const statusEl = card.querySelector('[data-status]');

    if (valueEl) {
      valueEl.textContent = metric.name === 'CLS'
        ? metric.value.toFixed(3)
        : `${Math.round(metric.value)}`;
    }

    if (statusEl) {
      const status = getMetricStatus(metric.name.toLowerCase(), metric.value);
      statusEl.dataset.status = status;
      statusEl.textContent = status === 'good' ? '좋음'
        : status === 'needs-improvement' ? '개선 필요'
        : '나쁨';
    }
  });
</script>
```

## 4. 헤더에 Monitoring 탭 추가

`src/components/Header.astro` 수정:

```astro
<nav class="nav">
  <a href="/blog">Blog</a>
  <a href="/blog/tags">Tags</a>
  <a href="/monitoring">Monitoring</a>  <!-- 추가 -->
</nav>
```

## 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:4321/monitoring` 접속

## 6. 빌드 및 검증

```bash
# 타입 체크
pnpm astro check

# 빌드
pnpm build
```

## 7. 테스트 체크리스트

- [ ] /monitoring 페이지 접근 가능
- [ ] Core Web Vitals (LCP, INP, CLS) 카드 표시
- [ ] 추가 지표 (FCP, TTFB) 카드 표시
- [ ] 상태 색상 정상 표시 (녹색/노란색/빨간색)
- [ ] 리소스 분석 섹션 표시
- [ ] 네비게이션 타이밍 시각화 표시
- [ ] 다크 모드 전환 시 UI 정상
- [ ] 모바일 반응형 레이아웃 정상
- [ ] Safari에서 미지원 지표 "지원되지 않음" 표시

## Troubleshooting

### INP가 표시되지 않음
INP(Interaction to Next Paint)는 사용자 인터랙션(클릭, 탭) 후에만 측정됩니다. 페이지 내 요소를 클릭해보세요.

### Safari에서 지표가 표시되지 않음
Safari는 LCP, CLS, INP를 지원하지 않습니다. FCP와 TTFB만 표시됩니다.

### 리소스 크기가 0으로 표시됨
캐시된 리소스는 transferSize가 0입니다. 캐시를 비우고 새로고침하세요.

## Reference

- [web-vitals 라이브러리](https://github.com/GoogleChrome/web-vitals)
- [Core Web Vitals](https://web.dev/vitals/)
- [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
- [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)
