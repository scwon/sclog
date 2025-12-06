# Research: MDX 기반 블로그 포스트 시스템

**Feature**: 001-mdx-blog-post
**Date**: 2025-12-06

## 기술 결정 사항

### 1. MDX 통합 방식

**Decision**: Astro Content Collections + @astrojs/mdx 통합 사용

**Rationale**:
- Astro 5.x는 Content Collections를 통해 MDX를 네이티브로 지원
- 타입 안전한 frontmatter 스키마 정의 가능
- 빌드 타임에 콘텐츠 검증 및 최적화
- 자동 슬러그 생성 및 라우팅

**Alternatives considered**:
- 순수 Markdown + remark 플러그인: JSX 컴포넌트 사용 불가
- 외부 CMS (Contentful, Sanity): 오버엔지니어링, 파일 기반이 더 적합

### 2. 구문 강조 (Syntax Highlighting)

**Decision**: Shiki (Astro 기본 내장) 사용

**Rationale**:
- Astro 5.x에 기본 포함되어 추가 설정 불필요
- VS Code와 동일한 테마 지원
- 빌드 타임 하이라이팅으로 런타임 오버헤드 없음
- 다양한 언어 지원

**Alternatives considered**:
- Prism.js: 런타임 하이라이팅, 추가 JS 번들 필요
- highlight.js: 테마 선택 제한

### 3. SEO 및 메타 태그

**Decision**: Astro SEO 패턴 + 사이트맵 통합 사용

**Rationale**:
- `<head>` 컴포넌트를 통한 동적 메타 태그 생성
- @astrojs/sitemap 통합으로 자동 사이트맵 생성
- Open Graph, Twitter Card 표준 지원

**Alternatives considered**:
- 수동 메타 태그 관리: 유지보수 어려움, 일관성 문제

### 4. 콘텐츠 디렉토리 구조

**Decision**: `src/content/blog/` 디렉토리 사용

**Rationale**:
- Astro Content Collections 규약 준수
- 타입 안전성 및 자동 완성 지원
- 향후 다른 콘텐츠 타입(projects, demos) 추가 용이

**Structure**:
```
src/content/
├── config.ts          # Content Collections 스키마 정의
└── blog/
    ├── first-post.mdx
    ├── second-post.mdx
    └── ...
```

### 5. 태그 시스템

**Decision**: frontmatter의 tags 배열 + 동적 태그 페이지 생성

**Rationale**:
- 별도 데이터베이스 불필요, 파일 기반으로 충분
- Astro의 getStaticPaths()로 빌드 타임에 태그 페이지 생성
- 태그 목록은 모든 글에서 자동 추출

### 6. 예약 발행 (Scheduled Publishing)

**Decision**: frontmatter의 pubDate + 빌드 타임 필터링

**Rationale**:
- 빌드 시점에 pubDate가 미래인 글은 목록에서 제외
- SSG 특성상 예약 발행은 빌드 타이밍에 의존
- CI/CD에서 정기 빌드로 자동화 가능

## 의존성 목록

| 패키지 | 용도 | 버전 |
|--------|------|------|
| @astrojs/mdx | MDX 지원 통합 | latest |
| @astrojs/sitemap | 사이트맵 자동 생성 | latest |
| astro | 프레임워크 | 5.x |

## 성능 고려사항

- **빌드 타임 최적화**: 모든 MDX는 빌드 시 HTML로 변환, 런타임 처리 없음
- **이미지 최적화**: Astro의 `<Image>` 컴포넌트로 자동 최적화
- **코드 스플리팅**: 각 페이지별 필요한 CSS/JS만 로드

## 보안 고려사항

- MDX는 빌드 타임에 처리되므로 런타임 XSS 위험 없음
- 사용자 입력 없음 (정적 콘텐츠만)
- 외부 의존성 최소화
