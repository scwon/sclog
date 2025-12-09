# Research: 블로그 댓글 기능 (Giscus)

**Feature Branch**: `007-comments`
**Date**: 2025-12-10
**Spec**: [spec.md](./spec.md)

## 1. Giscus 통합 방식

### Decision: Astro 컴포넌트 + 인라인 스크립트 방식

### Rationale
- Astro의 정적 사이트 특성에 적합한 클라이언트 사이드 로딩
- `is:inline` 속성으로 스크립트가 빌드 과정에서 변형되지 않도록 보장
- `data-loading="lazy"`로 불필요한 초기 로딩 방지
- GitHub Discussions 기반으로 별도 백엔드 불필요

### Alternatives Considered
| 대안 | 기각 사유 |
|------|-----------|
| @giscus/react 패키지 | React 의존성 추가 필요, 현재 프로젝트는 순수 Astro 기반 |
| Utterances | 답글/리액션 미지원, GitHub Issues 기반으로 확장성 낮음 |
| Disqus | 광고 포함, 프라이버시 우려, 무거움 |
| 자체 백엔드 | 별도 서버/DB 운영 비용, 오버엔지니어링 |

---

## 2. GitHub Repository 설정

### Decision: 기존 블로그 레포지토리 사용

### Rationale
- 이미 공개 레포지토리 (`scwon/sclog`)
- 별도 레포지토리 생성 시 관리 포인트 증가
- Discussions 기능 활성화만 필요

### Configuration Required
1. GitHub 레포지토리 Settings → Features → Discussions 활성화
2. giscus.app에서 레포지토리 연결 및 설정값 획득
3. 획득할 값: `data-repo-id`, `data-category-id`

---

## 3. 페이지-Discussion 매핑 전략

### Decision: `pathname` 매핑 사용

### Rationale
- 각 블로그 글의 URL 경로를 Discussion 제목으로 사용
- 글 제목 변경 시에도 댓글 유지
- 직관적이고 예측 가능한 구조

### Mapping Options Evaluated
| 옵션 | 설명 | 선택 |
|------|------|------|
| `pathname` | URL 경로 사용 (예: `/blog/my-post`) | ✅ 선택 |
| `og:title` | Open Graph 제목 사용 | 제목 변경 시 댓글 손실 위험 |
| `title` | 페이지 제목 사용 | 제목 변경 시 댓글 손실 위험 |
| `specific` | 수동 지정 | 관리 복잡도 증가 |

---

## 4. 다크 모드 연동

### Decision: MutationObserver 기반 테마 동기화

### Rationale
- 현재 프로젝트는 `.dark` 클래스를 `<html>` 요소에 토글하여 다크 모드 전환
- Giscus iframe에 `postMessage`로 테마 변경 전달
- `preferred_color_scheme` 대신 수동 제어로 일관성 확보

### Implementation Pattern
```javascript
// document.documentElement의 class 변경 감지
// -> iframe.contentWindow.postMessage로 Giscus 테마 업데이트
```

---

## 5. 스팸 방지

### Decision: GitHub 인증 의존

### Rationale
- Giscus는 GitHub 로그인 필수 → 봇 자동 등록 차단
- GitHub의 기존 스팸 방지 메커니즘 활용
- 추가 CAPTCHA나 허니팟 불필요

### Trade-offs
- GitHub 계정이 없는 사용자는 댓글 불가
- 개발자/기술 블로그 특성상 대부분 GitHub 계정 보유 예상

---

## 6. 컴포넌트 배치

### Decision: BlogPost 레이아웃 하단에 Comments 컴포넌트 추가

### Rationale
- 모든 블로그 글에 자동 적용
- 기존 레이아웃 구조 유지
- `article` 태그 다음에 `section`으로 댓글 영역 구분

### Integration Point
- 파일: `src/layouts/BlogPost.astro`
- 위치: `</article>` 태그 직후, `</main>` 이전

---

## 7. 성능 최적화

### Decision: Lazy Loading + Async Script

### Rationale
- `data-loading="lazy"`: 뷰포트에 들어올 때 로딩
- `async` 속성: 페이지 렌더링 차단 방지
- 초기 LCP에 영향 없음

### Expected Performance
- 추가 번들 사이즈: 0 (외부 스크립트)
- 초기 로딩 영향: 최소 (lazy loading)
- Discussions API 지연: ~500ms-1s (일반적)

---

## 8. 스타일링

### Decision: 기본 Giscus 테마 + CSS 커스텀 색상

### Rationale
- `light` / `dark` 기본 테마 사용
- 브랜드 컬러 적용은 추후 필요 시 커스텀 CSS로
- 초기에는 기본 스타일로 충분

### Customization Option (Future)
- `public/giscus/` 폴더에 커스텀 CSS 배치
- `data-theme` 속성에 CSS 파일 URL 지정

---

## Sources

- [How to integrate Giscus to your Astro Blog - maxpou.fr](https://www.maxpou.fr/blog/giscus-with-astro/)
- [How to setup Giscus in your Astro website - daniel.es](https://daniel.es/blog/2025-08-06-how-to-setup-giscus-in-astro/)
- [Free Comment Section with Giscus - DaniDiazTech](https://danidiaztech.com/integrate-astro-giscus/)
- [Adding Giscus Discussions to Astro - David Teather](https://dteather.com/blogs/adding-giscus-discussions-to-astro/)
