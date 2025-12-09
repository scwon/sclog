# Implementation Plan: 블로그 댓글 기능 (Giscus)

**Branch**: `007-comments` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-comments/spec.md`

## Summary

블로그 글에 독자들이 댓글을 남기고 소통할 수 있는 기능을 구현한다. Giscus (GitHub Discussions 기반)를 사용하여 별도 백엔드 없이 정적 사이트에서 댓글 시스템을 제공한다. 다크 모드 연동, 한국어 UI, 지연 로딩을 지원한다.

## Technical Context

**Language/Version**: TypeScript 5.6, Astro 5.x
**Primary Dependencies**: Giscus (외부 스크립트, 설치 불필요)
**Storage**: GitHub Discussions (외부 서비스)
**Testing**: 시각적 검증 + 수동 테스트
**Target Platform**: Web (SSG, 모든 브라우저)
**Project Type**: Web (Astro SSG)
**Performance Goals**: LCP < 2.5s 유지, 지연 로딩으로 초기 로딩 영향 최소화
**Constraints**: GitHub 계정 필수, GitHub API 가용성 의존
**Scale/Scope**: 단일 컴포넌트, 1개 레이아웃 수정

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| I. Test-Smart | ✅ Pass | UI 컴포넌트로 시각적 검증으로 대체, 복잡한 로직 없음 |
| II. Code Quality First | ✅ Pass | TypeScript strict 모드, JSDoc 문서화 적용 |
| III. Documentation First | ✅ Pass | 컴포넌트에 JSDoc 주석 포함 |
| IV. SEO & Accessibility | ✅ Pass | 시맨틱 HTML (`section`, `h2`), 키보드 접근성 (Giscus 기본 제공) |
| V. Portfolio Showcase | N/A | 시연 페이지 아님 |
| VI. Design System | ✅ Pass | 기존 CSS 변수 사용, 다크 모드 동기화 |

**Gate Result**: ✅ PASS - 모든 관련 원칙 충족

## Project Structure

### Documentation (this feature)

```text
specs/007-comments/
├── plan.md              # 이 파일 (구현 계획)
├── spec.md              # 기능 명세서
├── research.md          # Phase 0: Giscus 리서치 결과
├── data-model.md        # Phase 1: 데이터 모델 (GitHub Discussions)
├── quickstart.md        # Phase 1: 빠른 시작 가이드
├── contracts/           # Phase 1: Giscus 설정 계약
│   └── giscus-config.md
└── checklists/
    └── requirements.md  # 명세 품질 체크리스트
```

### Source Code (repository root)

```text
src/
├── components/
│   └── blog/
│       └── Comments.astro    # [NEW] Giscus 댓글 컴포넌트
└── layouts/
    └── BlogPost.astro        # [MODIFY] Comments 컴포넌트 추가
```

**Structure Decision**: 기존 Astro 프로젝트 구조 유지. `src/components/blog/` 하위에 새 컴포넌트 추가, 기존 레이아웃 수정.

## Implementation Overview

### Phase 1: GitHub 설정 (선행 조건)

1. GitHub 레포지토리 Discussions 활성화
2. giscus GitHub App 설치
3. https://giscus.app 에서 설정값 획득
   - `data-repo-id`
   - `data-category-id`

### Phase 2: 컴포넌트 구현

1. `src/components/blog/Comments.astro` 생성
   - Giscus 스크립트 임베드
   - 다크 모드 테마 동기화 로직
   - 스타일링 (기존 디자인 시스템 준수)

2. `src/layouts/BlogPost.astro` 수정
   - Comments 컴포넌트 import
   - article 다음에 Comments 배치

### Phase 3: 검증

1. 로컬 개발 서버에서 테스트
2. 다크 모드 전환 테스트
3. 모바일 반응형 테스트
4. 빌드 테스트 (`pnpm build`)

## Files to Create/Modify

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/components/blog/Comments.astro` | CREATE | Giscus 댓글 컴포넌트 |
| `src/layouts/BlogPost.astro` | MODIFY | Comments 컴포넌트 통합 |

## Dependencies

### External (No Installation Required)

- **Giscus**: `https://giscus.app/client.js` (CDN 스크립트)

### GitHub Setup Required

- GitHub Discussions 활성화
- giscus GitHub App 설치

## Risk Assessment

| 리스크 | 영향 | 완화 전략 |
|--------|------|-----------|
| GitHub API 장애 | 댓글 로딩 실패 | 로딩 상태 표시, 정상 복구 시 자동 로드 |
| GitHub 계정 없는 사용자 | 댓글 작성 불가 | 기술 블로그 특성상 대부분 GitHub 계정 보유 예상 |
| Giscus 서비스 중단 | 댓글 시스템 전체 중단 | 오픈소스로 self-host 가능, 낮은 확률 |

## Complexity Tracking

> 헌법 위반 사항 없음 - 이 섹션 해당 없음

## Related Documents

- [spec.md](./spec.md) - 기능 명세서
- [research.md](./research.md) - Giscus 리서치 결과
- [data-model.md](./data-model.md) - 데이터 모델
- [quickstart.md](./quickstart.md) - 빠른 시작 가이드
- [contracts/giscus-config.md](./contracts/giscus-config.md) - Giscus 설정 계약
