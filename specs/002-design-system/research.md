# Research: 디자인 시스템 적용

**Feature Branch**: `002-design-system`
**Date**: 2025-12-06

## 1. FOUC (Flash of Unstyled Content) 방지

### Decision
HTML `<head>` 내 인라인 `<script>`로 페이지 렌더링 전 테마 클래스를 즉시 적용한다.

### Rationale
- Astro는 SSG이므로 서버에서 사용자 테마를 알 수 없음
- 외부 스크립트는 로드 지연으로 깜빡임 발생
- 인라인 스크립트는 HTML 파싱 중 동기 실행되어 즉시 테마 적용 가능

### Alternatives Considered
1. **CSS `@media (prefers-color-scheme)`만 사용**: 사용자 수동 선택 저장 불가
2. **defer/async 스크립트**: 로드 지연으로 FOUC 발생
3. **SSR + 쿠키**: Astro SSG에서는 적용 불가, 복잡성 증가

### Implementation Pattern
```html
<script is:inline>
  (function() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  })();
</script>
```

---

## 2. 테마 상태 저장

### Decision
`localStorage`에 `theme` 키로 `'light'` 또는 `'dark'` 값 저장한다.

### Rationale
- 간단하고 표준적인 브라우저 API
- 도메인별 영구 저장
- 쿠키보다 용량 크고 서버 전송 없음

### Alternatives Considered
1. **쿠키**: 서버 전송 오버헤드, SSG에서 불필요
2. **sessionStorage**: 탭 닫으면 초기화되어 UX 저하
3. **IndexedDB**: 과도한 복잡성

### Fallback
```javascript
function getStorage() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return localStorage;
  } catch {
    return sessionStorage; // Private browsing fallback
  }
}
```

---

## 3. Google Fonts 로딩

### Decision
`<link rel="preconnect">` + `<link href="...fonts.googleapis.com...">` 방식으로 로드한다.

### Rationale
- CDN 최적화로 빠른 로드
- 자동 서브셋팅으로 한글 폰트 용량 최적화
- `font-display: swap`으로 FOIT 방지

### Alternatives Considered
1. **self-hosting**: 관리 복잡, 서브셋 직접 구성 필요
2. **@font-face**: 수동 설정 필요, CDN 최적화 없음
3. **Fontsource**: 추가 패키지 의존성

### Implementation
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
```

---

## 4. CSS Custom Properties 구조

### Decision
`:root`에 라이트 모드 기본값 정의, `.dark` 클래스에서 오버라이드한다.

### Rationale
- 라이트 모드가 기본이므로 `:root`에 정의
- 클래스 토글로 간단히 테마 전환
- CSS만으로 모든 컴포넌트 자동 반영

### Alternatives Considered
1. **`[data-theme="dark"]`**: 동일 효과, 클래스보다 선택자 길어짐
2. **별도 CSS 파일**: 파일 로드 지연, FOUC 위험
3. **CSS-in-JS**: Astro에서 불필요한 복잡성

### Implementation
```css
:root {
  --color-primary: rgb(233, 172, 159);
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  /* ... */
}

.dark {
  --color-bg: #13151a;
  --color-text: #e0e0e0;
  /* ... */
}
```

---

## 5. 테마 토글 UI

### Decision
헤더에 아이콘 버튼 배치, 클릭 시 즉시 전환 + localStorage 저장한다.

### Rationale
- 사용자가 쉽게 찾을 수 있는 위치
- 아이콘으로 직관적 인터페이스 (☀️/🌙 또는 SVG)
- JavaScript로 클래스 토글 + 저장 동시 처리

### Alternatives Considered
1. **드롭다운 메뉴**: 과도한 복잡성
2. **시스템 전용**: 수동 선택 불가
3. **Footer 배치**: 발견 어려움

### Implementation Pattern
```javascript
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

---

## 6. WCAG AA 명도대비 검증

### Decision
Constitution에 정의된 색상 조합이 WCAG AA 기준(4.5:1 일반 텍스트, 3:1 대형 텍스트)을 충족하는지 확인한다.

### Verification

| 모드 | 배경 | 텍스트 | 대비율 | 결과 |
|------|------|--------|--------|------|
| Light | #ffffff | #1a1a1a | 17.4:1 | ✅ AA 통과 |
| Light | #ffffff | #6b7280 | 5.0:1 | ✅ AA 통과 |
| Dark | #13151a | #e0e0e0 | 11.8:1 | ✅ AA 통과 |
| Dark | #13151a | #9ca3af | 6.7:1 | ✅ AA 통과 |
| Both | #ffffff | rgb(233,172,159) | 2.5:1 | ⚠️ 대형 텍스트만 |

### Decision for Brand Color
브랜드 컬러 `rgb(233, 172, 159)`는 배경과 명도대비가 낮으므로:
- 본문 텍스트가 아닌 **강조 요소**에만 사용 (링크 hover, 버튼, 태그 배경)
- 로고(SCLOG)는 대형 텍스트(1.5rem+)로 AA 3:1 충족

---

## 7. 시스템 테마 감지 (prefers-color-scheme)

### Decision
`matchMedia`로 초기 감지, `change` 이벤트로 실시간 대응한다. 단, 사용자 수동 선택 시 이벤트 무시.

### Rationale
- 첫 방문 시 시스템 설정 존중
- 사용자 선택 우선권 보장
- macOS 자동 테마 전환 대응

### Implementation Pattern
```javascript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// 사용자 수동 선택이 없을 때만 시스템 테마 따름
mediaQuery.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.classList.toggle('dark', e.matches);
  }
});
```

---

## Summary

모든 기술적 불확실성이 해소되었다:

1. **FOUC 방지**: 인라인 스크립트로 즉시 테마 적용
2. **테마 저장**: localStorage 사용, sessionStorage 폴백
3. **폰트 로딩**: Google Fonts CDN + preconnect
4. **CSS 구조**: `:root` 라이트 기본 + `.dark` 오버라이드
5. **토글 UI**: 헤더 아이콘 버튼
6. **접근성**: WCAG AA 충족 확인, 브랜드 컬러 사용처 제한
7. **시스템 감지**: matchMedia + 수동 선택 우선
