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

`src/content.config.ts`가 단일 기준이다. 필드와 제한값은 그 파일을 읽는다. 여기에는 코드가 말해 주지 않는 규칙만 둔다.

- 글의 `id`는 파일명에서 확장자를 뺀 slug이며 URL `/blog/<id>/`가 된다. 파일명을 바꾸면 URL이 바뀐다.
- 본문 원문은 `post.body`, 렌더는 `render(post)` (`astro:content`). `node:fs`로 원문을 읽지 않는다.
- `draft: true`이거나 `pubDate`가 미래인 글은 목록에서 빠진다 (`src/utils/blog.ts`).

## 파일 위치

`src/content/blog/*.mdx`

## 검증

- 스키마 위반 시 빌드 타임에 에러 발생
- `pnpm build`로 검증 가능
