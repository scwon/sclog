---
name: content-schema
description: 블로그 포스트 MDX 파일 작성 시 frontmatter 스키마와 필수 필드가 필요할 때 사용
---

# Content Schema

블로그 포스트 MDX 파일의 frontmatter 스키마 가이드.

## 필수 필드

```yaml
---
title: "포스트 제목"           # 1-100자
pubDate: 2024-01-15            # ISO 날짜 형식
description: "포스트 설명"     # 1-160자 (SEO용)
tags: ["astro", "typescript"]  # 최대 10개, 각 1-30자
---
```

## 선택 필드

```yaml
---
heroImage: "/images/blog/hero.jpg"  # 히어로 이미지 경로
draft: true                          # true면 빌드에서 제외
updatedDate: 2024-01-20              # 수정일
---
```

## 스키마 정의 위치

`src/content/config.ts`에 Zod 스키마로 정의됨:

```typescript
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().min(1).max(100),
    pubDate: z.date(),
    description: z.string().min(1).max(160),
    tags: z.array(z.string().min(1).max(30)).max(10),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
    updatedDate: z.date().optional(),
  }),
});
```

## 파일 위치

`src/content/blog/*.mdx`

## 검증

- 스키마 위반 시 빌드 타임에 에러 발생
- `pnpm build`로 검증 가능
