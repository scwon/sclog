<!--
SYNC IMPACT REPORT
==================
Version change: 1.2.0 → 1.3.0
Modified:
  - Added: VII. Observability & Performance (성능 모니터링 원칙 추가)
Rationale: 모니터링 대시보드 기능 추가에 따른 성능 관찰 및 측정 원칙 정립
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check 섹션에서 참조)
  - .specify/templates/spec-template.md ✅ (기존 구조 호환)
Follow-up TODOs: None
-->

# SCLOG Constitution

## Core Principles

### I. Test-Smart

핵심 기능과 비즈니스 로직에 집중하여 테스트를 작성한다.

- 모든 기능에 테스트를 강제하지 않으나, 핵심 로직은 반드시 테스트해야 한다
- 데이터 처리 로직, 유틸리티 함수는 테스트 대상이다
- UI 컴포넌트는 시각적 검증으로 대체 가능하나, 복잡한 상태 로직은 테스트한다
- 버그 수정 시 해당 버그를 재현하는 테스트를 먼저 작성한다

### II. Code Quality First

린터 에러 제로, 일관된 포매팅, 타입 안전성을 보장한다.

- **TypeScript**: ESLint 에러 없음, Prettier 포매팅 필수
- **타입 안전성**: `any` 타입 사용 금지, strict 모드 활성화
- 커밋 전 린트/포맷 검사를 통과해야 한다

### III. Documentation First

모든 공개 API와 함수에 문서를 작성한다.

- **TypeScript**: 모든 export 함수/컴포넌트에 JSDoc 필수
- 복잡한 비즈니스 로직은 "왜"를 설명하는 주석 포함
- README, API 문서는 코드 변경과 함께 업데이트한다

### IV. SEO & Accessibility

블로그로서 검색 엔진 최적화와 접근성을 우선시한다.

- 모든 페이지에 적절한 meta 태그 (title, description, og:*) 필수
- 시맨틱 HTML 사용 (header, main, article, nav 등)
- 이미지에 alt 텍스트 필수
- Core Web Vitals 기준 충족 (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- 키보드 네비게이션 지원

### V. Portfolio Showcase

프론트엔드 개발 역량을 보여주는 시연 공간을 제공한다.

- 블로그 글과 별도로 인터랙티브 시연 페이지 구성 가능
- 시연 페이지는 독립적으로 동작하며, 기술적 설명을 포함해야 한다
- 애니메이션, 인터랙션, 실험적 UI를 자유롭게 구현 가능
- 시연 코드는 교육적 가치를 위해 주석과 설명 포함 권장

### VI. Design System

일관된 시각적 경험을 위한 디자인 시스템을 준수한다.

- **브랜드 표기**: "SCLOG"는 반드시 대문자로 표기한다
- **테마**: 라이트 모드 기본, 다크 모드 스위칭 지원
- **컬러**: 브랜드 컬러 `rgb(233, 172, 159)` (코랄/피치 톤)를 주요 강조색으로 사용
- **타이포그래피**: Roboto (영문), Noto Sans KR (한글) 사용
- **레이아웃**: 미니멀하고 콘텐츠 중심, 중앙 정렬 (max-width 제한)
- **여백**: 충분한 화이트스페이스로 가독성 확보

### VII. Observability & Performance

실시간 성능 모니터링과 관찰 가능성을 제공한다.

- **Core Web Vitals 측정**: LCP, INP, CLS를 실시간으로 측정하고 시각화한다
- **추가 성능 지표**: TTFB, FCP 등 추가 지표를 통해 상세 분석 제공
- **리소스 분석**: JavaScript, CSS, 이미지, 폰트 등 리소스 로딩 현황 파악
- **클라이언트 측 측정**: 외부 서비스 의존 없이 브라우저 API로 직접 측정
- **비용 제로 원칙**: 유료 서비스 없이 정적 사이트로 모니터링 구현
- **교육적 가치**: 모니터링 구현 자체가 포트폴리오 시연 항목으로 활용 가능

## Design Tokens

디자인 시스템의 구체적인 값을 정의한다.

### 컬러 팔레트

| 토큰 | 라이트 모드 | 다크 모드 | 용도 |
|------|-------------|-----------|------|
| `--color-primary` | `rgb(233, 172, 159)` | `rgb(233, 172, 159)` | 브랜드, 강조, 링크 |
| `--color-bg` | `#ffffff` | `#13151a` | 배경 |
| `--color-text` | `#1a1a1a` | `#e0e0e0` | 본문 텍스트 |
| `--color-text-muted` | `#6b7280` | `#9ca3af` | 보조 텍스트 |
| `--color-border` | `#e5e7eb` | `#2d2d2d` | 테두리 |

### 타이포그래피

| 요소 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 로고 (SCLOG) | Roboto | 1.5rem+ | 700 |
| 제목 (h1) | Noto Sans KR | 2.5rem | 700 |
| 제목 (h2) | Noto Sans KR | 1.75rem | 600 |
| 본문 | Noto Sans KR | 1rem | 400 |
| 코드 | Menlo, monospace | 0.9rem | 400 |

### 레이아웃

- **최대 너비**: 콘텐츠 영역 800px, 넓은 레이아웃 1000px
- **기본 패딩**: 1rem (모바일), 2rem (데스크톱)
- **컴포넌트 라운딩**: 8px (카드), 4px (버튼), 9999px (태그)

### 성능 지표 시각화

| 상태 | 색상 | 기준 |
|------|------|------|
| 좋음 (Good) | `#0cce6b` | Google 권장 기준 충족 |
| 개선 필요 (Needs Improvement) | `#ffa400` | 기준 초과, 개선 권장 |
| 나쁨 (Poor) | `#ff4e42` | 사용자 경험 저하 우려 |

## Technology Stack

프로젝트의 기술 스택과 제약사항을 정의한다.

| 영역            | 기술                 | 버전      |
| --------------- | -------------------- | --------- |
| Frontend        | Astro + TypeScript   | Astro 5.x |
| Content         | MDX (Markdown + JSX) | -         |
| Package Manager | pnpm                 | -         |
| Performance     | web-vitals           | ~2KB      |

### 구조 원칙

- **소스 코드**: `src/` 디렉토리 (루트), Astro 기반 SSG
- **정적 파일**: `public/` 디렉토리
- **성능 유틸리티**: `src/utils/performance.ts` (측정 함수 집중)
- **모니터링 컴포넌트**: `src/components/monitoring/` (대시보드 UI)
- 정적 콘텐츠(블로그 글)는 빌드 타임에 생성한다
- 백엔드는 필요시 추가 (현재 미사용)

## Development Workflow

개발 프로세스와 품질 게이트를 정의한다.

### 브랜치 전략

- `main`: 프로덕션 브랜치, 직접 커밋 금지
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### 커밋 규칙

- Conventional Commits 형식 사용
- 예: `feat: 블로그 목록 페이지 추가`, `fix: SEO 메타 태그 누락 수정`

### 품질 게이트

1. 린트/포맷 검사 통과
2. 타입 체크 통과 (`astro check`)
3. 핵심 기능 테스트 통과 (해당 시)
4. 빌드 성공 (`pnpm build`)

## Governance

헌법은 프로젝트의 최상위 규칙이다.

- 모든 코드 변경은 헌법의 원칙을 준수해야 한다
- 헌법 수정은 명확한 이유와 함께 문서화되어야 한다
- 복잡성 추가 시 반드시 정당화 필요 (YAGNI 원칙)
- 의심스러운 경우, 단순한 해결책을 선택한다

**Version**: 1.3.0 | **Ratified**: 2025-12-06 | **Last Amended**: 2025-12-15
