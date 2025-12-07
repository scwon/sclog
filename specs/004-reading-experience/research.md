# Research: 블로그 읽기 경험 개선

**Date**: 2025-12-07
**Feature**: 004-reading-experience

## 1. 읽기 시간 표시

**상태**: ✅ 이미 구현됨

**현재 구현**:
- `src/utils/blog.ts:getReadingTime()` - 한글 500자/분, 영문 200단어/분 계산
- `src/layouts/BlogPost.astro` - "N분 읽기" 형태로 표시

**결론**: 추가 작업 불필요

---

## 2. 목차(TOC) 구현 방식

**Decision**: Astro 컴포넌트 + Intersection Observer API

**Rationale**:
- Astro의 SSG 특성상, 빌드 타임에 헤딩을 추출하여 목차 생성
- 클라이언트에서 Intersection Observer로 현재 섹션 감지
- 외부 라이브러리 없이 네이티브 API 사용 (번들 사이즈 최소화)

**Alternatives considered**:
- `rehype-toc` 플러그인: MDX 파이프라인 복잡성 증가, 커스터마이징 어려움
- `tocbot` 라이브러리: 외부 의존성 추가, 번들 사이즈 증가

**구현 방식**:
1. `post.render()`에서 `headings` 추출 (Astro 내장)
2. `<TableOfContents headings={headings} />` 컴포넌트로 전달
3. 클라이언트 스크립트에서 Intersection Observer로 활성 섹션 추적

**모바일 대응**:
- 768px 미만: 사이드 TOC 숨김 (CSS `display: none`)
- 대체 UI 없이 숨김 (단순화) - 모바일에서는 스크롤이 자연스러운 탐색 방식

---

## 3. 코드 블록 개선 방식

**Decision**: Astro의 Shiki 기본 설정 활용 + 커스텀 wrapper

**Rationale**:
- Astro 5.x는 Shiki를 기본 코드 하이라이터로 사용
- 언어 라벨은 `<pre>` 태그의 `data-language` 속성에서 추출
- 복사 버튼은 클라이언트 스크립트로 동적 추가

**Alternatives considered**:
- `rehype-pretty-code`: 추가 설정 필요, 현재 Shiki로 충분
- `Prism.js`: Shiki가 이미 설치됨, 중복 불필요

**구현 방식**:
1. `astro.config.mjs`에서 Shiki 설정 확인/수정
2. 클라이언트 스크립트로 모든 `<pre>` 태그에 복사 버튼 주입
3. `navigator.clipboard.writeText()` API 사용
4. 복사 완료 시 체크 아이콘으로 2초간 변경

**접근성**:
- 복사 버튼에 `aria-label="코드 복사"` 추가
- 복사 성공 시 `aria-label="복사됨"` 변경

---

## 4. 스크롤 진행률 바

**Decision**: CSS 변수 + requestAnimationFrame 최적화

**Rationale**:
- 순수 CSS/JS로 구현, 외부 라이브러리 불필요
- `scroll` 이벤트 + `requestAnimationFrame`으로 60fps 보장
- CSS 변수(`--scroll-progress`)로 진행률 제어

**Alternatives considered**:
- CSS `animation-timeline: scroll()`: 브라우저 지원 불충분 (Safari 미지원)
- `scroll-driven animations`: 동일한 지원 문제

**구현 방식**:
1. 페이지 상단에 `position: fixed` 바 배치
2. 스크롤 이벤트에서 진행률 계산: `scrollY / (documentHeight - windowHeight)`
3. CSS `transform: scaleX(var(--scroll-progress))` 사용 (리플로우 방지)

**위치**:
- 헤더 바로 아래 또는 헤더 하단에 붙임
- 높이: 3px (눈에 띄면서도 방해되지 않는 수준)
- 색상: `--color-primary` (브랜드 컬러)

---

## 5. 맨 위로 버튼

**Decision**: 조건부 렌더링 + CSS 트랜지션

**Rationale**:
- 단순한 기능, 복잡한 로직 불필요
- 스크롤 300px 이후 버튼 표시
- `window.scrollTo({ behavior: 'smooth' })` 사용

**Alternatives considered**:
- 라이브러리 사용: 불필요한 복잡성

**구현 방식**:
1. `position: fixed; right: 1rem; bottom: 1rem;`
2. `opacity`와 `pointer-events`로 표시/숨김 제어
3. 클릭 시 `window.scrollTo({ top: 0, behavior: 'smooth' })`

**디자인**:
- 원형 버튼, 40x40px
- 배경: `--color-bg` + 그림자
- 아이콘: 위쪽 화살표 (SVG 인라인)
- 호버: 브랜드 컬러 테두리

**접근성**:
- `aria-label="맨 위로 이동"`
- 키보드 포커스 가능 (`tabindex="0"`)

---

## 기술 결정 요약

| 기능 | 접근 방식 | 외부 의존성 |
|------|-----------|-------------|
| 읽기 시간 | 기존 유지 | 없음 |
| TOC | Intersection Observer | 없음 |
| 코드 복사 | Clipboard API | 없음 |
| 진행률 바 | scroll + rAF | 없음 |
| 맨 위로 | scrollTo smooth | 없음 |

**결론**: 모든 기능을 외부 라이브러리 없이 네이티브 API로 구현
