# Research: 프로필 스핀 애니메이션

**Date**: 2025-12-15
**Feature**: 009-profile-spin

## 1. 마우스 속도 측정 방법

### Decision
`mousemove` 이벤트의 타임스탬프와 좌표 변화를 이용해 속도를 계산한다.

### Rationale
- 브라우저 네이티브 이벤트만으로 충분히 정확한 속도 측정 가능
- 외부 라이브러리 불필요
- `event.movementX`, `event.movementY` 또는 이전 좌표와의 차이로 계산

### Implementation
```typescript
// 마우스 이동 속도 계산 (pixels per second)
let lastX = 0, lastY = 0, lastTime = 0;

function calculateVelocity(e: MouseEvent): number {
  const now = performance.now();
  const dt = now - lastTime;

  if (dt === 0) return 0;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const velocity = (distance / dt) * 1000; // px/s

  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = now;

  return velocity;
}
```

### Alternatives Considered
- Pointer Events API: 더 범용적이지만 마우스 전용으로는 과함
- Touch velocity libraries: 터치 기기용이며 마우스에는 불필요

---

## 2. 연속 회전 애니메이션 구현

### Decision
`requestAnimationFrame`과 CSS `transform: rotateY()`를 조합해 60fps 애니메이션 구현.

### Rationale
- CSS animation보다 JavaScript 제어가 가능해 속도 조절 용이
- `requestAnimationFrame`은 브라우저 최적화 및 배터리 효율성 보장
- 탭이 비활성화되면 자동 일시정지

### Implementation
```typescript
let rotation = 0;
let angularVelocity = 0; // degrees per frame
const friction = 0.98; // 감속 계수

function animate() {
  if (Math.abs(angularVelocity) < 0.1) {
    // 충분히 느려지면 정지
    angularVelocity = 0;
    return;
  }

  rotation += angularVelocity;
  angularVelocity *= friction; // 마찰에 의한 감속

  element.style.transform = `rotateY(${rotation}deg)`;
  requestAnimationFrame(animate);
}
```

### Alternatives Considered
- CSS `@keyframes infinite`: 속도 제어 불가
- Web Animations API: 지원은 좋지만 동적 속도 변경이 복잡
- GSAP: 우수하지만 외부 의존성 추가 필요

---

## 3. 기존 hover 애니메이션과 공존

### Decision
스핀 상태를 별도로 관리하고, 스핀 중에는 hover transition을 비활성화.

### Rationale
- 기존 코드: hover 시 `rotateY(180deg)`로 뒤집기
- 스핀 중에는 JavaScript가 `transform`을 직접 제어
- 스핀이 끝나면 CSS transition 복원

### Implementation
```typescript
// 스핀 시작 시
avatar.classList.add('spinning');
// CSS에서 .spinning일 때 transition: none

// 스핀 종료 시
avatar.classList.remove('spinning');
// CSS transition 복원
```

### CSS 추가
```css
.profile-avatar.spinning .avatar-default,
.profile-avatar.spinning .avatar-alternate {
  transition: none; /* JavaScript 제어 중 transition 비활성화 */
}
```

---

## 4. 물리 기반 감속 (마찰 시뮬레이션)

### Decision
지수 감쇠(exponential decay) 모델 사용: `v = v0 * friction^t`

### Rationale
- 실제 마찰과 유사한 자연스러운 감속
- 계산이 단순하고 60fps에서 부드럽게 동작
- friction 값으로 감속 정도 조절 가능

### Parameters
- `friction = 0.98`: 자연스러운 감속 (약 3-5초 지속)
- `friction = 0.99`: 더 오래 지속
- `friction = 0.95`: 빠르게 정지

### Alternatives Considered
- 선형 감속: 자연스럽지 않음
- 물리 엔진 (matter.js 등): 과도한 복잡성

---

## 5. 터치 기기 대응

### Decision
터치 기기에서는 빠른 스와이프 제스처로 스핀 트리거.

### Rationale
- 터치 기기에서 마우스 "스쳐 지나가기"는 불가능
- 스와이프 속도 측정은 `touchmove` 이벤트로 유사하게 구현 가능

### Implementation
```typescript
let touchStartX = 0, touchStartTime = 0;

avatar.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartTime = performance.now();
});

avatar.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dt = performance.now() - touchStartTime;
  const velocity = Math.abs(dx / dt) * 1000;

  if (velocity > THRESHOLD) {
    startSpin(velocity);
  }
});
```

---

## 6. 접근성 (prefers-reduced-motion)

### Decision
`prefers-reduced-motion: reduce` 미디어 쿼리를 JavaScript에서도 확인하여 스핀 비활성화.

### Rationale
- 헌법 IV. SEO & Accessibility 준수
- 일부 사용자는 움직임으로 인해 불편함을 느낌

### Implementation
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // 스핀 기능 비활성화, 기존 hover 동작만 유지
  return;
}
```

---

## 7. 마우스 속도 임계값

### Decision
기본 임계값 800px/s, 테스트 후 조정.

### Rationale
- 일반적인 마우스 이동 속도: 200-400px/s
- "빠르게 스쳐 지나감"은 800px/s 이상이 적절
- 너무 낮으면 의도치 않은 트리거, 너무 높으면 트리거 어려움

### Tuning
구현 후 실제 테스트로 조정:
- 너무 쉽게 트리거 → 임계값 증가
- 트리거가 어려움 → 임계값 감소

---

## Summary

| 항목 | 결정 |
|------|------|
| 속도 측정 | mousemove 이벤트 + 시간/거리 계산 |
| 애니메이션 | requestAnimationFrame + rotateY |
| 감속 | 지수 감쇠 (friction = 0.98) |
| hover 공존 | .spinning 클래스로 상태 분리 |
| 터치 대응 | 스와이프 속도 측정 |
| 접근성 | prefers-reduced-motion 확인 |
| 임계값 | 800px/s (조정 가능) |
