# Tasks: 프로필 스핀 애니메이션

**Input**: Design documents from `/specs/009-profile-spin/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 시각적 검증으로 대체 (UI 컴포넌트, Constitution I. Test-Smart 준수)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Single project (Astro SSG)
- **Source**: `src/components/ProfileSection.astro` (기존 파일 수정)

---

## Phase 1: Setup

**Purpose**: 기존 코드 분석 및 준비

- [x] T001 기존 ProfileSection.astro의 현재 구조 확인 in src/components/ProfileSection.astro
- [x] T002 기존 hover 애니메이션 CSS 확인 및 스핀 상태 CSS 추가 위치 결정 in src/components/ProfileSection.astro

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 스핀 애니메이션의 핵심 인프라

**⚠️ CRITICAL**: User Story 작업 전 반드시 완료

- [x] T003 prefers-reduced-motion 체크 로직 추가 in src/components/ProfileSection.astro
- [x] T004 .spinning 클래스 CSS 추가 (transition: none) in src/components/ProfileSection.astro
- [x] T005 마우스 속도 측정 상태 변수 선언 (lastX, lastY, lastTime) in src/components/ProfileSection.astro
- [x] T006 calculateVelocity 함수 구현 in src/components/ProfileSection.astro

**Checkpoint**: Foundation ready - 속도 측정 인프라 완료

---

## Phase 3: User Story 1 - 빠른 마우스 패스로 스핀 트리거 (Priority: P1) 🎯 MVP

**Goal**: 프로필 사진 위로 마우스를 빠르게 스쳐 지나가면 동전처럼 계속 회전

**Independent Test**: 프로필 위로 마우스를 빠르게 움직여서 회전이 시작되는지 확인

### Implementation for User Story 1

- [x] T007 [US1] 스핀 상태 변수 선언 (rotation, angularVelocity, isSpinning, animationId) in src/components/ProfileSection.astro
- [x] T008 [US1] VELOCITY_THRESHOLD, FRICTION, MIN_ANGULAR_VELOCITY 상수 정의 in src/components/ProfileSection.astro
- [x] T009 [US1] startSpin 함수 구현 (마우스 속도→각속도 변환) in src/components/ProfileSection.astro
- [x] T010 [US1] animate 함수 구현 (requestAnimationFrame 루프) in src/components/ProfileSection.astro
- [x] T011 [US1] stopSpin 함수 구현 (클래스 제거, 상태 초기화) in src/components/ProfileSection.astro
- [x] T012 [US1] mousemove 이벤트 리스너에 속도 체크 및 스핀 트리거 로직 추가 in src/components/ProfileSection.astro
- [x] T013 [US1] mouseleave 이벤트 리스너에 속도 측정 리셋 로직 추가 in src/components/ProfileSection.astro

**Checkpoint**: User Story 1 완료 - 빠른 마우스 패스로 스핀 트리거 가능

---

## Phase 4: User Story 2 - 스핀 정지 인터랙션 (Priority: P2)

**Goal**: 회전 중인 프로필 사진을 클릭하면 회전이 멈춤

**Independent Test**: 회전 중인 프로필을 클릭하여 정지되는지 확인

### Implementation for User Story 2

- [x] T014 [US2] click 이벤트 리스너에 스핀 중 감속 정지 로직 추가 in src/components/ProfileSection.astro
- [x] T015 [US2] 스핀 중이 아닐 때는 기존 hover 동작 유지 확인 in src/components/ProfileSection.astro

**Checkpoint**: User Story 2 완료 - 클릭으로 스핀 정지 가능

---

## Phase 5: User Story 3 - 자연스러운 감속 및 관성 (Priority: P2)

**Goal**: 마우스 속도에 비례한 회전 속도와 물리적으로 자연스러운 감속

**Independent Test**: 다양한 속도로 마우스를 지나가게 해서 회전 속도 차이 확인

### Implementation for User Story 3

- [x] T016 [US3] 속도→각속도 변환 계수 튜닝 (VELOCITY_TO_ANGULAR) in src/components/ProfileSection.astro
- [x] T017 [US3] friction 값 조정으로 감속 자연스러움 튜닝 in src/components/ProfileSection.astro
- [x] T018 [US3] 최소 각속도 임계값 조정 (너무 느린 회전 방지) in src/components/ProfileSection.astro

**Checkpoint**: User Story 3 완료 - 물리 기반 자연스러운 감속

---

## Phase 6: Edge Cases & Touch Support

**Purpose**: 엣지 케이스 처리 및 터치 기기 지원

- [x] T019 [P] 터치 기기용 touchstart/touchend 이벤트 리스너 추가 in src/components/ProfileSection.astro
- [x] T020 [P] 스와이프 속도 계산 및 스핀 트리거 로직 in src/components/ProfileSection.astro
- [x] T021 연속 트리거 처리 (이미 스핀 중일 때 추가 회전력) in src/components/ProfileSection.astro
- [x] T022 View Transition 시 애니메이션 cleanup 확인 in src/components/ProfileSection.astro

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 최종 품질 검증

- [x] T023 JSDoc 주석 추가 (모든 함수에 설명) in src/components/ProfileSection.astro
- [x] T024 파라미터 최종 튜닝 (VELOCITY_THRESHOLD, FRICTION 실제 테스트) in src/components/ProfileSection.astro
- [ ] T025 60fps 애니메이션 성능 확인 (DevTools Performance 탭)
- [ ] T026 기존 hover 동전 뒤집기 동작 회귀 테스트
- [x] T027 pnpm build 및 astro check 통과 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 → US2 → US3 순차 진행 권장 (단일 파일 수정)
- **Edge Cases (Phase 6)**: Depends on US1 completion
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 가능 - 핵심 MVP
- **User Story 2 (P2)**: US1 완료 후 시작 (stopSpin 함수 필요)
- **User Story 3 (P2)**: US1 완료 후 시작 (기본 애니메이션 루프 필요)

### Within Each User Story

- 단일 파일(ProfileSection.astro) 수정이므로 순차 진행
- 각 Task 완료 후 브라우저에서 시각적 확인

### Parallel Opportunities

- Phase 6의 T019, T020은 병렬 가능 (터치 이벤트 독립)
- 대부분의 Task는 동일 파일 수정으로 순차 진행 필요

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T013)
4. **STOP and VALIDATE**: 브라우저에서 빠른 마우스 패스 테스트
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 속도 측정 인프라 완료
2. User Story 1 → 스핀 트리거 MVP 완료
3. User Story 2 → 클릭 정지 추가
4. User Story 3 → 물리 튜닝
5. Edge Cases → 터치 지원, 엣지 케이스
6. Polish → 최종 품질 검증

---

## Summary

| 항목 | 값 |
|------|-----|
| Total Tasks | 27 |
| Setup | 2 tasks |
| Foundational | 4 tasks |
| User Story 1 (P1) | 7 tasks |
| User Story 2 (P2) | 2 tasks |
| User Story 3 (P2) | 3 tasks |
| Edge Cases | 4 tasks |
| Polish | 5 tasks |
| Parallel Opportunities | Phase 6 (T019, T020) |
| MVP Scope | Phase 1-3 (13 tasks) |

---

## Notes

- [P] tasks = 병렬 실행 가능 (다른 파일 또는 독립적)
- [Story] label = 특정 User Story 매핑
- 단일 파일 수정이므로 대부분 순차 진행
- 각 Phase 완료 후 브라우저에서 시각적 검증
- 커밋은 각 User Story 완료 시점 권장
