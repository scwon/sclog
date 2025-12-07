# Feature Specification: 프로필 사진 Hover 애니메이션

**Feature Branch**: `005-profile-hover`
**Created**: 2025-12-07
**Status**: Draft
**Input**: User description: "프로필 사진 scwon_pt에 마우스 올리면 좀 멋있는 애니메이션 막 돌아가면서 마우스 올라간동안 scwon_dot로 바뀌면 좋겠어"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 프로필 사진 Hover 시 이미지 전환 (Priority: P1)

사용자가 포트폴리오 홈페이지의 프로필 사진(scwon_pt.jpg) 위에 마우스를 올리면, 회전 애니메이션과 함께 다른 이미지(scwon_dot.png)로 전환된다. 마우스를 떼면 다시 원래 이미지로 돌아온다.

**Why this priority**: 이 기능의 핵심 가치이며, 사용자에게 인터랙티브한 경험과 개성 있는 첫인상을 제공한다.

**Independent Test**: 홈페이지에서 프로필 사진에 마우스를 올려 회전 애니메이션과 이미지 전환이 작동하는지 확인하고, 마우스를 떼면 원래대로 돌아오는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 홈페이지가 로드된 상태, **When** 프로필 사진 위에 마우스를 올리면, **Then** 회전 애니메이션이 실행되며 scwon_dot.png 이미지로 전환된다
2. **Given** 프로필 사진이 scwon_dot.png로 전환된 상태, **When** 마우스를 사진 밖으로 이동하면, **Then** 역방향 회전 애니메이션과 함께 원래 이미지(scwon_pt.jpg)로 돌아온다
3. **Given** 홈페이지가 로드된 상태, **When** 마우스를 프로필 사진 위에 올렸다가 즉시 떼면, **Then** 애니메이션이 부드럽게 중단되고 원래 상태로 돌아온다

---

### User Story 2 - 터치 기기 대응 (Priority: P2)

터치 기기(모바일, 태블릿)에서도 프로필 사진을 탭하면 동일한 애니메이션과 이미지 전환 효과를 경험할 수 있다.

**Why this priority**: 모바일 사용자도 동일한 인터랙티브 경험을 제공받아야 하지만, 데스크톱 hover가 핵심이므로 P2이다.

**Independent Test**: 모바일 기기 또는 터치 시뮬레이터에서 프로필 사진을 탭하여 애니메이션이 작동하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 터치 기기에서 홈페이지가 로드된 상태, **When** 프로필 사진을 탭하면, **Then** 회전 애니메이션과 함께 scwon_dot.png로 전환된다
2. **Given** 터치 기기에서 이미지가 전환된 상태, **When** 다른 곳을 탭하면, **Then** 원래 이미지로 돌아온다

---

### Edge Cases

- 애니메이션 진행 중 마우스를 빠르게 올렸다 뗄 경우: 애니메이션이 부드럽게 전환되어야 함
- 이미지 로드 실패 시: 기본 프로필 사진(scwon_pt.jpg)을 유지해야 함
- JavaScript 비활성화 시: 정적 프로필 사진만 표시 (graceful degradation)
- 접근성 고려: 애니메이션으로 인해 콘텐츠 인식에 방해가 되지 않아야 함

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 프로필 사진에 마우스 hover 시 회전 애니메이션을 실행해야 한다
- **FR-002**: 시스템은 hover 상태에서 프로필 사진을 scwon_pt.jpg에서 scwon_dot.png로 전환해야 한다
- **FR-003**: 시스템은 마우스가 사진 밖으로 나가면 역방향 애니메이션과 함께 원래 이미지로 복귀해야 한다
- **FR-004**: 회전 애니메이션은 1회전(360도)을 완료해야 한다
- **FR-005**: 애니메이션 지속 시간은 0.5~0.8초 사이여야 한다
- **FR-006**: 시스템은 터치 기기에서 탭으로 동일한 효과를 제공해야 한다
- **FR-007**: 애니메이션은 사용자의 동작 감소 설정(prefers-reduced-motion)을 존중해야 한다
- **FR-008**: scwon_dot.png 이미지는 페이지 로드 시 미리 로드되어야 한다

### Key Entities

- **Profile Avatar**: 프로필 섹션에 표시되는 원형 프로필 사진
- **Default Image**: 기본 프로필 사진 (scwon_pt.jpg)
- **Alternate Image**: hover 시 표시되는 대체 이미지 (scwon_dot.png)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 프로필 사진 hover 시 0.8초 이내에 이미지 전환이 완료된다
- **SC-002**: 애니메이션이 60fps로 부드럽게 실행된다 (눈에 띄는 버벅임 없음)
- **SC-003**: 터치 기기에서도 100% 동일한 시각적 효과가 제공된다
- **SC-004**: prefers-reduced-motion 설정이 활성화된 경우 애니메이션 없이 이미지만 전환된다
- **SC-005**: 모든 주요 브라우저(Chrome, Firefox, Safari, Edge)에서 동일하게 작동한다

## Assumptions

- scwon_dot.png 이미지는 이미 `/public/images/` 폴더에 존재한다
- 프로필 사진은 150px(데스크톱) 또는 120px(모바일) 원형으로 표시된다
- ProfileSection.astro 컴포넌트가 프로필 사진을 렌더링하는 유일한 위치이다
- 회전 방향은 시계 방향이며, 복귀 시 반시계 방향이다
