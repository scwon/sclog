# 디자인 시스템은 층으로 나누고, 컴포넌트는 Provider 없이 동작한다

나중에 다른 프로젝트에서도 쓸 범용 디자인 시스템을 Astro 블로그에서 먼저 만든다. 층 순서는 토큰(CSS 변수) → CSS → React 컴포넌트 → Storybook이다. Astro에서는 React 컴포넌트가 아일랜드마다 따로 동작해 페이지 전체를 감싸는 React Context가 공유되지 않으므로, 컴포넌트는 `ThemeProvider` 같은 Provider 없이 동작해야 한다. 그래서 테마는 `data-theme` 속성과 CSS 변수로 바꾸고, 컴포넌트끼리 나눌 상태가 생기면 작은 스토어를 쓴다. 이렇게 하면 같은 컴포넌트를 Astro와 Next.js 등 다른 React 앱에서 그대로 쓸 수 있다. 처음에는 `src/design-system/`에서 시작하고, 실제로 쓰는 프로젝트가 둘이 되면 패키지로 분리한다.

## Consequences

- shadcn/Radix 컴포넌트를 들여올 때 Context 기반 테마나 전역 Provider가 필요한지 확인하고, 필요하면 감싸지 말고 토큰·속성 방식으로 바꾼다.
- 오버레이처럼 반드시 클라이언트에서 동작해야 하는 컴포넌트는 Astro에서 `client:*` 지시어가 필요하다.
