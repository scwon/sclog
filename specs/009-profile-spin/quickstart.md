# Quickstart: 프로필 스핀 애니메이션

**Feature**: 009-profile-spin
**Date**: 2025-12-15

## 구현 개요

프로필 이미지 위로 마우스가 빠르게 지나가면 동전처럼 Y축 회전하는 애니메이션을 구현한다.

## 핵심 컴포넌트

### 수정 대상

- `src/components/ProfileSection.astro` - 기존 프로필 컴포넌트에 스핀 로직 추가

### 신규 파일 (선택적)

- `src/utils/spin-animation.ts` - 스핀 로직을 별도 유틸리티로 분리 가능 (복잡도에 따라 결정)

## 구현 단계

### Step 1: 마우스 속도 측정 로직

```typescript
// ProfileSection.astro <script> 내부
let lastX = 0, lastY = 0, lastTime = 0;

function calculateVelocity(e: MouseEvent): number {
  const now = performance.now();
  const dt = now - lastTime;

  if (dt === 0 || lastTime === 0) {
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
    return 0;
  }

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

### Step 2: 스핀 애니메이션 루프

```typescript
const VELOCITY_THRESHOLD = 800; // px/s
const FRICTION = 0.98;
const MIN_ANGULAR_VELOCITY = 0.1;

let rotation = 0;
let angularVelocity = 0;
let isSpinning = false;
let animationId: number | null = null;

function startSpin(mouseVelocity: number) {
  // 마우스 속도를 각속도로 변환 (조정 가능)
  angularVelocity = mouseVelocity * 0.02;

  if (!isSpinning) {
    isSpinning = true;
    avatar.classList.add('spinning');
    animate();
  }
}

function animate() {
  if (Math.abs(angularVelocity) < MIN_ANGULAR_VELOCITY) {
    stopSpin();
    return;
  }

  rotation += angularVelocity;
  angularVelocity *= FRICTION;

  // 양면 모두 동일하게 회전
  avatarFront.style.transform = `rotateY(${rotation}deg)`;
  avatarBack.style.transform = `rotateY(${rotation + 180}deg)`;

  animationId = requestAnimationFrame(animate);
}

function stopSpin() {
  isSpinning = false;
  angularVelocity = 0;
  avatar.classList.remove('spinning');

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // 회전 상태 초기화 (CSS transition으로 부드럽게)
  avatarFront.style.transform = '';
  avatarBack.style.transform = '';
}
```

### Step 3: 이벤트 바인딩

```typescript
const avatar = document.querySelector('.profile-avatar');
const avatarFront = document.querySelector('.avatar-default');
const avatarBack = document.querySelector('.avatar-alternate');

// 마우스 통과 감지
avatar?.addEventListener('mousemove', (e) => {
  const velocity = calculateVelocity(e as MouseEvent);

  if (velocity > VELOCITY_THRESHOLD && !isSpinning) {
    startSpin(velocity);
  }
});

// 마우스가 영역을 벗어나면 속도 측정 리셋
avatar?.addEventListener('mouseleave', () => {
  lastTime = 0;
});

// 클릭으로 정지
avatar?.addEventListener('click', () => {
  if (isSpinning) {
    // 급정지 대신 빠른 감속
    angularVelocity *= 0.3;
  }
});
```

### Step 4: CSS 추가 (스핀 중 transition 비활성화)

```css
.profile-avatar.spinning .avatar-default,
.profile-avatar.spinning .avatar-alternate {
  transition: none !important;
}
```

### Step 5: 접근성 처리

```typescript
// 스크립트 최상단에서 체크
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// mousemove 핸들러 내부
if (prefersReducedMotion) return;
```

### Step 6: 터치 기기 지원 (선택적)

```typescript
let touchStartX = 0, touchStartTime = 0;

avatar?.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartTime = performance.now();
});

avatar?.addEventListener('touchend', (e) => {
  if (prefersReducedMotion) return;

  const dx = e.changedTouches[0].clientX - touchStartX;
  const dt = performance.now() - touchStartTime;
  const velocity = Math.abs(dx / dt) * 1000;

  if (velocity > VELOCITY_THRESHOLD) {
    startSpin(velocity);
  }
});
```

## 테스트 체크리스트

- [ ] 프로필 위로 마우스를 빠르게 지나가면 스핀 시작
- [ ] 천천히 움직이면 기존 hover 동작만 수행
- [ ] 스핀이 자연스럽게 감속되며 멈춤
- [ ] 스핀 중 클릭하면 빠르게 감속
- [ ] `prefers-reduced-motion` 설정 시 스핀 비활성화
- [ ] 기존 hover 동전 뒤집기 애니메이션 정상 동작
- [ ] 60fps 부드러운 애니메이션 (개발자 도구 Performance 탭)

## 파라미터 튜닝

구현 후 아래 값들을 실제 테스트하며 조정:

| 파라미터 | 기본값 | 조정 방향 |
|---------|--------|----------|
| `VELOCITY_THRESHOLD` | 800 | 너무 쉽게 트리거 → 증가, 트리거 어려움 → 감소 |
| `FRICTION` | 0.98 | 너무 오래 돌음 → 감소, 너무 빨리 멈춤 → 증가 |
| `angularVelocity` 변환 계수 | 0.02 | 회전이 너무 빠름 → 감소, 너무 느림 → 증가 |

## 주의사항

1. **transform-style: preserve-3d** - 기존 CSS에 이미 설정되어 있음
2. **backface-visibility** - 양면 이미지 처리에 이미 적용됨
3. **will-change** - 성능 최적화를 위해 애니메이션 시작 시 추가 고려
4. **View Transitions** - Astro View Transitions와 충돌 없도록 cleanup 확인
