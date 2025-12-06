# Quickstart: 디자인 시스템 적용

**Feature Branch**: `002-design-system`
**Date**: 2025-12-06

## 개요

이 문서는 디자인 시스템 구현 후 개발자가 새 컴포넌트나 페이지를 만들 때 참고할 가이드이다.

---

## 테마 사용법

### 색상 사용

```css
/* ✅ 올바른 사용 - CSS Custom Properties 사용 */
.my-component {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* ❌ 잘못된 사용 - 하드코딩된 색상 */
.my-component {
  background: #ffffff;
  color: #1a1a1a;
}
```

### 사용 가능한 색상 토큰

| 토큰 | 용도 |
|------|------|
| `--color-primary` | 브랜드 강조, 링크, 버튼 |
| `--color-bg` | 페이지/컴포넌트 배경 |
| `--color-text` | 본문 텍스트 |
| `--color-text-muted` | 보조 텍스트, 메타 정보 |
| `--color-border` | 테두리, 구분선 |

---

## 타이포그래피

### 폰트 사용

```css
/* 본문 (기본) */
body {
  font-family: var(--font-sans);
}

/* 로고 (SCLOG) */
.logo {
  font-family: var(--font-logo);
  font-weight: 700;
  text-transform: uppercase; /* 반드시 대문자 */
}

/* 코드 블록 */
code {
  font-family: var(--font-mono);
}
```

### 로고 표기 규칙

```astro
<!-- ✅ 올바름 -->
<span class="logo">SCLOG</span>

<!-- ❌ 잘못됨 -->
<span class="logo">Sclog</span>
<span class="logo">sclog</span>
```

---

## 레이아웃

### 컨테이너

```css
/* 기본 콘텐츠 너비 */
.container {
  max-width: var(--max-width-content); /* 800px */
  margin: 0 auto;
  padding: 0 1rem;
}

/* 넓은 레이아웃 */
.container-wide {
  max-width: var(--max-width-wide); /* 1000px */
}

@media (min-width: 640px) {
  .container {
    padding: 0 2rem;
  }
}
```

### 컴포넌트 라운딩

| 컴포넌트 | 토큰 | 값 |
|----------|------|-----|
| 카드 | `--radius-card` | 8px |
| 버튼 | `--radius-button` | 4px |
| 태그 | `--radius-tag` | 9999px (pill) |

```css
.card {
  border-radius: var(--radius-card);
}

.tag {
  border-radius: var(--radius-tag);
}
```

---

## 다크 모드 대응

### 자동 대응 (권장)

CSS Custom Properties를 사용하면 다크 모드 자동 대응:

```css
/* 별도 미디어 쿼리 불필요 */
.component {
  background: var(--color-bg);
  color: var(--color-text);
}
```

### 모드별 다른 스타일 필요 시

```css
/* 라이트 모드 전용 */
:root:not(.dark) .component {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 다크 모드 전용 */
.dark .component {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

---

## 새 페이지 생성

### 기본 구조

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
---

<BaseLayout title="페이지 제목" description="페이지 설명">
  <Header />
  <main class="container">
    <!-- 페이지 콘텐츠 -->
  </main>
</BaseLayout>

<style>
  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 2rem 1rem;
  }
</style>
```

---

## 테마 토글 접근

JavaScript에서 테마 상태 접근:

```javascript
// 현재 테마 확인
const isDark = document.documentElement.classList.contains('dark');

// 테마 변경
function setTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
}

// 저장된 테마 읽기
const savedTheme = localStorage.getItem('theme'); // 'light', 'dark', or null
```

---

## 체크리스트

새 컴포넌트 생성 시 확인:

- [ ] 하드코딩된 색상 대신 `var(--color-*)` 사용
- [ ] 하드코딩된 폰트 대신 `var(--font-*)` 사용
- [ ] 라이트/다크 모드 모두에서 시각적 확인
- [ ] "SCLOG" 표기 시 대문자 사용
- [ ] 브랜드 컬러는 강조 요소에만 사용 (본문 텍스트 X)
