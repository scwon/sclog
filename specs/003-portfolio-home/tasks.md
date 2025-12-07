# Tasks: 포트폴리오 홈페이지

**Input**: Design documents from `/specs/003-portfolio-home/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 명세에서 테스트를 명시적으로 요청하지 않음. 시각적 검증으로 대체.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (Astro SSG)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 데이터 타입 정의 및 디렉토리 구조 생성

- [x] T001 Create data directory at src/data/
- [x] T002 [P] Create TypeScript types for Profile, SocialLink, Career in src/data/types.ts
- [x] T003 [P] Create profile data with placeholder values in src/data/profile.ts

**Checkpoint**: 데이터 구조 준비 완료 ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에서 공유하는 기반 작업

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add placeholder profile image at public/images/profile.svg
- [x] T005 [P] Create SVG icon components for social platforms (GitHub, LinkedIn, Instagram, Email) as inline SVGs in src/components/icons/

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - 첫인상 확인 (Priority: P1) 🎯 MVP

**Goal**: 방문자가 홈페이지에 접속하면 프로필 사진, 이름, 한 줄 소개, 자기소개 문구를 볼 수 있다

**Independent Test**: 홈페이지 접속 시 프로필 섹션이 화면 상단에 표시되는지 확인

### Implementation for User Story 1

- [x] T006 [US1] Create ProfileSection component in src/components/ProfileSection.astro
- [x] T007 [US1] Add ProfileSection styles (avatar, name, tagline, bio) with Design System tokens
- [x] T008 [US1] Integrate ProfileSection into src/pages/index.astro (replace hero section)
- [x] T009 [US1] Verify responsive layout for ProfileSection (mobile/desktop)

**Checkpoint**: User Story 1 완료 - 프로필 섹션이 독립적으로 동작 ✅

---

## Phase 4: User Story 2 - 연락처 및 소셜 링크 확인 (Priority: P2)

**Goal**: 방문자가 소셜 링크 아이콘을 클릭하여 각 플랫폼으로 이동하거나 이메일을 보낼 수 있다

**Independent Test**: 소셜 아이콘 클릭 시 새 탭에서 해당 플랫폼 열림, 이메일 아이콘 클릭 시 메일 클라이언트 열림

### Implementation for User Story 2

- [x] T010 [US2] Create SocialLinks component in src/components/SocialLinks.astro
- [x] T011 [US2] Add hover effects and accessibility attributes (aria-label) to SocialLinks
- [x] T012 [US2] Integrate SocialLinks into ProfileSection (below bio)
- [x] T013 [US2] Verify all links open in new tab with rel="noopener noreferrer"

**Checkpoint**: User Stories 1, 2 완료 - 프로필 + 소셜 링크 동작 ✅

---

## Phase 5: User Story 3 - 경력/이력 확인 (Priority: P3)

**Goal**: 방문자가 스크롤하여 경력 정보를 시간순으로 확인할 수 있다

**Independent Test**: 이력 섹션에서 회사명, 역할, 기간이 올바르게 표시되는지 확인

### Implementation for User Story 3

- [x] T014 [US3] Create CareerSection component in src/components/CareerSection.astro
- [x] T015 [US3] Add timeline-style layout for career items with Design System tokens
- [x] T016 [US3] Handle edge case: careers array empty (hide section)
- [x] T017 [US3] Integrate CareerSection into src/pages/index.astro (after ProfileSection)

**Checkpoint**: User Stories 1, 2, 3 완료 - 프로필 + 소셜 + 경력 동작 ✅

---

## Phase 6: User Story 4 - 최근 글 탐색 (Priority: P4)

**Goal**: 방문자가 최근 글 목록에서 글을 클릭하여 블로그 글 페이지로 이동할 수 있다

**Independent Test**: 최근 글 섹션에서 글 제목 클릭 시 해당 글 페이지로 이동

### Implementation for User Story 4

- [x] T018 [US4] Create RecentPosts component in src/components/RecentPosts.astro (extract from index.astro)
- [x] T019 [US4] Handle edge case: posts array empty (show "아직 작성된 글이 없습니다" message)
- [x] T020 [US4] Add "모든 글 보기" link when totalCount > 5
- [x] T021 [US4] Integrate RecentPosts into src/pages/index.astro (replace existing recent posts section)

**Checkpoint**: 모든 User Stories 완료 - 전체 포트폴리오 홈페이지 동작 ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 페이지 품질 개선

- [x] T022 Verify light/dark theme works for all sections in src/pages/index.astro
- [x] T023 [P] Add JSDoc comments to all new components
- [x] T024 [P] Run astro check and fix any TypeScript errors
- [x] T025 Run pnpm build and verify no build errors
- [ ] T026 Visual verification: test on mobile (320px), tablet (768px), desktop (1920px)
- [ ] T027 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (integrates into ProfileSection)
- **User Story 3 (P3)**: Can start after Phase 2 - Independent of US1/US2
- **User Story 4 (P4)**: Can start after Phase 2 - Independent of other stories

### Parallel Opportunities

```text
Phase 1: T002 ∥ T003 (different files)
Phase 2: T004 ∥ T005 (different directories)
Phase 3-6: US1 완료 후 US3, US4 병렬 가능 (US2는 US1에 통합되므로 순차)
Phase 7: T023 ∥ T024 (different tasks)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (프로필 섹션)
4. **STOP and VALIDATE**: 홈페이지에서 프로필 정보가 표시되는지 확인
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. Add US1 (프로필) → Test → Deploy
3. Add US2 (소셜 링크) → Test → Deploy
4. Add US3 (경력) → Test → Deploy
5. Add US4 (최근 글) → Test → Deploy
6. Polish → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 시각적 검증: 테스트 코드 대신 브라우저에서 확인
- Design System 토큰 사용 필수 (--color-primary, --color-text, etc.)
- 모든 외부 링크: target="_blank" rel="noopener noreferrer"
