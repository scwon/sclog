# Data Model: MDX 기반 블로그 포스트 시스템

**Feature**: 001-mdx-blog-post
**Date**: 2025-12-06

## Entities

### BlogPost

블로그 글을 나타내는 핵심 엔티티. MDX 파일의 frontmatter와 본문으로 구성.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✅ | 글 제목 |
| slug | string | ✅ | URL 경로 (파일명에서 자동 생성) |
| pubDate | Date | ✅ | 발행일 |
| updatedDate | Date | ❌ | 수정일 (선택) |
| description | string | ✅ | 글 요약/설명 (SEO용) |
| tags | string[] | ❌ | 태그 목록 (기본: 빈 배열) |
| heroImage | string | ❌ | 대표 이미지 URL |
| draft | boolean | ❌ | 초안 여부 (기본: false) |
| body | MDX Content | ✅ | 본문 내용 |

**Validation Rules**:
- `title`: 1-100자
- `slug`: 영문 소문자, 숫자, 하이픈만 허용 (`/^[a-z0-9-]+$/`)
- `pubDate`: 유효한 날짜 형식 (YYYY-MM-DD)
- `description`: 1-160자 (SEO 최적화)
- `tags`: 각 태그는 1-30자, 최대 10개

**State Transitions**:
```
[Draft] ---(pubDate 도달)---> [Published]
[Published] ---(draft: true 설정)---> [Draft]
```

### Tag

글 분류를 위한 태그. 별도 저장소 없이 글에서 동적으로 추출.

| Field | Type | Description |
|-------|------|-------------|
| name | string | 태그 이름 |
| slug | string | URL-safe 태그 식별자 |
| count | number | 해당 태그를 가진 글 수 |

**Derived from**: BlogPost.tags 필드에서 자동 수집

## Content Collection Schema

Astro Content Collections를 위한 스키마 정의:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(100),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    description: z.string().min(1).max(160),
    tags: z.array(z.string().min(1).max(30)).max(10).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

## File Structure

```
src/content/blog/
├── hello-world.mdx           # slug: "hello-world"
├── astro-tutorial.mdx        # slug: "astro-tutorial"
└── react-hooks-guide.mdx     # slug: "react-hooks-guide"
```

## Frontmatter Example

```yaml
---
title: "Astro 5로 블로그 만들기"
pubDate: 2025-12-06
description: "Astro 5의 새로운 기능을 활용해 정적 블로그를 만드는 방법을 알아봅니다."
tags: ["astro", "tutorial", "web"]
heroImage: "/images/astro-blog.png"
draft: false
---
```

## Relationships

```
BlogPost *------ Tag (many-to-many, 동적)
    |
    +-- has heroImage (optional, 1:1)
```

## Query Patterns

| Query | Use Case |
|-------|----------|
| 모든 발행된 글 (날짜순) | 블로그 목록 페이지 |
| 특정 슬러그의 글 | 글 상세 페이지 |
| 특정 태그의 글 | 태그 필터 페이지 |
| 모든 태그 + 글 수 | 태그 목록 페이지 |
| 미래 날짜 제외 필터 | 예약 발행 지원 |
