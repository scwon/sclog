# Research: 프로필 사진 Hover 애니메이션

**Feature**: 005-profile-hover
**Date**: 2025-12-07

## 1. CSS 애니메이션 방식 선택

### Decision: CSS Transform + Transition

### Rationale
- `transform: rotate()` 는 GPU 가속되어 60fps 보장
- `transition` 으로 hover 진입/이탈 시 자연스러운 애니메이션
- JavaScript 없이 기본 hover 동작 구현 가능
- `@keyframes` 보다 hover 상태에 맞는 간단한 구현

### Alternatives Considered
| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| CSS `@keyframes` | 복잡한 애니메이션 가능 | hover 상태와 동기화 어려움 | 기각 |
| JavaScript Animation API | 세밀한 제어 | 불필요한 복잡성, 성능 오버헤드 | 기각 |
| CSS Transform + Transition | 간단, GPU 가속, hover 친화적 | - | **채택** |

## 2. 이미지 전환 방식

### Decision: 두 이미지 겹쳐 opacity 전환

### Rationale
- 두 이미지를 absolute position으로 겹쳐 배치
- hover 시 opacity 전환으로 크로스페이드 효과
- 이미지 로드 타이밍 문제 없음 (둘 다 미리 로드됨)
- 회전 애니메이션과 자연스럽게 결합

### Implementation Approach
```css
.profile-avatar {
  position: relative;
}

.profile-avatar img.default {
  opacity: 1;
  transition: opacity 0.6s, transform 0.6s;
}

.profile-avatar img.alternate {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.6s, transform 0.6s;
}

.profile-avatar:hover img.default {
  opacity: 0;
  transform: rotate(360deg);
}

.profile-avatar:hover img.alternate {
  opacity: 1;
  transform: rotate(360deg);
}
```

## 3. 터치 기기 대응

### Decision: JavaScript로 touch 이벤트 처리

### Rationale
- 터치 기기에서 `:hover` 가 일관되게 작동하지 않음
- `touchstart` 이벤트로 클래스 토글
- 다른 곳 탭 시 `touchstart` 로 상태 해제
- CSS 클래스 기반으로 동일한 스타일 적용

### Implementation Approach
```javascript
const avatar = document.querySelector('.profile-avatar');

avatar.addEventListener('touchstart', (e) => {
  e.preventDefault();
  avatar.classList.toggle('active');
});

document.addEventListener('touchstart', (e) => {
  if (!avatar.contains(e.target)) {
    avatar.classList.remove('active');
  }
});
```

## 4. 접근성 (prefers-reduced-motion)

### Decision: 미디어 쿼리로 애니메이션 비활성화

### Rationale
- 사용자가 동작 감소를 설정한 경우 존중
- 이미지 전환은 유지하되 회전 애니메이션만 제거
- 즉시 전환으로 기능은 유지

### Implementation
```css
@media (prefers-reduced-motion: reduce) {
  .profile-avatar img {
    transition: opacity 0.1s;
    transform: none !important;
  }
}
```

## 5. 이미지 프리로드

### Decision: HTML link preload 사용

### Rationale
- 대체 이미지를 미리 로드하여 hover 시 지연 없음
- Astro의 `<head>` 에서 preload link 추가
- 또는 JavaScript `new Image()` 로 로드

### Implementation
```html
<link rel="preload" href="/images/scwon_dot.png" as="image" />
```

## 6. Graceful Degradation

### Decision: CSS 전용 기본 동작 + JS 향상

### Rationale
- JavaScript 비활성화 시에도 CSS hover 작동
- 터치 기기 전용 기능만 JS 의존
- 기본 이미지는 항상 표시

## Summary

| 항목 | 결정 | 이유 |
|------|------|------|
| 애니메이션 | CSS Transform + Transition | GPU 가속, 간단함 |
| 이미지 전환 | opacity 크로스페이드 | 부드러운 전환 |
| 터치 대응 | JS touchstart + 클래스 토글 | hover 대체 |
| 접근성 | prefers-reduced-motion 미디어 쿼리 | 사용자 설정 존중 |
| 프리로드 | link preload | 즉시 표시 |
| 외부 의존성 | 없음 | 네이티브 API만 사용 |
