<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.1 → 1.1.0
Modified:
  - Technology Stack: Backend deferred (Rust/Axum/PostgreSQL → 추후 필요시 추가)
  - 구조 원칙: Frontend-only 아키텍처로 변경
Rationale: 백엔드 없이 Astro SSG로 시작, 필요시 백엔드 추가
Templates requiring updates: None
-->

# SCLog Constitution

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

- 모든 페이지에 적절한 meta 태그 (title, description, og:\*) 필수
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

## Technology Stack

프로젝트의 기술 스택과 제약사항을 정의한다.

| 영역            | 기술                 | 버전      |
| --------------- | -------------------- | --------- |
| Frontend        | Astro + TypeScript   | Astro 5.x |
| Content         | MDX (Markdown + JSX) | -         |
| Package Manager | pnpm                 | -         |

### 구조 원칙

- **소스 코드**: `src/` 디렉토리 (루트), Astro 기반 SSG
- **정적 파일**: `public/` 디렉토리
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

## Governance

헌법은 프로젝트의 최상위 규칙이다.

- 모든 코드 변경은 헌법의 원칙을 준수해야 한다
- 헌법 수정은 명확한 이유와 함께 문서화되어야 한다
- 복잡성 추가 시 반드시 정당화 필요 (YAGNI 원칙)
- 의심스러운 경우, 단순한 해결책을 선택한다

**Version**: 1.1.0 | **Ratified**: 2025-12-06 | **Last Amended**: 2025-12-06
