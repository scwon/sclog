# Data Model: 블로그 댓글 기능 (Giscus)

**Feature Branch**: `007-comments`
**Date**: 2025-12-10
**Spec**: [spec.md](./spec.md)

## Overview

Giscus는 GitHub Discussions를 백엔드로 사용하므로, 별도의 데이터 모델을 정의할 필요가 없습니다. 모든 데이터는 GitHub API를 통해 관리됩니다.

## GitHub Discussions 데이터 구조 (외부 관리)

### Discussion (댓글 스레드)
GitHub Discussions에서 자동 생성되며, 블로그 글 하나당 하나의 Discussion이 매핑됩니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | GitHub Discussion ID |
| title | string | 매핑된 페이지 pathname (예: `/blog/my-post`) |
| body | string | Discussion 본문 (자동 생성) |
| category | string | Giscus 카테고리 (예: "General") |
| createdAt | datetime | 생성 시간 |
| locked | boolean | 잠금 상태 |

### Comment (댓글)
Discussion에 달린 댓글입니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 댓글 ID |
| author | User | 작성자 정보 |
| body | string | 댓글 내용 (Markdown) |
| createdAt | datetime | 작성 시간 |
| updatedAt | datetime | 수정 시간 |
| reactions | Reaction[] | 리액션 목록 |
| replies | Comment[] | 답글 목록 |

### User (작성자)
GitHub 사용자 정보입니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| login | string | GitHub 사용자명 |
| avatarUrl | string | 프로필 이미지 URL |
| url | string | GitHub 프로필 링크 |

### Reaction (리액션)
댓글에 대한 이모지 반응입니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| content | enum | 리액션 타입 (+1, -1, laugh, hooray, confused, heart, rocket, eyes) |
| count | number | 해당 리액션 수 |

## 클라이언트 측 상태

Giscus iframe 내에서 관리되며, 별도의 클라이언트 상태 관리가 필요하지 않습니다.

### 테마 상태 (부모 페이지에서 관리)

| 상태 | 타입 | 설명 |
|------|------|------|
| currentTheme | 'light' \| 'dark' | 현재 테마 |

테마 변경 시 `postMessage`로 Giscus iframe에 전달:
```javascript
iframe.contentWindow.postMessage(
  { giscus: { setConfig: { theme: 'dark' } } },
  'https://giscus.app'
)
```

## 데이터 흐름

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Blog Page     │────▶│  Giscus iframe  │────▶│ GitHub GraphQL  │
│   (Astro)       │     │   (Client)      │     │      API        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ postMessage           │ Load/Submit           │ Store
        │ (theme sync)          │ Comments              │ Discussions
        ▼                       ▼                       ▼
```

## 제약사항

1. **GitHub 계정 필수**: 댓글 작성을 위해 GitHub 로그인 필요
2. **외부 의존성**: GitHub API 가용성에 의존
3. **Rate Limiting**: GitHub API 제한 적용 (일반적으로 충분)
4. **데이터 소유권**: 데이터는 GitHub에 저장됨
