# Tasks: 블로그 댓글 기능 (Giscus)

**Input**: Design documents from `/specs/007-comments/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 시각적 검증 + 수동 테스트로 대체 (헌법 I. Test-Smart 준수)

**Organization**: Giscus는 외부 서비스로, 모든 User Story (US1-4)가 단일 컴포넌트 통합으로 동시에 달성됩니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story → Task Mapping

| User Story | Priority | 달성 방식 |
|------------|----------|-----------|
| US1: 댓글 읽기 | P1 | Giscus 기본 기능 (T003-T004) |
| US2: 댓글 작성 | P1 | Giscus 기본 기능 (T003-T004) |
| US3: 답글 | P2 | Giscus 기본 기능 (T003-T004) |
| US4: 스팸 방지 | P2 | GitHub 인증 (T001 설정 시 자동) |

---

## Phase 1: Setup (GitHub 설정)

**Purpose**: Giscus 사용을 위한 GitHub 레포지토리 설정

- [x] T001 GitHub 레포지토리 Settings에서 Discussions 기능 활성화
- [x] T002 [P] giscus GitHub App 설치 및 https://giscus.app 에서 설정값 획득 (data-repo-id, data-category-id)

**Checkpoint**: GitHub 설정 완료 - giscus.app에서 "Success!" 메시지 확인

---

## Phase 2: Core Implementation (US1-US4 통합 구현)

**Purpose**: Giscus 컴포넌트 구현으로 모든 User Story 동시 달성

**Goal**: 블로그 글 하단에 Giscus 댓글 시스템 표시

**Independent Test**: 블로그 글 페이지 접속 시 댓글 영역 표시, GitHub 로그인 후 댓글 작성 가능

### Implementation

- [x] T003 [US1-4] Comments.astro 컴포넌트 생성 in src/components/blog/Comments.astro
  - Giscus 스크립트 임베드 (is:inline, async, lazy loading)
  - 다크 모드 테마 동기화 로직 (MutationObserver + postMessage)
  - 스타일링 (기존 디자인 시스템 CSS 변수 사용)
  - JSDoc 문서화

- [x] T004 [US1-4] BlogPost 레이아웃에 Comments 컴포넌트 통합 in src/layouts/BlogPost.astro
  - Comments 컴포넌트 import
  - article 태그 다음, content-grid 내부에 배치

**Checkpoint**: 모든 User Story (US1-4) 기능 완료

---

## Phase 3: Verification

**Purpose**: 구현 검증 및 품질 확인

- [ ] T005 로컬 개발 서버에서 댓글 기능 테스트 (pnpm dev)
  - 블로그 글 페이지 접속 시 Giscus 위젯 표시 확인
  - GitHub 로그인 후 댓글 작성/답글 테스트
  - 댓글 목록 시간순 표시 확인

- [ ] T006 [P] 다크 모드 전환 시 Giscus 테마 동기화 테스트
  - 라이트 → 다크 전환 시 Giscus iframe 테마 변경 확인
  - 다크 → 라이트 전환 시 Giscus iframe 테마 변경 확인

- [ ] T007 [P] 모바일 반응형 테스트
  - 모바일 뷰포트에서 댓글 영역 레이아웃 확인
  - 터치로 댓글 작성 가능 여부 확인

- [x] T008 빌드 테스트 실행 (pnpm build)
  - 빌드 성공 확인
  - 타입 체크 통과 확인

**Checkpoint**: 모든 검증 완료 - 배포 준비 완료

---

## Phase 4: Polish & Documentation

**Purpose**: 최종 정리 및 문서화

- [x] T009 [P] spec.md 상태를 Draft에서 Complete로 변경
- [ ] T010 커밋 생성: "feat: Giscus 댓글 시스템 추가"

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001-T002)
    ↓
Phase 2: Implementation (T003-T004)
    ↓
Phase 3: Verification (T005-T008)
    ↓
Phase 4: Polish (T009-T010)
```

### Task Dependencies

- **T001**: No dependencies - GitHub 설정
- **T002**: No dependencies - giscus.app 설정 (T001과 병렬 가능)
- **T003**: Depends on T002 (data-repo-id, data-category-id 필요)
- **T004**: Depends on T003 (Comments 컴포넌트 필요)
- **T005-T008**: Depends on T004 (구현 완료 후 검증)
- **T009-T010**: Depends on T008 (검증 완료 후 마무리)

### Parallel Opportunities

**Phase 1 (병렬 가능):**
```
T001 (Discussions 활성화) || T002 (giscus.app 설정)
```

**Phase 3 (병렬 가능):**
```
T006 (다크 모드 테스트) || T007 (모바일 테스트)
```

---

## Implementation Strategy

### MVP First (권장)

1. **Phase 1 완료**: GitHub 설정 (T001-T002)
2. **Phase 2 완료**: 컴포넌트 구현 (T003-T004)
3. **STOP and VALIDATE**: T005로 기본 기능 테스트
4. Deploy if ready - 모든 US 달성

### Full Implementation

1. Phase 1: Setup → T001-T002
2. Phase 2: Implementation → T003-T004
3. Phase 3: Verification → T005-T008
4. Phase 4: Polish → T009-T010

---

## Summary

| 항목 | 값 |
|------|-----|
| **총 태스크 수** | 10 |
| **Setup 태스크** | 2 (T001-T002) |
| **구현 태스크** | 2 (T003-T004) |
| **검증 태스크** | 4 (T005-T008) |
| **마무리 태스크** | 2 (T009-T010) |
| **병렬 기회** | 4개 태스크 (T002, T006, T007, T009) |
| **MVP 범위** | T001-T005 (5 태스크) |

### User Story 완료 시점

- **US1 (댓글 읽기)**: T004 완료 시
- **US2 (댓글 작성)**: T004 완료 시
- **US3 (답글)**: T004 완료 시
- **US4 (스팸 방지)**: T001 완료 시 (GitHub 인증)

---

## Notes

- Giscus는 외부 서비스로 모든 댓글 기능 (읽기, 작성, 답글, 리액션)을 자동 제공
- GitHub 인증 필수 → 스팸 방지 자동 달성
- 테스트는 시각적/수동 검증으로 대체 (UI 컴포넌트, 복잡한 로직 없음)
- `is:inline` 속성 필수 - Astro 빌드 시 스크립트 변형 방지
