# Tasks: MDX 기반 블로그 포스트 시스템

**Input**: Design documents from `/specs/001-mdx-blog-post/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/routes.md

**Tests**: 이 프로젝트는 시각적 검증 + astro check를 사용합니다. 별도 테스트 태스크 없음.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `public/` at repository root
- Paths shown below assume Astro SSG structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and MDX integration setup

- [x] T001 Install @astrojs/mdx and @astrojs/sitemap integrations via `pnpm add @astrojs/mdx @astrojs/sitemap`
- [x] T002 Update astro.config.mjs to add mdx() and sitemap() integrations with site URL in `astro.config.mjs`
- [x] T003 [P] Create Content Collections schema with BlogPost validation in `src/content/config.ts`
- [x] T004 [P] Create blog content directory structure in `src/content/blog/`
- [x] T005 [P] Create utils directory with blog helper functions in `src/utils/blog.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components and layouts that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create base layout component with common HTML structure in `src/layouts/BaseLayout.astro`
- [x] T007 Create SEO component for meta tags (title, description, og:*) in `src/components/SEO.astro`
- [x] T008 [P] Create sample MDX blog post for testing in `src/content/blog/hello-world.mdx`
- [x] T009 Run `pnpm astro sync` to generate Content Collections types

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 블로그 글 작성 및 발행 (Priority: P1) 🎯 MVP

**Goal**: MDX 파일을 작성하면 고유 URL로 접근 가능한 블로그 페이지가 생성된다

**Independent Test**: `/blog/hello-world` 접속 시 샘플 글이 렌더링되고, 코드 블록에 구문 강조가 적용되는지 확인

### Implementation for User Story 1

- [x] T010 [US1] Create BlogPost layout with article structure in `src/layouts/BlogPost.astro`
- [x] T011 [US1] Create blog detail page with dynamic slug routing in `src/pages/blog/[slug].astro`
- [x] T012 [US1] Integrate SEO component in BlogPost layout for meta tags
- [x] T013 [US1] Add syntax highlighting styles for code blocks (Shiki default)
- [x] T014 [US1] Create second sample MDX post with code examples in `src/content/blog/astro-tutorial.mdx`
- [x] T015 [US1] Verify build and test blog detail pages with `pnpm build && pnpm preview`

**Checkpoint**: At this point, User Story 1 should be fully functional - individual blog posts render correctly

---

## Phase 4: User Story 2 - 블로그 목록 페이지 (Priority: P2)

**Goal**: 블로그 메인 페이지에서 모든 글 목록을 최신순으로 볼 수 있다

**Independent Test**: `/blog` 접속 시 모든 발행된 글이 날짜순으로 정렬되어 표시되는지 확인

### Implementation for User Story 2

- [x] T016 [US2] Create BlogCard component for post preview in `src/components/BlogCard.astro`
- [x] T017 [US2] Implement getPublishedPosts utility function (filter future dates, sort by date) in `src/utils/blog.ts`
- [x] T018 [US2] Create blog index page with post list in `src/pages/blog/index.astro`
- [x] T019 [US2] Add pagination or "load more" if needed (optional, defer if <20 posts)
- [x] T020 [US2] Verify blog list page displays all posts correctly

**Checkpoint**: At this point, User Story 2 is complete - blog list page shows all published posts

---

## Phase 5: User Story 4 - SEO 최적화 (Priority: P2)

**Goal**: 모든 페이지에 SEO 메타 태그가 포함되고 사이트맵이 자동 생성된다

**Independent Test**: HTML 소스에서 og:title, og:description 등 메타 태그 존재 확인, /sitemap.xml 접근 확인

### Implementation for User Story 4

- [x] T021 [US4] Enhance SEO component with Open Graph and Twitter Card tags in `src/components/SEO.astro`
- [x] T022 [US4] Add article-specific meta tags (published_time, tags) to BlogPost layout
- [x] T023 [US4] Verify sitemap.xml is generated with all blog URLs after build
- [x] T024 [US4] Add canonical URL to all pages
- [x] T025 [US4] Run Lighthouse SEO audit and verify score >= 90

**Checkpoint**: At this point, User Story 4 is complete - all SEO requirements met

---

## Phase 6: User Story 3 - 태그 기반 분류 (Priority: P3)

**Goal**: 태그를 통해 관심 있는 주제의 글만 필터링할 수 있다

**Independent Test**: `/blog/tags` 접속 시 모든 태그 표시, 태그 클릭 시 해당 태그 글만 표시

### Implementation for User Story 3

- [x] T026 [US3] Create TagList component for displaying tags in `src/components/TagList.astro`
- [x] T027 [US3] Implement getAllTags utility function (extract unique tags with count) in `src/utils/blog.ts`
- [x] T028 [US3] Implement getPostsByTag utility function in `src/utils/blog.ts`
- [x] T029 [US3] Create tags index page showing all tags in `src/pages/blog/tags/index.astro`
- [x] T030 [US3] Create tag detail page with filtered posts in `src/pages/blog/tags/[tag].astro`
- [x] T031 [US3] Add TagList component to BlogPost layout (show tags on post detail)
- [x] T032 [US3] Add tags to BlogCard component (show tags on list items)
- [x] T033 [US3] Verify tag navigation works end-to-end

**Checkpoint**: At this point, User Story 3 is complete - tag system fully functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T034 Implement scheduled publishing filter (hide posts with future pubDate) in `src/utils/blog.ts`
- [x] T035 Add draft post filtering (hide posts with draft: true)
- [x] T036 [P] Add reading time estimation to BlogCard and BlogPost
- [x] T037 [P] Style improvements for blog list and detail pages
- [x] T038 [P] Add 404 page for invalid slugs and tags in `src/pages/404.astro`
- [x] T039 Run full build and verify all pages render correctly
- [x] T040 Run `astro check` and fix any TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1) can start first
  - US2 (P2) and US4 (P2) can run in parallel after US1
  - US3 (P3) can start after Foundational
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Uses BlogCard from US2, can share utilities
- **User Story 4 (P2)**: Enhances SEO component created in Foundational, no story dependencies
- **User Story 3 (P3)**: Uses BlogCard from US2, adds TagList - should come after US2 for consistency

### Within Each User Story

- Components before pages
- Utilities before components that use them
- Core implementation before enhancements

### Parallel Opportunities

- T003, T004, T005: Different files, can run in parallel
- T008: Sample content, independent of code
- T036, T037, T038: Polish tasks, different concerns

---

## Parallel Example: Setup Phase

```bash
# Launch these tasks together:
T003: Create Content Collections schema in src/content/config.ts
T004: Create blog content directory in src/content/blog/
T005: Create utils directory in src/utils/blog.ts
```

## Parallel Example: User Story 3

```bash
# Launch component creation together:
T026: Create TagList component
T027: Implement getAllTags utility
T028: Implement getPostsByTag utility
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test blog detail pages work
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 + 4 → Test independently → Deploy (List + SEO)
4. Add User Story 3 → Test independently → Deploy (Tags)
5. Polish phase → Final deploy

### Recommended Order

1. **T001-T009**: Setup + Foundational (blocking)
2. **T010-T015**: US1 - Blog detail pages (MVP)
3. **T016-T020**: US2 - Blog list page
4. **T021-T025**: US4 - SEO optimization (can overlap with US2)
5. **T026-T033**: US3 - Tag system
6. **T034-T040**: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
