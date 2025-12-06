# Quickstart: MDX 블로그 포스트 시스템

**Feature**: 001-mdx-blog-post
**Date**: 2025-12-06

## 사전 요구사항

- Node.js 18+
- pnpm

## 설치

```bash
# 의존성 설치
pnpm install

# MDX 통합 추가 (아직 없는 경우)
pnpm add @astrojs/mdx @astrojs/sitemap
```

## 설정

### 1. Astro 설정 업데이트

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://your-domain.com', // 실제 도메인으로 변경
  integrations: [mdx(), sitemap()],
});
```

### 2. Content Collection 설정

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

## 블로그 글 작성

### 1. 새 글 생성

`src/content/blog/` 디렉토리에 `.mdx` 파일 생성:

```bash
touch src/content/blog/my-first-post.mdx
```

### 2. Frontmatter 작성

```yaml
---
title: "내 첫 번째 블로그 글"
pubDate: 2025-12-06
description: "Astro와 MDX로 작성한 첫 블로그 글입니다."
tags: ["astro", "블로그"]
heroImage: "/images/first-post.png"
---
```

### 3. 본문 작성

```mdx
# 안녕하세요!

이것은 **MDX**로 작성된 블로그 글입니다.

## 코드 예시

```typescript
const greeting = "Hello, World!";
console.log(greeting);
```

## 이미지

![대체 텍스트](/images/example.png)
```

## 개발 서버 실행

```bash
pnpm dev
```

접속: http://localhost:4321/blog

## 빌드 및 미리보기

```bash
# 빌드
pnpm build

# 미리보기
pnpm preview
```

## 검증 체크리스트

- [ ] `/blog` 페이지에 글 목록이 표시됨
- [ ] `/blog/[slug]` 페이지에서 개별 글이 렌더링됨
- [ ] 코드 블록에 구문 강조가 적용됨
- [ ] 태그 클릭 시 해당 태그 페이지로 이동
- [ ] HTML 소스에 SEO 메타 태그가 포함됨
- [ ] `dist/sitemap.xml` 파일이 생성됨

## 문제 해결

### Content Collection 오류

```bash
# 타입 재생성
pnpm astro sync
```

### MDX 렌더링 오류

- frontmatter 형식 확인 (YAML 문법)
- 날짜 형식: `YYYY-MM-DD`
- 필수 필드 누락 확인: title, pubDate, description
