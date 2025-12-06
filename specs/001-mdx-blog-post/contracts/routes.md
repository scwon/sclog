# Routes Contract: MDX 블로그 포스트 시스템

**Feature**: 001-mdx-blog-post
**Date**: 2025-12-06

## 페이지 라우트

이 프로젝트는 정적 사이트 생성(SSG)을 사용하므로 API가 아닌 페이지 라우트를 정의합니다.

### 블로그 목록 페이지

| Route | File | Description |
|-------|------|-------------|
| `/blog` | `src/pages/blog/index.astro` | 모든 블로그 글 목록 (최신순) |

**Response**: HTML 페이지
- 발행된 모든 글의 목록
- 각 글: 제목, 발행일, 설명, 태그
- 미래 날짜 글은 제외

### 블로그 상세 페이지

| Route | File | Description |
|-------|------|-------------|
| `/blog/[slug]` | `src/pages/blog/[slug].astro` | 개별 블로그 글 |

**Parameters**:
- `slug`: 글의 고유 식별자 (파일명 기반)

**Response**: HTML 페이지
- 글 제목, 발행일, 수정일
- 본문 (MDX → HTML)
- 태그 목록 (클릭 가능)
- 대표 이미지 (있는 경우)
- SEO 메타 태그

**Error**: 404 페이지 (슬러그가 존재하지 않는 경우)

### 태그 목록 페이지

| Route | File | Description |
|-------|------|-------------|
| `/blog/tags` | `src/pages/blog/tags/index.astro` | 모든 태그 목록 |

**Response**: HTML 페이지
- 사용된 모든 태그
- 각 태그별 글 개수
- 태그 클릭 시 해당 태그 페이지로 이동

### 태그별 글 목록 페이지

| Route | File | Description |
|-------|------|-------------|
| `/blog/tags/[tag]` | `src/pages/blog/tags/[tag].astro` | 특정 태그의 글 목록 |

**Parameters**:
- `tag`: 태그 이름 (URL-encoded)

**Response**: HTML 페이지
- 해당 태그를 가진 글 목록
- 블로그 목록 페이지와 동일한 형식

**Error**: 404 페이지 (태그가 존재하지 않는 경우)

## 정적 파일

| Route | Source | Description |
|-------|--------|-------------|
| `/sitemap.xml` | 자동 생성 | 사이트맵 (SEO) |
| `/rss.xml` | `src/pages/rss.xml.ts` | RSS 피드 (선택사항) |

## URL 구조 요약

```
/blog                     # 블로그 목록
/blog/hello-world         # 개별 글
/blog/astro-tutorial      # 개별 글
/blog/tags                # 태그 목록
/blog/tags/astro          # 'astro' 태그 글
/blog/tags/tutorial       # 'tutorial' 태그 글
```

## SEO 메타 태그 Contract

각 페이지에 포함되어야 하는 메타 태그:

### 필수 태그

```html
<title>{pageTitle} | SCLOG</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{fullUrl}" />
```

### Open Graph 태그

```html
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:type" content="article" /> <!-- 글 페이지 -->
<meta property="og:url" content="{fullUrl}" />
<meta property="og:image" content="{heroImage}" /> <!-- 있는 경우 -->
```

### Twitter Card 태그

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
```

### Article 메타데이터 (글 페이지만)

```html
<meta property="article:published_time" content="{pubDate}" />
<meta property="article:modified_time" content="{updatedDate}" /> <!-- 있는 경우 -->
<meta property="article:tag" content="{tag}" /> <!-- 각 태그마다 -->
```
