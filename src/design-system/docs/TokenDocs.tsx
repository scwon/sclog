import { useEffect, useState } from 'react';
import { ColorItem, ColorPalette } from '@storybook/addon-docs/blocks';
import primitivesCss from '../tokens/primitives.css?raw';
import semanticCss from '../tokens/semantic.css?raw';
import stylesCss from '../styles/index.css?raw';

/** 첫 블록(어두운 테마)의 의미 토큰 이름. 두 테마의 이름이 같다는 것은 tokens.test.ts가 지킨다. */
const semanticNames = [
  ...(/\{([^}]*)\}/.exec(semanticCss)?.[1] ?? '').matchAll(/(--[\w-]+)\s*:/g),
].map(([, name]) => name);

const primitiveNames = [...primitivesCss.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name);

/** `@theme inline`의 `--radius-sm: var(--corner-6)` → [`sm`, `--corner-6`] */
const radii = [...stylesCss.matchAll(/--radius-(\w+):\s*var\((--[\w-]+)\)/g)].map(
  ([, size, primitive]) => [size, primitive] as const,
);

const motionNames = primitiveNames.filter((name) => /^--(easing|duration|stagger)-/.test(name));

const roles: [role: string, title: string][] = [
  ['surface', '바탕'],
  ['text', '글자'],
  ['border', '선'],
  ['accent', '강조'],
  ['prose', '본문'],
  ['code', '코드'],
  ['state', '상태'],
  ['marker', '형광 띠'],
  ['scrim', '가림막'],
];

const roleOf = (name: string) => (name === '--on-accent' ? 'accent' : name.slice(2).split('-')[0]);

/** `<html>`에서 토큰 값을 읽고, 툴바가 `data-theme`를 바꿀 때마다 다시 읽는다. */
function useTokenValues(names: string[]): {
  theme: 'dark' | 'light';
  values: Record<string, string>;
} {
  const read = () => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      // 속성이 없거나 모르는 값이면 어두운 테마다(ADR 0002).
      theme: root.dataset.theme === 'light' ? ('light' as const) : ('dark' as const),
      values: Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()])),
    };
  };
  const [state, setState] = useState(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setState(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    setState(read());
    return () => observer.disconnect();
    // 토큰 이름 목록은 모듈 상수라 바뀌지 않는다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/** 현재 테마의 의미 색 토큰을 역할별 `ColorPalette`로 보여 준다. */
export function SemanticColors() {
  const { theme, values } = useTokenValues(semanticNames);
  return (
    <>
      <p>
        현재 테마: <strong>{theme === 'light' ? '밝은 테마' : '어두운 테마'}</strong> (툴바에서
        바꾼다)
      </p>
      <ColorPalette>
        {roles.map(([role, title]) => {
          const names = semanticNames.filter((name) => roleOf(name) === role);
          return (
            <ColorItem
              key={role}
              title={`${title} ${role}`}
              subtitle={names.map((name) => `--color${name.slice(1)}`).join(' ')}
              colors={Object.fromEntries(names.map((name) => [name.slice(2), values[name]]))}
            />
          );
        })}
      </ColorPalette>
    </>
  );
}

/** 반경 토큰: 유틸리티 이름, 원시 토큰, 값, 견본. */
export function RadiusTokens() {
  const { values } = useTokenValues(radii.map(([, primitive]) => primitive));
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface p-6 text-text sm:grid-cols-4">
      {radii.map(([size, primitive]) => (
        <figure key={size} className="m-0 grid gap-2 font-mono text-xs">
          <div
            className="h-16 border border-border-strong bg-surface-raised"
            style={{ borderRadius: `var(${primitive})` }}
          />
          <figcaption>
            rounded-{size}
            <br />
            <span className="text-text-muted">
              {primitive} · {values[primitive]}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** 모션 토큰: 이징·지속 시간·펼침 간격. 줄에 마우스를 올리면 그 값으로 점이 움직인다. */
export function MotionTokens() {
  const { values } = useTokenValues(motionNames);
  const easing = motionNames.find((name) => name.startsWith('--easing-')) ?? '';
  return (
    <ul className="m-0 grid list-none gap-1 rounded-lg bg-surface p-6 font-mono text-xs text-text">
      {motionNames.map((name) => (
        <li
          key={name}
          className="group grid grid-cols-[14rem_1fr] items-center gap-4 py-1 text-text"
        >
          <span>
            {name}
            <br />
            <span className="text-text-muted">{values[name]}</span>
          </span>
          {name.startsWith('--duration-') ? (
            <span className="relative h-2 rounded-sm bg-border-subtle">
              <span
                className="absolute top-0 left-0 size-2 rounded-sm bg-accent transition-transform group-hover:translate-x-40"
                style={{
                  transitionDuration: `var(${name})`,
                  transitionTimingFunction: `var(${easing})`,
                }}
              />
            </span>
          ) : (
            <span className="text-text-muted">
              {name.startsWith('--easing-') ? 'ease-standard 유틸리티' : '펼침 줄 사이 지연'}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 의미 토큰 유틸리티로 그린 테마 견본. 툴바 테마 전환이 문서 페이지에도 적용되게 하는 스토리로 쓴다. */
export function ThemeSample() {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface-panel p-6 text-text">
      <p className="m-0 text-lg font-bold">scwon’s blog</p>
      <p className="m-0 text-prose">본문 글자는 prose, 보조 글자는 text-muted를 쓴다.</p>
      <p className="m-0 text-sm text-text-muted">2023-04-30 · 회고</p>
      <span className="w-fit rounded-sm bg-accent px-2 py-1 font-mono text-xs text-on-accent">
        main ✓
      </span>
    </div>
  );
}
