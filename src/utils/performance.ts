/**
 * Performance monitoring utilities
 * Web Performance API를 활용한 성능 측정 유틸리티
 *
 * @module utils/performance
 */

// ============================================================================
// Types
// ============================================================================

/** Core Web Vitals 및 추가 지표 식별자 */
export type MetricId = 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb';

/** 지표 상태 */
export type MetricStatus =
  | 'good'
  | 'needs-improvement'
  | 'poor'
  | 'pending'
  | 'unsupported';

/** 리소스 유형 */
export type ResourceType = 'JavaScript' | 'CSS' | 'Images' | 'Fonts' | 'Other';

/** 타이밍 단계 식별자 */
export type TimingPhaseId =
  | 'dns'
  | 'tcp'
  | 'ssl'
  | 'request'
  | 'response'
  | 'dom'
  | 'load';

/** 리소스 요약 정보 */
export interface ResourceSummary {
  type: ResourceType;
  count: number;
  totalSize: number;
  percentage: number;
}

/** 타이밍 단계 정보 */
export interface TimingPhase {
  id: TimingPhaseId;
  name: string;
  description: string;
  start: number;
  end: number;
  duration: number;
  color: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Core Web Vitals 임계값 (Google 기준)
 * @see https://web.dev/vitals/
 */
export const METRIC_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // ms
  inp: { good: 200, poor: 500 }, // ms
  cls: { good: 0.1, poor: 0.25 }, // score
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 }, // ms
} as const;

/**
 * 상태별 색상 (다크 모드 호환)
 */
export const STATUS_COLORS = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
  pending: '#6b7280',
  unsupported: '#9ca3af',
} as const;

/**
 * 타이밍 단계별 색상
 */
export const TIMING_COLORS = {
  dns: '#4ade80', // green
  tcp: '#60a5fa', // blue
  ssl: '#a78bfa', // purple
  request: '#fbbf24', // yellow
  response: '#f97316', // orange
  dom: '#ec4899', // pink
  load: '#14b8a6', // teal
} as const;

/**
 * 타이밍 단계 정의
 */
export const TIMING_PHASES: Omit<TimingPhase, 'start' | 'end' | 'duration'>[] = [
  {
    id: 'dns',
    name: 'DNS Lookup',
    description: '도메인 이름을 IP 주소로 변환',
    color: TIMING_COLORS.dns,
  },
  {
    id: 'tcp',
    name: 'TCP Connection',
    description: '서버와 TCP 연결 수립',
    color: TIMING_COLORS.tcp,
  },
  {
    id: 'ssl',
    name: 'SSL/TLS',
    description: 'HTTPS 보안 연결 협상',
    color: TIMING_COLORS.ssl,
  },
  {
    id: 'request',
    name: 'Request',
    description: 'HTTP 요청 전송',
    color: TIMING_COLORS.request,
  },
  {
    id: 'response',
    name: 'Response',
    description: '서버 응답 수신',
    color: TIMING_COLORS.response,
  },
  {
    id: 'dom',
    name: 'DOM Processing',
    description: 'HTML 파싱 및 DOM 구성',
    color: TIMING_COLORS.dom,
  },
  {
    id: 'load',
    name: 'Load Complete',
    description: '모든 리소스 로딩 완료',
    color: TIMING_COLORS.load,
  },
];

/**
 * 지표 메타데이터
 */
export const METRIC_INFO: Record<
  MetricId,
  { name: string; fullName: string; description: string; unit: string }
> = {
  lcp: {
    name: 'LCP',
    fullName: 'Largest Contentful Paint',
    description: '가장 큰 콘텐츠 요소가 화면에 렌더링되는 시간',
    unit: 'ms',
  },
  inp: {
    name: 'INP',
    fullName: 'Interaction to Next Paint',
    description: '사용자 인터랙션에 대한 응답 지연 시간',
    unit: 'ms',
  },
  cls: {
    name: 'CLS',
    fullName: 'Cumulative Layout Shift',
    description: '페이지 로딩 중 레이아웃 이동 정도',
    unit: '',
  },
  fcp: {
    name: 'FCP',
    fullName: 'First Contentful Paint',
    description: '첫 번째 콘텐츠가 화면에 렌더링되는 시간',
    unit: 'ms',
  },
  ttfb: {
    name: 'TTFB',
    fullName: 'Time to First Byte',
    description: '서버로부터 첫 번째 바이트를 수신하는 시간',
    unit: 'ms',
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * 측정값에 따른 지표 상태 결정
 *
 * @param metricId - 지표 식별자
 * @param value - 측정값
 * @returns 지표 상태
 *
 * @example
 * ```ts
 * getMetricStatus('lcp', 2000); // 'good'
 * getMetricStatus('lcp', 3000); // 'needs-improvement'
 * getMetricStatus('lcp', 5000); // 'poor'
 * ```
 */
export function getMetricStatus(metricId: MetricId, value: number): MetricStatus {
  const threshold = METRIC_THRESHOLDS[metricId];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 *
 * @param bytes - 바이트 수
 * @returns 포맷된 문자열 (예: "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 밀리초를 읽기 쉬운 형식으로 변환
 *
 * @param ms - 밀리초
 * @returns 포맷된 문자열 (예: "1.5s" 또는 "150ms")
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

// ============================================================================
// Resource Analysis Functions
// ============================================================================

/**
 * URL과 initiatorType으로 리소스 유형 결정
 *
 * @param initiatorType - PerformanceResourceTiming의 initiatorType
 * @param url - 리소스 URL
 * @returns 리소스 유형
 */
export function getResourceType(
  initiatorType: string,
  url: string
): ResourceType {
  // JavaScript
  if (initiatorType === 'script' || url.endsWith('.js') || url.endsWith('.mjs')) {
    return 'JavaScript';
  }
  // CSS
  if (
    initiatorType === 'link' ||
    initiatorType === 'css' ||
    url.endsWith('.css')
  ) {
    return 'CSS';
  }
  // Images
  if (
    initiatorType === 'img' ||
    initiatorType === 'image' ||
    /\.(png|jpe?g|gif|svg|webp|avif|ico)(\?|$)/i.test(url)
  ) {
    return 'Images';
  }
  // Fonts
  if (
    url.includes('fonts') ||
    /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)
  ) {
    return 'Fonts';
  }
  return 'Other';
}

/**
 * Resource Timing API로 페이지 리소스 분석
 *
 * @returns 카테고리별 리소스 요약
 */
export function analyzeResources(): ResourceSummary[] {
  if (typeof performance === 'undefined') {
    return [];
  }

  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  // 카테고리별 집계
  const categories: Record<ResourceType, { count: number; size: number }> = {
    JavaScript: { count: 0, size: 0 },
    CSS: { count: 0, size: 0 },
    Images: { count: 0, size: 0 },
    Fonts: { count: 0, size: 0 },
    Other: { count: 0, size: 0 },
  };

  let totalSize = 0;

  resources.forEach((r) => {
    const type = getResourceType(r.initiatorType, r.name);
    const size = r.transferSize || 0;
    categories[type].count++;
    categories[type].size += size;
    totalSize += size;
  });

  // 요약 배열 생성
  const summary: ResourceSummary[] = (
    Object.entries(categories) as [ResourceType, { count: number; size: number }][]
  )
    .filter(([, data]) => data.count > 0)
    .map(([type, data]) => ({
      type: type as ResourceType,
      count: data.count,
      totalSize: data.size,
      percentage: totalSize > 0 ? data.size / totalSize : 0,
    }))
    .sort((a, b) => b.totalSize - a.totalSize);

  return summary;
}

/**
 * 전체 리소스 통계
 */
export function getResourceStats(): { totalCount: number; totalSize: number } {
  if (typeof performance === 'undefined') {
    return { totalCount: 0, totalSize: 0 };
  }

  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  return {
    totalCount: resources.length,
    totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
  };
}

// ============================================================================
// Navigation Timing Functions
// ============================================================================

/**
 * Navigation Timing API로 페이지 로딩 단계별 시간 수집
 *
 * @returns 타이밍 단계 배열
 */
export function getNavigationTiming(): TimingPhase[] {
  if (typeof performance === 'undefined') {
    return [];
  }

  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) {
    return [];
  }

  const timing = entries[0] as PerformanceNavigationTiming;

  const phases: TimingPhase[] = [
    {
      ...TIMING_PHASES[0],
      start: timing.domainLookupStart,
      end: timing.domainLookupEnd,
      duration: timing.domainLookupEnd - timing.domainLookupStart,
    },
    {
      ...TIMING_PHASES[1],
      start: timing.connectStart,
      end: timing.connectEnd,
      duration: timing.connectEnd - timing.connectStart,
    },
    {
      ...TIMING_PHASES[2],
      start: timing.secureConnectionStart || timing.connectStart,
      end: timing.connectEnd,
      duration:
        timing.secureConnectionStart > 0
          ? timing.connectEnd - timing.secureConnectionStart
          : 0,
    },
    {
      ...TIMING_PHASES[3],
      start: timing.requestStart,
      end: timing.responseStart,
      duration: timing.responseStart - timing.requestStart,
    },
    {
      ...TIMING_PHASES[4],
      start: timing.responseStart,
      end: timing.responseEnd,
      duration: timing.responseEnd - timing.responseStart,
    },
    {
      ...TIMING_PHASES[5],
      start: timing.domInteractive,
      end: timing.domContentLoadedEventEnd,
      duration: timing.domContentLoadedEventEnd - timing.domInteractive,
    },
    {
      ...TIMING_PHASES[6],
      start: timing.loadEventStart,
      end: timing.loadEventEnd,
      duration: timing.loadEventEnd - timing.loadEventStart,
    },
  ];

  // SSL/TLS가 없으면 제거
  return phases.filter((p) => p.duration > 0 || p.id !== 'ssl');
}

/**
 * 전체 페이지 로딩 시간
 */
export function getTotalLoadTime(): number {
  if (typeof performance === 'undefined') {
    return 0;
  }

  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) {
    return 0;
  }

  const timing = entries[0] as PerformanceNavigationTiming;
  return timing.loadEventEnd - timing.startTime;
}
