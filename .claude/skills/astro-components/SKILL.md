---
name: astro-components
description: Astro 컴포넌트 작성 시 Props 정의, 클라이언트 스크립트, View Transitions 패턴이 필요할 때 사용
---

# Astro Component Patterns

SCLOG 프로젝트의 Astro 컴포넌트 작성 패턴.

## Props 인터페이스

```astro
---
interface Props {
  title: string;
  description?: string;
  isActive?: boolean;
}

const { title, description, isActive = false } = Astro.props;
---

<div class:list={["card", { active: isActive }]}>
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</div>
```

## 클라이언트 스크립트

```astro
<button id="theme-toggle">Toggle Theme</button>

<script>
  // DOM 요소 선택
  const button = document.getElementById('theme-toggle');

  // 이벤트 리스너 (passive 옵션 사용)
  button?.addEventListener('click', () => {
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  }, { passive: true });
</script>
```

## View Transitions API

```astro
<script>
  // 페이지 전환 전 정리
  document.addEventListener('astro:before-swap', () => {
    // 애니메이션 정리, 이벤트 리스너 제거
  });

  // 페이지 전환 후 초기화
  document.addEventListener('astro:page-load', () => {
    // 컴포넌트 초기화
    initComponent();
  });

  function initComponent() {
    // 초기화 로직
  }

  // 첫 로드 시에도 실행
  initComponent();
</script>
```

## 애니메이션 패턴

```astro
<script>
  // requestAnimationFrame으로 60fps 보장
  let animationId: number;

  function animate() {
    // 애니메이션 로직
    animationId = requestAnimationFrame(animate);
  }

  // 정리
  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(animationId);
  });
</script>

<style>
  /* CSS transforms 사용 (reflow 방지) */
  .animated {
    transform: translateX(0);
    transition: transform 150ms ease;
  }
</style>
```

## 접근성 패턴

```astro
---
interface Props {
  label: string;
}

const { label } = Astro.props;
---

<button
  aria-label={label}
  class="icon-button"
>
  <slot />
</button>

<style>
  .icon-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .icon-button {
      transition: none;
    }
  }
</style>
```

## Scoped Styles

```astro
<div class="container">
  <slot />
</div>

<style>
  /* 자동으로 스코프됨 */
  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 1rem;
  }

  /* 글로벌 스타일이 필요하면 :global() 사용 */
  :global(.markdown-content) h2 {
    margin-top: 2rem;
  }
</style>
```
