# Tasks: 블로그 읽기 경험 개선

**Input**: Design documents from `/specs/004-reading-experience/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 시각적 검증 (UI 컴포넌트) - 자동화 테스트 미포함

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (Astro SSG)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 블로그 읽기 경험 컴포넌트를 위한 디렉토리 구조 생성

- [x] T001 Create blog components directory at src/components/blog/

**Checkpoint**: 디렉토리 구조 준비 완료

---

## Phase 2: User Story 1 - 읽기 시간 확인 (Priority: P1) ✅ 완료

**Goal**: 독자가 글 읽는 데 걸리는 예상 시간을 확인

**Status**: ✅ **이미 구현됨** - src/utils/blog.ts:getReadingTime, src/layouts/BlogPost.astro

**Independent Test**: 블로그 글에 접속하여 "N분 읽기" 표시 확인

> 추가 작업 없음 - 다음 User Story로 진행

---

## Phase 3: User Story 2 - 목차로 빠른 탐색 (Priority: P2)

**Goal**: 화면 측면에 고정된 목차로 글 구조 파악 및 섹션 이동

**Independent Test**: 헤딩 3개 이상 있는 글에서 사이드 목차 표시, 클릭 시 해당 섹션으로 이동

### Implementation for User Story 2

- [x] T002 [US2] Create TableOfContents component in src/components/blog/TableOfContents.astro
  - Props: headings (MarkdownHeading[])
  - 헤딩 3개 미만이면 렌더링하지 않음
  - h2, h3만 표시 (depth 2, 3 필터링)
  - 긴 제목은 말줄임 처리

- [x] T003 [US2] Add client-side script for active section highlighting in src/components/blog/TableOfContents.astro
  - Intersection Observer로 현재 섹션 감지
  - 활성 항목에 .active 클래스 추가
  - 쓰로틀링 적용 (빠른 스크롤 대응)

- [x] T004 [US2] Style TableOfContents with design tokens in src/components/blog/TableOfContents.astro
  - position: sticky, 우측 배치
  - --color-primary로 활성 항목 강조
  - 768px 미만에서 display: none

- [x] T005 [US2] Integrate TableOfContents into BlogPost layout in src/layouts/BlogPost.astro
  - headings 추출하여 컴포넌트에 전달
  - 레이아웃을 2컬럼 그리드로 변경 (본문 + TOC)

- [x] T006 [US2] Add smooth scroll behavior for TOC navigation in src/components/blog/TableOfContents.astro
  - 목차 항목 클릭 시 scroll-behavior: smooth

**Checkpoint**: 목차가 표시되고, 클릭/스크롤 시 활성 섹션 하이라이트 동작

---

## Phase 4: User Story 3 - 코드 쉽게 복사 (Priority: P3)

**Goal**: 코드 블록에 언어 라벨과 복사 버튼 제공

**Independent Test**: 코드 블록의 복사 버튼 클릭 시 클립보드에 복사되고 피드백 표시

### Implementation for User Story 3

- [x] T007 [P] [US3] Create copy button SVG icons in src/components/blog/CodeBlock.astro
  - 복사 아이콘 (기본)
  - 체크 아이콘 (복사 완료)

- [x] T008 [US3] Create CodeBlock enhancement script in src/components/blog/CodeBlock.astro
  - 모든 pre 태그에 복사 버튼 동적 추가
  - data-language 속성에서 언어 라벨 추출
  - navigator.clipboard.writeText() 사용

- [x] T009 [US3] Implement copy feedback animation in src/components/blog/CodeBlock.astro
  - 복사 성공 시 아이콘 → 체크로 변경
  - 2초 후 원래 아이콘으로 복귀
  - aria-label 동적 변경 ("코드 복사" ↔ "복사됨")

- [x] T010 [US3] Style code block header with language label in src/components/blog/CodeBlock.astro
  - 코드 블록 상단에 언어 라벨 표시
  - 복사 버튼 우측 정렬
  - 다크/라이트 테마 대응

- [x] T011 [US3] Add CodeBlock script to BlogPost layout in src/layouts/BlogPost.astro
  - 스크립트 로드 (is:inline 또는 별도 <script>)

**Checkpoint**: 코드 블록에 언어 라벨 + 복사 버튼 표시, 클릭 시 복사 및 피드백

---

## Phase 5: User Story 4 - 읽기 진행률 확인 (Priority: P4)

**Goal**: 페이지 상단에 스크롤 진행률 바 표시

**Independent Test**: 긴 글 스크롤 시 진행률 바가 0%→100%로 채워짐

### Implementation for User Story 4

- [x] T012 [US4] Create ProgressBar component in src/components/blog/ProgressBar.astro
  - position: fixed, 상단 고정
  - 높이 3px, --color-primary 배경

- [x] T013 [US4] Add scroll progress calculation script in src/components/blog/ProgressBar.astro
  - scroll 이벤트 + requestAnimationFrame
  - progress = scrollY / (documentHeight - windowHeight)
  - transform: scaleX() 사용 (리플로우 방지)

- [x] T014 [US4] Add ProgressBar to BlogPost layout in src/layouts/BlogPost.astro
  - 헤더 바로 아래 또는 페이지 최상단에 배치

- [x] T015 [US4] Hide ProgressBar for short posts in src/components/blog/ProgressBar.astro
  - 스크롤 불필요한 짧은 글에서는 숨김 처리

**Checkpoint**: 진행률 바가 스크롤에 따라 부드럽게 채워짐 (60fps)

---

## Phase 6: User Story 5 - 맨 위로 빠른 이동 (Priority: P5)

**Goal**: 스크롤 시 맨 위로 버튼 표시, 클릭 시 상단으로 이동

**Independent Test**: 300px 이상 스크롤 시 버튼 나타남, 클릭 시 부드럽게 상단으로 이동

### Implementation for User Story 5

- [x] T016 [US5] Create ScrollToTop component in src/components/blog/ScrollToTop.astro
  - position: fixed, 우하단 배치
  - 원형 버튼 (40x40px)
  - 위쪽 화살표 SVG 아이콘

- [x] T017 [US5] Add scroll visibility toggle script in src/components/blog/ScrollToTop.astro
  - scrollY > 300px 시 버튼 표시
  - opacity + pointer-events로 표시/숨김

- [x] T018 [US5] Implement smooth scroll to top in src/components/blog/ScrollToTop.astro
  - window.scrollTo({ top: 0, behavior: 'smooth' })

- [x] T019 [US5] Style ScrollToTop with design tokens in src/components/blog/ScrollToTop.astro
  - 배경: --color-bg, 그림자
  - 호버: --color-primary 테두리
  - 트랜지션 애니메이션

- [x] T020 [US5] Add accessibility attributes to ScrollToTop in src/components/blog/ScrollToTop.astro
  - aria-label="맨 위로 이동"
  - 키보드 접근 가능 (button 요소)

- [x] T021 [US5] Add ScrollToTop to BlogPost layout in src/layouts/BlogPost.astro

**Checkpoint**: 버튼이 스크롤 시 나타나고, 클릭 시 부드럽게 상단으로 이동

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 및 최적화

- [x] T022 Verify all components work together in src/layouts/BlogPost.astro
- [x] T023 [P] Add print styles to hide interactive elements in src/layouts/BlogPost.astro
  - 진행률 바, 맨 위로 버튼 인쇄 시 숨김
- [x] T024 [P] Test responsive behavior at 768px breakpoint
- [x] T025 Run build and type check (pnpm build)
- [x] T026 Validate against quickstart.md test scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **US1 (Phase 2)**: ✅ 이미 완료 - 건너뜀
- **US2-US5 (Phase 3-6)**: Setup 완료 후 병렬 또는 순차 진행 가능
- **Polish (Phase 7)**: 모든 User Story 완료 후

### User Story Dependencies

- **US2 (목차)**: BlogPost.astro 레이아웃 변경 필요 → 다른 US보다 먼저 권장
- **US3 (코드 복사)**: 독립적, 언제든 진행 가능
- **US4 (진행률)**: 독립적, 언제든 진행 가능
- **US5 (맨 위로)**: 독립적, 언제든 진행 가능

### Parallel Opportunities

- T007 [P] [US3]: 아이콘 생성은 다른 작업과 병렬 가능
- T023, T024 [P]: 최종 검증 작업들은 병렬 가능
- US3, US4, US5는 서로 독립적이므로 병렬 진행 가능

---

## Implementation Strategy

### MVP First (US2 목차만)

1. T001: Setup 완료
2. T002-T006: 목차 기능 구현
3. **STOP and VALIDATE**: 목차 동작 확인
4. 다른 기능 순차 추가

### Incremental Delivery

1. US2 (목차) → 긴 글 탐색 편의성
2. US3 (코드 복사) → 기술 블로그 핵심 기능
3. US4 (진행률) → 읽기 동기 부여
4. US5 (맨 위로) → 마무리 편의 기능

### 권장 순서

US2 → US3 → US4 → US5 (각 기능 독립 검증 후 다음 진행)

---

## Notes

- US1 (읽기 시간)은 이미 구현되어 있어 태스크에서 제외
- 모든 컴포넌트는 src/components/blog/ 하위에 생성
- 디자인 토큰 (--color-primary 등) 반드시 사용
- 접근성 고려: aria-label, 키보드 네비게이션
- 인쇄 시 인터랙티브 요소 숨김 처리
