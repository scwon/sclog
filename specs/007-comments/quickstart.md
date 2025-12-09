# Quickstart: 블로그 댓글 기능 (Giscus)

**Feature Branch**: `007-comments`
**Date**: 2025-12-10
**예상 소요 시간**: 15-30분

## Prerequisites

- [ ] GitHub 레포지토리가 **Public**인지 확인
- [ ] GitHub 레포지토리에 **Discussions** 기능 활성화
- [ ] [giscus GitHub App](https://github.com/apps/giscus) 설치

## Step 1: GitHub 설정

### 1.1 Discussions 활성화

1. GitHub 레포지토리 (`scwon/sclog`) 접속
2. **Settings** → **Features** 섹션
3. **Discussions** 체크박스 활성화

### 1.2 Giscus 설정값 획득

1. https://giscus.app 접속
2. **Repository** 필드에 `scwon/sclog` 입력
3. "Success! This repository meets all of the above criteria." 메시지 확인
4. **Page ↔ Discussions Mapping** → `pathname` 선택
5. **Discussion Category** → `General` (또는 원하는 카테고리)
6. **Features** 설정:
   - [x] Enable reactions for the main post
   - [x] Emit discussion metadata
7. 생성된 스크립트에서 다음 값 복사:
   - `data-repo-id`: ________________
   - `data-category-id`: ________________

## Step 2: Comments 컴포넌트 생성

### 2.1 파일 생성

```bash
# src/components/blog/Comments.astro 생성
```

### 2.2 컴포넌트 코드

```astro
---
/**
 * Giscus 댓글 컴포넌트
 * GitHub Discussions 기반 댓글 시스템
 */
---

<section class="comments-section">
  <h2 class="comments-title">댓글</h2>
  <div class="giscus-container">
    <script
      is:inline
      src="https://giscus.app/client.js"
      data-repo="scwon/sclog"
      data-repo-id="[YOUR-REPO-ID]"
      data-category="General"
      data-category-id="[YOUR-CATEGORY-ID]"
      data-mapping="pathname"
      data-strict="0"
      data-reactions-enabled="1"
      data-emit-metadata="0"
      data-input-position="bottom"
      data-theme="light"
      data-lang="ko"
      data-loading="lazy"
      crossorigin="anonymous"
      async
    ></script>
  </div>
</section>

<script>
  /**
   * Giscus 테마를 현재 사이트 테마와 동기화
   */
  function updateGiscusTheme(): void {
    const theme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme } } },
      'https://giscus.app'
    );
  }

  // 테마 변경 감지
  const observer = new MutationObserver(updateGiscusTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // 초기 테마 설정
  window.addEventListener('load', updateGiscusTheme);
</script>

<style>
  .comments-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }

  .comments-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }

  .giscus-container {
    min-height: 200px;
  }
</style>
```

## Step 3: BlogPost 레이아웃에 통합

### 3.1 BlogPost.astro 수정

```astro
---
// 기존 import 유지
import Comments from '../components/blog/Comments.astro';
---

<!-- 기존 코드 유지 -->
<BaseLayout ...>
  <!-- ... -->
  <main class="container">
    <div class="content-grid">
      <article class="blog-post">
        <!-- 기존 article 내용 -->
      </article>

      <!-- 댓글 섹션 추가 -->
      <Comments />

      <aside class="toc-sidebar">
        <!-- 기존 TOC -->
      </aside>
    </div>
  </main>
  <!-- ... -->
</BaseLayout>
```

## Step 4: 검증

### 4.1 로컬 테스트

```bash
pnpm dev
```

1. 블로그 글 페이지 접속
2. 페이지 하단에 Giscus 댓글 영역 표시 확인
3. GitHub 로그인 후 테스트 댓글 작성
4. 다크 모드 전환 시 테마 동기화 확인

### 4.2 빌드 테스트

```bash
pnpm build
```

빌드 성공 확인

## Step 5: 배포

```bash
git add .
git commit -m "feat: Giscus 댓글 시스템 추가"
git push origin 007-comments
```

## Troubleshooting

### "Rate limit exceeded" 오류
- GitHub API 제한에 도달. 잠시 후 재시도.

### 댓글이 표시되지 않음
- Discussions 기능 활성화 확인
- giscus GitHub App 설치 확인
- `data-repo-id`, `data-category-id` 값 확인

### 다크 모드가 동기화되지 않음
- `is:inline` 속성 확인
- MutationObserver 스크립트가 올바르게 로드되었는지 확인

## Configuration Reference

| 속성 | 값 | 설명 |
|------|-----|------|
| `data-repo` | `scwon/sclog` | GitHub 레포지토리 |
| `data-mapping` | `pathname` | URL 경로로 Discussion 매핑 |
| `data-theme` | `light` | 초기 테마 (동적 변경됨) |
| `data-lang` | `ko` | UI 언어 (한국어) |
| `data-loading` | `lazy` | 지연 로딩 |
