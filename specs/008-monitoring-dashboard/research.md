# Research: 모니터링 대시보드

**Feature**: 008-monitoring-dashboard
**Date**: 2025-12-12

## Research Tasks

1. Web Performance API로 Core Web Vitals 측정 방법
2. 브라우저별 Performance API 지원 현황
3. 차트 시각화 구현 방법 (외부 라이브러리 없이)
4. web-vitals 라이브러리 vs 직접 구현 비교

---

## 1. Core Web Vitals 측정 방법

### Decision: web-vitals 라이브러리 사용

### Rationale

- Google에서 공식 제공하는 라이브러리로 정확도 보장
- 가볍고 tree-shakeable (각 지표별 ~1KB)
- 브라우저 호환성 처리가 내장되어 있음
- PerformanceObserver 설정의 복잡성을 추상화

### Alternatives Considered

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| web-vitals 라이브러리 | 정확도, 유지보수 불필요 | 외부 의존성 | ✅ 선택 |
| 직접 PerformanceObserver 구현 | 의존성 없음 | 복잡한 edge case 처리 필요 | ❌ |
| Performance API 직접 호출 | 단순함 | 일부 지표(INP) 측정 불가 | ❌ |

### Core Web Vitals 측정 API

```typescript
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

// 각 지표별 콜백으로 값 수신
onLCP(metric => console.log('LCP:', metric.value));
onINP(metric => console.log('INP:', metric.value));
onCLS(metric => console.log('CLS:', metric.value));
onFCP(metric => console.log('FCP:', metric.value));
onTTFB(metric => console.log('TTFB:', metric.value));
```

---

## 2. 브라우저별 Performance API 지원 현황

### Decision: Graceful Degradation 적용

### Rationale

- Chrome/Edge: 모든 지표 완벽 지원
- Firefox: LCP, CLS, FCP, TTFB 지원. INP 미지원
- Safari: FCP, TTFB만 지원. LCP, CLS, INP 미지원

### Support Matrix

| 지표 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| LCP | ✅ | ✅ | ✅ | ❌ |
| INP | ✅ | ✅ | ❌ | ❌ |
| CLS | ✅ | ✅ | ✅ | ❌ |
| FCP | ✅ | ✅ | ✅ | ✅ |
| TTFB | ✅ | ✅ | ✅ | ✅ |

### Fallback Strategy

```typescript
// 지원되지 않는 지표는 "지원되지 않음" 메시지 표시
onLCP(metric => updateUI('lcp', metric.value), { reportAllChanges: true });
// 5초 후에도 값이 없으면 "지원되지 않음" 표시
setTimeout(() => {
  if (!lcpValue) setUnsupported('lcp');
}, 5000);
```

---

## 3. 차트 시각화 구현 방법

### Decision: 순수 CSS + SVG로 구현

### Rationale

- 외부 라이브러리 없이 경량 유지 (spec 요구사항)
- 간단한 막대 차트와 타임라인만 필요
- Astro 컴포넌트로 서버 렌더링 가능
- 다크 모드 전환 시 CSS 변수로 쉽게 대응

### Alternatives Considered

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 순수 CSS/SVG | 가벼움, 커스터마이징 용이 | 개발 시간 | ✅ 선택 |
| Chart.js | 다양한 차트 | 번들 크기 ~200KB | ❌ |
| Lightweight libs (uPlot) | 성능 최적화 | 여전히 외부 의존성 | ❌ |

### Implementation Approach

#### 막대 차트 (리소스 분석)
```css
.bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}
```

#### 워터폴 타임라인 (네비게이션 타이밍)
```html
<div class="timing-bar" style="left: 10%; width: 20%;">
  DNS Lookup
</div>
```

---

## 4. 리소스 분석 구현

### Decision: Resource Timing API 사용

### Rationale

- 모든 최신 브라우저에서 지원
- 리소스 유형, 크기, 로딩 시간 정보 제공
- 별도 라이브러리 불필요

### Implementation

```typescript
const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

// 카테고리별 분류
const categorized = resources.reduce((acc, r) => {
  const type = getResourceType(r.initiatorType, r.name);
  acc[type] = acc[type] || { count: 0, size: 0 };
  acc[type].count++;
  acc[type].size += r.transferSize || 0;
  return acc;
}, {});

function getResourceType(initiator: string, url: string): string {
  if (initiator === 'script' || url.endsWith('.js')) return 'JavaScript';
  if (initiator === 'link' || url.endsWith('.css')) return 'CSS';
  if (initiator === 'img' || /\.(png|jpg|gif|svg|webp)/.test(url)) return 'Images';
  if (url.includes('fonts') || /\.(woff2?|ttf|otf)/.test(url)) return 'Fonts';
  return 'Other';
}
```

---

## 5. 네비게이션 타이밍 시각화

### Decision: Navigation Timing API Level 2 사용

### Rationale

- 표준 API로 모든 브라우저 지원
- 페이지 로딩의 각 단계별 시간 측정 가능

### Timing Phases

```typescript
const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

const phases = [
  { name: 'DNS Lookup', start: timing.domainLookupStart, end: timing.domainLookupEnd },
  { name: 'TCP Connection', start: timing.connectStart, end: timing.connectEnd },
  { name: 'Request', start: timing.requestStart, end: timing.responseStart },
  { name: 'Response', start: timing.responseStart, end: timing.responseEnd },
  { name: 'DOM Processing', start: timing.domInteractive, end: timing.domContentLoadedEventEnd },
  { name: 'Load Complete', start: timing.loadEventStart, end: timing.loadEventEnd },
];
```

---

## 6. 상태 색상 기준 (Google 표준)

### Core Web Vitals 임계값

| 지표 | 좋음 (녹색) | 개선 필요 (노란색) | 나쁨 (빨간색) |
|------|------------|------------------|--------------|
| LCP | ≤ 2.5s | 2.5s - 4s | > 4s |
| INP | ≤ 200ms | 200ms - 500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | ≤ 1.8s | 1.8s - 3s | > 3s |
| TTFB | ≤ 800ms | 800ms - 1800ms | > 1800ms |

### 색상 팔레트

```css
:root {
  --metric-good: #0cce6b;      /* 녹색 */
  --metric-needs-improvement: #ffa400;  /* 노란색 */
  --metric-poor: #ff4e42;      /* 빨간색 */
}
```

---

## Summary

| 항목 | 결정 | 근거 |
|------|------|------|
| Core Web Vitals 측정 | web-vitals 라이브러리 | Google 공식, 정확도, 호환성 |
| 브라우저 호환성 | Graceful Degradation | Safari/Firefox 일부 지표 미지원 |
| 차트 라이브러리 | 사용 안 함 (순수 CSS/SVG) | spec 요구사항, 경량화 |
| 리소스 분석 | Resource Timing API | 네이티브 지원 |
| 네비게이션 타이밍 | Navigation Timing API L2 | 표준 API |

---

## Dependencies to Add

```bash
pnpm add web-vitals
```

**Bundle Impact**: ~2KB (gzipped, tree-shaken)
