# Data Model: 프로필 스핀 애니메이션

**Feature**: 009-profile-spin
**Date**: 2025-12-15

## 개요

이 피처는 순수 클라이언트 사이드 애니메이션으로, 서버 측 데이터 모델이나 영속성이 없다. 아래는 런타임 상태 관리에 대한 정의이다.

## Runtime State

### SpinState (컴포넌트 내부 상태)

| 속성 | 타입 | 설명 |
|------|------|------|
| `rotation` | `number` | 현재 회전 각도 (degrees) |
| `angularVelocity` | `number` | 현재 각속도 (degrees per frame) |
| `isSpinning` | `boolean` | 스핀 애니메이션 활성화 여부 |
| `animationId` | `number \| null` | requestAnimationFrame ID |

### MouseTrackingState (속도 계산용)

| 속성 | 타입 | 설명 |
|------|------|------|
| `lastX` | `number` | 마지막 마우스 X 좌표 |
| `lastY` | `number` | 마지막 마우스 Y 좌표 |
| `lastTime` | `number` | 마지막 이벤트 타임스탬프 (ms) |

### TouchTrackingState (터치 기기용)

| 속성 | 타입 | 설명 |
|------|------|------|
| `touchStartX` | `number` | 터치 시작 X 좌표 |
| `touchStartTime` | `number` | 터치 시작 타임스탬프 (ms) |

## Constants (설정값)

| 상수 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `VELOCITY_THRESHOLD` | `number` | 800 | 스핀 트리거 최소 속도 (px/s) |
| `FRICTION` | `number` | 0.98 | 감속 계수 (프레임당 속도 유지율) |
| `MIN_ANGULAR_VELOCITY` | `number` | 0.1 | 정지 판정 임계값 (deg/frame) |
| `VELOCITY_TO_ANGULAR` | `number` | 0.02 | 마우스 속도→각속도 변환 계수 |

## State Transitions

```
┌─────────────┐
│   IDLE      │ (isSpinning = false)
└──────┬──────┘
       │ mousemove (velocity > THRESHOLD)
       ▼
┌─────────────┐
│  SPINNING   │ (isSpinning = true)
└──────┬──────┘
       │ angularVelocity < MIN_ANGULAR_VELOCITY
       │ OR click (accelerated decay)
       ▼
┌─────────────┐
│   IDLE      │
└─────────────┘
```

## DOM 요소 참조

| 선택자 | 요소 | 역할 |
|--------|------|------|
| `.profile-avatar` | 컨테이너 | 이벤트 리스너 부착, spinning 클래스 토글 |
| `.avatar-default` | 앞면 이미지 | transform 적용 대상 |
| `.avatar-alternate` | 뒷면 이미지 | transform 적용 대상 (180도 오프셋) |

## CSS 클래스

| 클래스 | 적용 조건 | 효과 |
|--------|----------|------|
| `.spinning` | 스핀 애니메이션 중 | CSS transition 비활성화 |

## 데이터 흐름

```
MouseEvent → calculateVelocity() → velocity (px/s)
                                       │
                                       ▼
                            velocity > THRESHOLD?
                                       │
                              ┌────────┴────────┐
                              │ YES             │ NO
                              ▼                 ▼
                         startSpin()      (기존 hover 동작)
                              │
                              ▼
                         animate() loop
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
           angularVelocity       click detected
           < MIN_VELOCITY              │
                    │                   │
                    └─────────┬─────────┘
                              ▼
                          stopSpin()
```

## 영속성

- **세션 간 유지**: 없음 (페이지 새로고침 시 초기화)
- **페이지 전환 시**: View Transition 전 cleanup 필요
- **localStorage**: 사용하지 않음
