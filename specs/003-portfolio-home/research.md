# Research: 포트폴리오 홈페이지

**Feature**: 003-portfolio-home
**Date**: 2025-12-07

## 1. 소셜 링크 아이콘 구현 방식

**Decision**: SVG 인라인 아이콘 사용

**Rationale**:
- 외부 아이콘 라이브러리(Font Awesome 등) 의존성 없음
- 번들 사이즈 최소화
- CSS로 색상 제어 가능 (테마 대응)
- Core Web Vitals에 유리 (추가 네트워크 요청 없음)

**Alternatives considered**:
- Font Awesome CDN: 추가 네트워크 요청, FOUT 문제
- Heroicons/Lucide 패키지: 의존성 추가 불필요
- 이미지 파일: 색상 제어 불가, 테마 대응 어려움

## 2. 프로필 데이터 관리 방식

**Decision**: TypeScript 상수 파일 (`src/data/profile.ts`)

**Rationale**:
- 타입 안전성 보장
- 빌드 타임에 검증
- 단일 진실 공급원 (Single Source of Truth)
- 컴포넌트에서 직접 import하여 사용

**Alternatives considered**:
- JSON 파일: 타입 추론 부재, 스키마 검증 필요
- YAML/환경변수: Astro에서 추가 설정 필요
- CMS 연동: 과도한 복잡성 (YAGNI)

## 3. 이력 섹션 레이아웃

**Decision**: 타임라인 스타일 (수직 리스트)

**Rationale**:
- 시간순 정보 표현에 적합
- 모바일 반응형 구현 용이
- 헌법의 "미니멀하고 콘텐츠 중심" 원칙 부합

**Alternatives considered**:
- 카드 그리드: 시간 순서 표현 어려움
- 가로 타임라인: 모바일 대응 복잡

## 4. 이메일 연락 방식

**Decision**: mailto 링크 + 클릭 시 복사 기능 (선택적)

**Rationale**:
- 가장 표준적인 방식
- 접근성 우수 (스크린 리더 호환)
- 별도 백엔드 없이 구현 가능

**Alternatives considered**:
- 연락 폼: 백엔드 필요, 과도한 복잡성
- 복사만: mailto 대비 사용성 저하

## 5. 프로필 이미지 처리

**Decision**: `public/` 디렉토리에 정적 이미지 배치

**Rationale**:
- Astro의 정적 자산 처리 방식 활용
- 빌드 시 최적화 가능
- 단순한 경로 참조 (`/images/profile.jpg`)

**Alternatives considered**:
- Astro Image 컴포넌트: 단일 이미지에 과도한 설정
- 외부 이미지 URL: 네트워크 의존성

## 6. 컴포넌트 분리 전략

**Decision**: 섹션별 컴포넌트 분리

| 컴포넌트 | 책임 |
|----------|------|
| `ProfileSection.astro` | 프로필 사진, 이름, 한 줄 소개, 자기소개 |
| `SocialLinks.astro` | 소셜 아이콘 링크 (GitHub, LinkedIn, Instagram, Email) |
| `CareerSection.astro` | 경력 타임라인 |
| `RecentPosts.astro` | 최근 글 목록 (기존 로직 추출) |

**Rationale**:
- 단일 책임 원칙 (SRP)
- 재사용성 (SocialLinks는 푸터에서도 사용 가능)
- 테스트/유지보수 용이

---

*모든 NEEDS CLARIFICATION 항목 해결됨*
