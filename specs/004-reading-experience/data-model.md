# Data Model: 블로그 읽기 경험 개선

**Date**: 2025-12-07
**Feature**: 004-reading-experience

## 개요

이 기능은 주로 UI 컴포넌트로 구성되며, 별도의 데이터 저장이 필요 없음.
모든 데이터는 빌드 타임(헤딩) 또는 런타임(스크롤 위치)에 계산됨.

---

## 엔티티

### 1. Heading (목차 항목)

Astro 내장 타입 사용: `MarkdownHeading`

```typescript
// astro:content에서 제공
interface MarkdownHeading {
  depth: number;    // 1-6 (h1-h6)
  slug: string;     // 자동 생성된 ID (예: "getting-started")
  text: string;     // 헤딩 텍스트
}
```

**사용처**: `TableOfContents` 컴포넌트

**필터링 규칙**:
- `depth === 2 || depth === 3` (h2, h3만 포함)
- 헤딩 개수 < 3 이면 TOC 미표시

---

### 2. ScrollState (클라이언트 상태)

런타임에만 존재, TypeScript 타입 정의 불필요

```typescript
// 개념적 구조 (실제 코드에서는 변수로 관리)
interface ScrollState {
  scrollY: number;           // 현재 스크롤 위치
  progress: number;          // 0-1 사이 진행률
  activeHeadingSlug: string; // 현재 활성 섹션 ID
  showScrollTop: boolean;    // 맨 위로 버튼 표시 여부
}
```

**계산 로직**:
- `progress = scrollY / (documentHeight - windowHeight)`
- `showScrollTop = scrollY > 300`
- `activeHeadingSlug` = Intersection Observer로 감지

---

### 3. CodeBlockMeta (코드 블록 메타)

Shiki가 생성하는 HTML 속성에서 추출

```html
<!-- Shiki 출력 예시 -->
<pre data-language="typescript">
  <code>...</code>
</pre>
```

**추출 방법**:
```javascript
const language = preElement.dataset.language || '';
const code = preElement.querySelector('code')?.textContent || '';
```

---

## 데이터 흐름

```
[빌드 타임]
MDX 파일 → Astro 렌더링 → headings 배열 추출 → TOC 컴포넌트

[런타임]
스크롤 이벤트 → ScrollState 업데이트 → UI 반영
                                      ├── 진행률 바 width
                                      ├── TOC 활성 항목
                                      └── 맨 위로 버튼 표시
```

---

## 저장소

**없음** - 모든 상태는 메모리에서만 유지

- 사용자 설정 저장 불필요 (읽기 위치 기억 등은 이번 스코프 외)
- localStorage/sessionStorage 미사용
