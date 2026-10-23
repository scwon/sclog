# 토큰은 원시·의미 2단계로 두고, 의미 토큰만 Tailwind `@theme inline`으로 노출한다

디자인 시스템의 토큰(GLOSSARY.md)은 원시 토큰(팔레트 값, 테마 무관)과 의미 토큰(역할 이름, 테마가 값을 바꿈) 2단계로만 둔다. 의미 토큰·글꼴·반경·모션은 `@theme inline`으로 Tailwind 네임스페이스(`--color-*`, `--font-*`, `--radius-*`, `--ease-*`)에 매핑해 `bg-surface-panel` 같은 유틸리티를 만들고, 원시 토큰은 `@theme`에 넣지 않아 `bg-palette-coral-400` 같은 유틸리티가 생기지 않게 한다. Tailwind 기본 색 팔레트는 `--color-*: initial`로 끈다. `inline`을 쓰는 이유는 유틸리티에 `var()`가 그대로 복사돼야 `data-theme`로 바꾼 값이 반영되기 때문이다(`docs/research/design-system-tokens.md` 1절).

의미 토큰 이름은 IDE 용어가 아니라 범용 역할(surface·text·border·accent·prose·code·state·marker)로 짓는다. IDE 용어(explorer, status bar)는 컴포넌트 이름에만 쓴다. 다른 프로젝트에서 같은 시스템을 쓸 때 토큰 이름이 블로그 화면 구조에 묶이지 않게 하기 위해서다.

## Considered Options

- **컴포넌트 토큰 3단계(`--button-bg`)**: 지금은 컴포넌트가 적어 의미 토큰을 직접 쓰는 편이 짧다. 같은 역할 토큰을 둘 이상의 컴포넌트가 다르게 쓰고 싶어질 때 추가한다.
- **원시 토큰도 `@theme`에 노출**: 유틸리티가 늘고, 소비자가 역할을 건너뛰고 팔레트 색을 바로 쓰게 돼 테마 전환이 깨진다.
- **IDE 용어 토큰 이름(`--color-editor`, `--color-explorer`)**: 시안 CSS와 1:1이라 옮기기는 쉽지만, ADR 0002의 범용 시스템 목표와 어긋난다.
