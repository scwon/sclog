import { useEffect, useState } from 'react';
import { ColorItem, ColorPalette } from '@storybook/addon-docs/blocks';
import semanticCss from '../tokens/semantic.css?raw';
import stylesCss from '../styles/index.css?raw';

interface Token {
  name: string;
  /** 선언 줄 끝의 주석. 토큰 파일이 설명의 단일 출처다. */
  note: string;
}

/** semantic.css에서 선택자가 `selector`인 블록의 토큰 목록. */
function tokensOf(selector: RegExp): Token[] {
  const body = new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`).exec(semanticCss)?.[1] ?? '';
  return [...body.matchAll(/(--[\w-]+)\s*:[^;]*;[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/g)].map(
    ([, name, note]) => ({ name, note: note ?? '' }),
  );
}

/** 어두운 테마 블록의 색 토큰. 두 테마의 이름이 같다는 것은 tokens.test.ts가 지킨다. */
const colorNames = tokensOf(/:root,\s*\[data-theme='dark'\]/).map(({ name }) => name);

/** 테마와 무관한 의미 토큰(반경·모션·치수·타이포 스케일). */
const shared = tokensOf(/:root(?!\s*,)/);
const sharedWith = (pattern: RegExp) => shared.filter(({ name }) => pattern.test(name));

/** `@theme inline`의 `--radius-sm: var(--corner-sm)` → [`sm`, `--corner-sm`] */
const radii = [...stylesCss.matchAll(/--radius-(\w+):\s*var\((--[\w-]+)\)/g)].map(
  ([, size, token]) => [size, token] as const,
);

const motion = sharedWith(/^--motion-/);
const dimensions = sharedWith(/^--(bar|rail|panel|gutter|track)-/);
const typeScale = sharedWith(/^--type-/).filter(({ name }) => !name.endsWith('-leading'));

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
  const { theme, values } = useTokenValues(colorNames);
  return (
    <>
      <p>
        현재 테마: <strong>{theme === 'light' ? '밝은 테마' : '어두운 테마'}</strong> (툴바에서
        바꾼다)
      </p>
      <ColorPalette>
        {roles.map(([role, title]) => {
          const names = colorNames.filter((name) => roleOf(name) === role);
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

/** 이름·계산된 값·설명 한 칸. */
function TokenLabel({ name, value, note }: { name: string; value: string; note?: string }) {
  // Storybook 문서의 `li` 글자색 규칙은 레이어 밖이라 `li`에 준 유틸리티보다 우선한다. 그래서 여기서 직접 칠한다.
  return (
    <span className="text-text">
      {name}
      <br />
      <span className="text-text-muted">
        {value}
        {note ? ` · ${note}` : ''}
      </span>
    </span>
  );
}

const panel = 'm-0 grid list-none gap-1 rounded-lg bg-surface p-6 font-mono text-xs text-text';
const row = 'grid grid-cols-[18rem_1fr] items-center gap-4 py-1 text-text';

/** 반경 토큰: 유틸리티 이름, 의미 토큰, 값, 견본. */
export function RadiusTokens() {
  const { values } = useTokenValues(radii.map(([, token]) => token));
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface p-6 text-text sm:grid-cols-4">
      {radii.map(([size, token]) => (
        <figure key={size} className="m-0 grid gap-2 font-mono text-xs">
          <div
            className="h-16 border border-border-strong bg-surface-raised"
            style={{ borderRadius: `var(${token})` }}
          />
          <figcaption>
            rounded-{size}
            <br />
            <span className="text-text-muted">
              {token} · {values[token]}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** 모션 토큰. 시간 토큰 줄에 마우스를 올리면 그 시간과 `--motion-easing`으로 점이 움직인다. */
export function MotionTokens() {
  const { values } = useTokenValues(motion.map(({ name }) => name));
  return (
    <ul className={panel}>
      {motion.map(({ name, note }) => (
        <li key={name} className={`group ${row}`}>
          <TokenLabel name={name} value={values[name]} note={note} />
          {name === '--motion-easing' ? (
            <span className="text-text-muted">ease-standard 유틸리티</span>
          ) : (
            <span className="relative h-2 rounded-sm bg-border-subtle">
              <span
                className="absolute top-0 left-0 size-2 rounded-sm bg-accent transition-transform ease-standard group-hover:translate-x-40"
                style={{ transitionDuration: `var(${name})` }}
              />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 치수 토큰. 높이 토큰은 가로 막대의 두께로, 너비 토큰은 막대의 길이로 그린다. */
export function DimensionTokens() {
  const { values } = useTokenValues(dimensions.map(({ name }) => name));
  return (
    <ul className={panel}>
      {dimensions.map(({ name, note }) => (
        <li key={name} className={row}>
          <TokenLabel name={name} value={values[name]} note={note} />
          <span
            className="block rounded-sm border border-border-strong bg-surface-raised"
            style={
              name.includes('-height')
                ? { height: `var(${name})`, width: '100%' }
                : { width: `var(${name})`, height: '12px' }
            }
          />
        </li>
      ))}
    </ul>
  );
}

/** 타이포 스케일 토큰. 본문 크기는 짝이 되는 행간 토큰과 함께 보여 준다. */
export function TypeScaleTokens() {
  const names = shared.filter(({ name }) => name.startsWith('--type-')).map(({ name }) => name);
  const { values } = useTokenValues(names);
  return (
    <ul className={`${panel} overflow-hidden`}>
      {typeScale.map(({ name, note }) => {
        const leading = `${name}-leading`;
        const hasLeading = names.includes(leading);
        return (
          <li key={name} className="grid gap-1 border-b border-border-subtle py-3 last:border-0">
            <TokenLabel
              name={hasLeading ? `${name} / ${leading}` : name}
              value={hasLeading ? `${values[name]} / ${values[leading]}` : values[name]}
              note={note}
            />
            <span
              className="truncate font-sans text-prose"
              style={{
                fontSize: `var(${name})`,
                lineHeight: hasLeading ? `var(${leading})` : 1.2,
              }}
            >
              {hasLeading ? '읽는 위치의 줄 번호가 코랄로 바뀐다.' : 'scwon’s blog'}
            </span>
          </li>
        );
      })}
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
