# Tasks: 디자인 시스템 적용

**Input**: Design documents from `/specs/002-design-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: 시각적 검증 (Constitution: Test-Smart 원칙에 따라 UI 중심 기능은 시각적 검증 적용)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Google Fonts 추가 및 기본 설정

- [x] T001 Add Google Fonts preconnect links in src/layouts/BaseLayout.astro `<head>`
- [x] T002 Add Google Fonts stylesheet link (Roboto, Noto Sans KR) in src/layouts/BaseLayout.astro `<head>`

---

## Phase 2: Foundational (Design Tokens)

**Purpose**: CSS Custom Properties 기반 디자인 토큰 정의 - 모든 User Story의 기반

**⚠️ CRITICAL**: 디자인 토큰이 정의되어야 모든 컴포넌트에서 사용 가능

- [x] T003 Define light mode CSS Custom Properties (:root) in src/layouts/BaseLayout.astro
  - `--color-primary`, `--color-bg`, `--color-text`, `--color-text-muted`, `--color-border`
  - `--font-sans`, `--font-logo`, `--font-mono`
  - `--max-width-content`, `--max-width-wide`, `--radius-card`, `--radius-button`, `--radius-tag`
- [x] T004 Define dark mode CSS Custom Properties (.dark) in src/layouts/BaseLayout.astro
  - Override: `--color-bg`, `--color-text`, `--color-text-muted`, `--color-border`
- [x] T005 Add FOUC prevention inline script in src/layouts/BaseLayout.astro `<head>`
  - Read localStorage, check prefers-color-scheme, apply theme class immediately
- [x] T006 Update html/body base styles to use design tokens in src/layouts/BaseLayout.astro
  - `font-family: var(--font-sans)`, `background: var(--color-bg)`, `color: var(--color-text)`

**Checkpoint**: Design tokens ready - component styling can begin

---

## Phase 3: User Story 1 - 라이트 모드 기본 테마 적용 (Priority: P1) 🎯 MVP

**Goal**: 흰색 배경 + 어두운 텍스트의 라이트 모드, 브랜드 컬러/폰트 적용, SCLOG 대문자 표기

**Independent Test**: 블로그 메인/상세 페이지에서 라이트 테마 시각적 확인

### Implementation for User Story 1

- [x] T007 [P] [US1] Create Header component with SCLOG logo in src/components/Header.astro
  - Logo text "SCLOG" (uppercase), `font-family: var(--font-logo)`, `color: var(--color-primary)`
  - Navigation links styled with design tokens
- [x] T008 [P] [US1] Update link styles to use brand color in src/layouts/BaseLayout.astro
  - `a { color: var(--color-primary) }`
- [x] T009 [US1] Add Header component to src/pages/index.astro
- [x] T010 [P] [US1] Add Header component to src/pages/blog/index.astro
- [x] T011 [P] [US1] Add Header component to src/pages/blog/[slug].astro
- [x] T012 [P] [US1] Add Header component to src/pages/blog/tags/index.astro
- [x] T013 [P] [US1] Add Header component to src/pages/blog/tags/[tag].astro
- [x] T014 [P] [US1] Add Header component to src/pages/404.astro

**Checkpoint**: Light mode with brand colors and fonts fully working

---

## Phase 4: User Story 2 - 다크 모드 스위칭 (Priority: P1)

**Goal**: 테마 토글 버튼으로 다크/라이트 전환, localStorage에 저장하여 재방문 시 유지

**Independent Test**: 토글 버튼 클릭 시 테마 전환 + 새로고침 후 유지 확인

### Implementation for User Story 2

- [x] T015 [US2] Create ThemeToggle component in src/components/ThemeToggle.astro
  - Sun/Moon icon button (☀️/🌙 or SVG)
  - onClick: toggle 'dark' class on `<html>`, save to localStorage
  - Show correct icon based on current theme
- [x] T016 [US2] Add ThemeToggle to Header component in src/components/Header.astro
- [x] T017 [US2] Add theme transition CSS (150ms) in src/layouts/BaseLayout.astro
  - `* { transition: background-color 0.15s, color 0.15s }`

**Checkpoint**: Theme switching works with persistence

---

## Phase 5: User Story 3 - 시스템 테마 자동 감지 (Priority: P2)

**Goal**: 첫 방문 시 시스템 prefers-color-scheme 감지, 수동 선택 우선

**Independent Test**: 시스템 다크 모드에서 첫 방문 시 다크 테마 자동 적용 확인

### Implementation for User Story 3

- [x] T018 [US3] Update FOUC script to respect system theme in src/layouts/BaseLayout.astro
  - Already handled in T005 (prefers-color-scheme detection)
  - Verify: stored theme > system theme > light fallback
- [x] T019 [US3] Add matchMedia change listener for system theme in src/components/ThemeToggle.astro
  - Only apply if no manual selection (localStorage is null)

**Checkpoint**: System theme detection works with manual override

---

## Phase 6: User Story 4 - 일관된 컴포넌트 스타일 (Priority: P2)

**Goal**: BlogCard, TagList 등 모든 컴포넌트가 디자인 토큰 사용

**Independent Test**: 모든 컴포넌트가 라이트/다크 모드에서 일관된 스타일 확인

### Implementation for User Story 4

- [x] T020 [P] [US4] Update BlogCard styles with design tokens in src/components/BlogCard.astro
  - `border-radius: var(--radius-card)`, `border-color: var(--color-border)`
  - `background: var(--color-bg)`, `color: var(--color-text)`
- [x] T021 [P] [US4] Update TagList styles with design tokens in src/components/TagList.astro
  - Tag: `border-radius: var(--radius-tag)`, `background: var(--color-primary)`
- [x] T022 [P] [US4] Update BlogPost layout styles in src/layouts/BlogPost.astro
  - Use `var(--color-*)` for all colors
  - Use `var(--max-width-content)` for container
- [x] T023 [P] [US4] Update index page styles in src/pages/index.astro
  - Container max-width, colors, spacing
- [x] T024 [US4] Update code block styles for dark mode in src/layouts/BlogPost.astro
  - Ensure syntax highlighting works in both themes

**Checkpoint**: All components use design tokens consistently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance, final verification

- [x] T025 [P] Add localStorage fallback to sessionStorage in src/components/ThemeToggle.astro
  - Handle private browsing mode
- [x] T026 [P] Add focus styles for keyboard accessibility in src/layouts/BaseLayout.astro
  - `:focus-visible { outline: 2px solid var(--color-primary) }`
- [x] T027 Run `pnpm build` to verify no TypeScript/build errors
- [x] T028 Visual verification: test all pages in light and dark mode
- [x] T029 Visual verification: test on mobile viewport

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - Google Fonts setup
- **Foundational (Phase 2)**: Depends on Setup - Design tokens definition
- **User Story 1 (Phase 3)**: Depends on Foundational - Light mode + Header
- **User Story 2 (Phase 4)**: Depends on US1 (Header exists) - Theme toggle
- **User Story 3 (Phase 5)**: Depends on US2 (toggle exists) - System detection
- **User Story 4 (Phase 6)**: Depends on Foundational - Component styling (can parallel with US1)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational
- **US2 (P1)**: Depends on US1 (needs Header for toggle placement)
- **US3 (P2)**: Depends on US2 (builds on toggle behavior)
- **US4 (P2)**: Can start after Foundational (parallel with US1)

### Within Each Phase

- Tasks marked [P] can run in parallel
- Components before page integration
- Styles before visual verification

### Parallel Opportunities

**After Phase 2 (Foundational):**
```
┌─────────────┐     ┌─────────────┐
│    US1      │     │    US4      │
│ (Header +   │ ←─→ │ (Component  │
│  Light mode)│     │  Styles)    │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│    US2      │
│ (Toggle)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    US3      │
│ (System     │
│  Detection) │
└─────────────┘
```

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all page Header additions in parallel:
Task: "Add Header to src/pages/blog/index.astro" [T010]
Task: "Add Header to src/pages/blog/[slug].astro" [T011]
Task: "Add Header to src/pages/blog/tags/index.astro" [T012]
Task: "Add Header to src/pages/blog/tags/[tag].astro" [T013]
Task: "Add Header to src/pages/404.astro" [T014]
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (Google Fonts)
2. Complete Phase 2: Foundational (Design Tokens)
3. Complete Phase 3: User Story 1 (Light mode + Header)
4. Complete Phase 4: User Story 2 (Theme Toggle)
5. **STOP and VALIDATE**: Test theme switching in browser
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Tokens ready
2. Add US1 → Light mode working → Can demo
3. Add US2 → Theme switching → Core feature complete
4. Add US3 → System detection → Enhanced UX
5. Add US4 → Consistent components → Polish
6. Each story adds value without breaking previous stories

---

## Notes

- Constitution: Test-Smart 원칙에 따라 UI 기능은 시각적 검증 (별도 자동화 테스트 불필요)
- FOUC 방지 스크립트는 반드시 `<head>`에 `is:inline`으로 배치
- 브랜드 컬러는 명도대비 제한으로 강조 요소에만 사용 (본문 텍스트 X)
- "SCLOG"는 항상 대문자로 표기 (Constitution VI. Design System)
