---
name: design-tokens
description: 스타일링 작업 시 CSS 변수, 컬러, 타이포그래피, 레이아웃 토큰 값이 필요할 때 사용
---

# Design Tokens

SCLOG 디자인 시스템의 토큰 값 참조 가이드.

## 컬러 팔레트

| 토큰 | 라이트 모드 | 다크 모드 | 용도 |
|------|-------------|-----------|------|
| `--color-primary` | `rgb(233, 172, 159)` | `rgb(233, 172, 159)` | 브랜드, 강조, 링크 |
| `--color-bg` | `#ffffff` | `#13151a` | 배경 |
| `--color-text` | `#1a1a1a` | `#e0e0e0` | 본문 텍스트 |
| `--color-text-muted` | `#6b7280` | `#9ca3af` | 보조 텍스트 |
| `--color-border` | `#e5e7eb` | `#2d2d2d` | 테두리 |

## 성능 지표 색상

| 상태 | 색상 | 기준 |
|------|------|------|
| Good | `#0cce6b` | Google 권장 기준 충족 |
| Needs Improvement | `#ffa400` | 기준 초과, 개선 권장 |
| Poor | `#ff4e42` | 사용자 경험 저하 |

## 타이포그래피

| 요소 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 로고 (SCLOG) | Roboto | 1.5rem+ | 700 |
| h1 | Noto Sans KR | 2.5rem | 700 |
| h2 | Noto Sans KR | 1.75rem | 600 |
| 본문 | Noto Sans KR | 1rem | 400 |
| 코드 | Menlo, monospace | 0.9rem | 400 |

## 레이아웃

- **최대 너비**: 콘텐츠 800px, 넓은 레이아웃 1000px
- **패딩**: 1rem (모바일), 2rem (데스크톱)
- **라운딩**: 8px (카드), 4px (버튼), 9999px (태그)

## 테마 적용

CSS 변수는 `src/layouts/BaseLayout.astro`에 정의됨.
`data-theme="dark"` 속성으로 다크 모드 전환.

```css
/* 사용 예시 */
.card {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```
