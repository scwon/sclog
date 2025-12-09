# Giscus Configuration Contract

**Feature Branch**: `007-comments`
**Date**: 2025-12-10

## Overview

Giscus는 외부 서비스이므로 REST/GraphQL API 계약이 아닌 **설정 계약**을 정의합니다.

## Required Configuration

### 1. Script Attributes

| Attribute | Required | Value | Description |
|-----------|----------|-------|-------------|
| `data-repo` | ✅ | `scwon/sclog` | GitHub 레포지토리 |
| `data-repo-id` | ✅ | `{REPO_ID}` | giscus.app에서 획득 |
| `data-category` | ✅ | `General` | Discussion 카테고리 |
| `data-category-id` | ✅ | `{CATEGORY_ID}` | giscus.app에서 획득 |
| `data-mapping` | ✅ | `pathname` | URL 경로로 매핑 |
| `data-strict` | ⬜ | `0` | 느슨한 제목 매칭 |
| `data-reactions-enabled` | ⬜ | `1` | 리액션 활성화 |
| `data-emit-metadata` | ⬜ | `0` | 메타데이터 비활성화 |
| `data-input-position` | ⬜ | `bottom` | 입력창 하단 배치 |
| `data-theme` | ⬜ | `light` | 초기 테마 |
| `data-lang` | ⬜ | `ko` | 한국어 UI |
| `data-loading` | ⬜ | `lazy` | 지연 로딩 |

### 2. Script Source

```html
<script
  is:inline
  src="https://giscus.app/client.js"
  crossorigin="anonymous"
  async
></script>
```

## PostMessage API (Theme Sync)

### Message Format

```typescript
interface GiscusMessage {
  giscus: {
    setConfig: {
      theme?: 'light' | 'dark' | string; // URL to custom CSS
      lang?: string;
      // other config options
    }
  }
}
```

### Usage

```javascript
const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
if (iframe?.contentWindow) {
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: 'dark' } } },
    'https://giscus.app'
  );
}
```

## Environment Variables (Optional)

민감한 정보는 없으나, 환경 변수로 관리할 경우:

```env
# .env (optional, for reference only)
PUBLIC_GISCUS_REPO=scwon/sclog
PUBLIC_GISCUS_REPO_ID=xxx
PUBLIC_GISCUS_CATEGORY=General
PUBLIC_GISCUS_CATEGORY_ID=xxx
```

> ⚠️ 참고: `repo-id`와 `category-id`는 공개되어도 보안 문제가 없습니다. GitHub App 권한으로 보호됩니다.

## GitHub Repository Setup

### Prerequisites

1. GitHub 레포지토리가 **Public**이어야 함
2. **Discussions** 기능이 활성화되어야 함
3. [giscus GitHub App](https://github.com/apps/giscus) 설치 필요

### Setup Steps

1. Repository Settings → Features → Discussions 체크
2. https://giscus.app 방문
3. Repository 입력 및 설정 완료
4. 생성된 `data-repo-id`, `data-category-id` 복사

## Validation Checklist

- [ ] GitHub 레포지토리 Public 확인
- [ ] Discussions 기능 활성화 확인
- [ ] giscus GitHub App 설치 확인
- [ ] giscus.app에서 "Success!" 메시지 확인
- [ ] `data-repo-id` 획득
- [ ] `data-category-id` 획득
