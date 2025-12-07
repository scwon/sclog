# Tasks: 프로필 사진 Hover 애니메이션

**Input**: Design documents from `/specs/005-profile-hover/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: 수동 브라우저 테스트로 대체 (CSS 애니메이션 - 시각적 검증)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 대체 이미지 확인 및 기존 컴포넌트 파악

- [x] T001 대체 이미지 존재 확인 in public/images/scwon_dot.png

---

## Phase 2: User Story 1 - 프로필 사진 Hover 시 이미지 전환 (Priority: P1) 🎯 MVP

**Goal**: 데스크톱에서 프로필 사진 hover 시 360도 회전 애니메이션과 함께 scwon_dot.png로 전환, 마우스 떼면 원래대로 복귀

**Independent Test**: 홈페이지에서 프로필 사진에 마우스 올려 회전 + 이미지 전환 확인, 마우스 떼면 역방향 회전 + 원래 이미지 복귀 확인

### Implementation for User Story 1

- [x] T002 [US1] HTML 구조 수정 - 대체 이미지 추가 in src/components/ProfileSection.astro
- [x] T003 [US1] CSS 스타일 추가 - 두 이미지 겹침 배치 및 기본 상태 정의 in src/components/ProfileSection.astro
- [x] T004 [US1] CSS hover 효과 구현 - 360도 회전 + opacity 전환 in src/components/ProfileSection.astro
- [x] T005 [US1] 접근성 미디어 쿼리 추가 - prefers-reduced-motion 존중 in src/components/ProfileSection.astro
- [x] T006 [US1] 이미지 프리로드 link 추가 in src/layouts/BaseLayout.astro

**Checkpoint**: 데스크톱 hover 애니메이션 완전 동작 확인

---

## Phase 3: User Story 2 - 터치 기기 대응 (Priority: P2)

**Goal**: 터치 기기에서 탭으로 동일한 애니메이션 효과 제공

**Independent Test**: 모바일 기기 또는 터치 시뮬레이터에서 프로필 사진 탭 시 애니메이션 동작, 다른 곳 탭 시 원래대로 복귀 확인

### Implementation for User Story 2

- [x] T007 [US2] JavaScript 터치 이벤트 핸들러 구현 in src/components/ProfileSection.astro
- [x] T008 [US2] .active 클래스용 CSS 스타일 추가 (hover와 동일 효과) in src/components/ProfileSection.astro
- [x] T009 [US2] Astro View Transitions 대응 (page-load 이벤트) in src/components/ProfileSection.astro

**Checkpoint**: 터치 기기에서 탭 애니메이션 완전 동작 확인

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 코드 품질 및 빌드 검증

- [x] T010 JSDoc 주석 추가 in src/components/ProfileSection.astro
- [x] T011 TypeScript 빌드 검증 (`pnpm build`)
- [x] T012 quickstart.md 테스트 체크리스트 검증

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - 즉시 시작 가능
- **User Story 1 (Phase 2)**: Setup 완료 후 시작
- **User Story 2 (Phase 3)**: User Story 1 완료 후 시작 (CSS 스타일 재사용)
- **Polish (Phase 4)**: 모든 User Story 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: 독립적 - 데스크톱 hover만으로 MVP 가능
- **User Story 2 (P2)**: US1의 CSS 스타일에 의존하지만 독립적으로 테스트 가능

### Within Each User Story

- HTML 구조 → CSS 스타일 → 기능 구현 순서

---

## Parallel Example: User Story 1

이 기능은 단일 파일(ProfileSection.astro) 수정이므로 병렬 실행 불가. 순차적으로 진행.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup: 이미지 확인
2. User Story 1: 데스크톱 hover 애니메이션 완성
3. **STOP and VALIDATE**: hover 동작 테스트
4. 배포/데모 가능

### Incremental Delivery

1. Setup → User Story 1 → 데스크톱 MVP 완성
2. User Story 2 추가 → 터치 기기 대응
3. Polish → 코드 품질 및 빌드 검증

---

## Notes

- 모든 구현은 src/components/ProfileSection.astro 단일 파일에서 진행
- 외부 의존성 없음 (CSS + 네이티브 JavaScript만 사용)
- 수동 브라우저 테스트로 시각적 검증
- 커밋은 각 Phase 완료 후 권장