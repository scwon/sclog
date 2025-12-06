# Data Model: 디자인 시스템 적용

**Feature Branch**: `002-design-system`
**Date**: 2025-12-06

## Entities

### 1. Theme State

테마 상태는 서버 측 데이터베이스가 아닌 클라이언트 측 브라우저 스토리지에서 관리된다.

```typescript
/**
 * 테마 타입 정의
 */
type ThemeValue = 'light' | 'dark';

/**
 * 테마 저장소 인터페이스
 */
interface ThemeStorage {
  /** 저장된 테마 값 (없으면 null) */
  theme: ThemeValue | null;
}
```

| Field | Type | Storage | Description |
|-------|------|---------|-------------|
| theme | `'light' \| 'dark' \| null` | localStorage | 사용자 선택 테마. null이면 시스템 테마 사용 |

### 2. Design Tokens

CSS Custom Properties로 정의되는 디자인 토큰. Constitution에서 정의된 값 그대로 사용.

```typescript
/**
 * 디자인 토큰 정의 (CSS Custom Properties)
 */
interface DesignTokens {
  // Colors
  '--color-primary': string;      // rgb(233, 172, 159)
  '--color-bg': string;           // Light: #ffffff, Dark: #13151a
  '--color-text': string;         // Light: #1a1a1a, Dark: #e0e0e0
  '--color-text-muted': string;   // Light: #6b7280, Dark: #9ca3af
  '--color-border': string;       // Light: #e5e7eb, Dark: #2d2d2d

  // Typography
  '--font-sans': string;          // 'Noto Sans KR', sans-serif
  '--font-logo': string;          // 'Roboto', sans-serif
  '--font-mono': string;          // Menlo, monospace

  // Layout
  '--max-width-content': string;  // 800px
  '--max-width-wide': string;     // 1000px
  '--radius-card': string;        // 8px
  '--radius-button': string;      // 4px
  '--radius-tag': string;         // 9999px
}
```

---

## State Transitions

### Theme State Machine

```
┌─────────────┐
│   Initial   │
│  (no theme) │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Check localStorage('theme')              │
└──────┬───────────────────┬───────────────┘
       │ exists            │ null
       ▼                   ▼
┌─────────────┐    ┌───────────────────────┐
│ Use stored  │    │ Check prefers-color-  │
│   theme     │    │ scheme media query    │
└─────────────┘    └───────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              │ dark                    │ light
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │ Apply dark  │           │ Apply light │
       │   class     │           │  (default)  │
       └─────────────┘           └─────────────┘
```

### User Toggle Flow

```
┌─────────────────┐
│ User clicks     │
│ toggle button   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Toggle 'dark' class on <html>           │
│ classList.toggle('dark')                │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Save to localStorage                    │
│ localStorage.setItem('theme', newTheme) │
└─────────────────────────────────────────┘
```

---

## Validation Rules

### Theme Value
- `theme` 값은 `'light'`, `'dark'`, 또는 `null`만 허용
- localStorage에서 유효하지 않은 값 발견 시 `null` 처리 (시스템 테마 사용)

### Design Token Values
- 색상 값은 CSS 유효 색상 형식 (hex, rgb, hsl)
- 크기 값은 CSS 유효 단위 포함 (px, rem, %)
- Constitution에 정의된 값과 일치해야 함

---

## Storage Schema

### localStorage

| Key | Type | Example | Description |
|-----|------|---------|-------------|
| `theme` | string | `"dark"` | 사용자 선택 테마 |

### CSS Custom Properties (`:root`)

```css
/* Light mode (default) */
:root {
  --color-primary: rgb(233, 172, 159);
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;

  --font-sans: 'Noto Sans KR', system-ui, sans-serif;
  --font-logo: 'Roboto', sans-serif;
  --font-mono: Menlo, Monaco, 'Courier New', monospace;

  --max-width-content: 800px;
  --max-width-wide: 1000px;
  --radius-card: 8px;
  --radius-button: 4px;
  --radius-tag: 9999px;
}

/* Dark mode override */
.dark {
  --color-bg: #13151a;
  --color-text: #e0e0e0;
  --color-text-muted: #9ca3af;
  --color-border: #2d2d2d;
}
```
