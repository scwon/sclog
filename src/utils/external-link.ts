/**
 * 외부 링크 표시: 글 본문(MDX)에서 다른 도메인으로 가는 링크 뒤에 ↗와 숨은 글자 "(외부 링크)"를 붙인다.
 * 판정(`isExternalLink`)은 순수 함수이고, `hastExternalLinks`가 빌드 때 MDX 처리의 hast 단계
 * (Astro 7 기본 처리기 Sätteri의 hast 플러그인, unified의 rehype 단계에 해당)에서 그 판정으로 표시를 넣는다.
 * astro.config.mjs가 가져오므로 `@/` 별칭을 쓰지 않는다.
 */
import {
  defineHastPlugin,
  type HastPluginDefinition,
  type HastVisitorContext,
  type MdxJsxFlowElementHast,
  type MdxJsxTextElementHast,
} from 'satteri';

type ElementContent = MdxJsxTextElementHast['children'][number];
type Element = Extract<ElementContent, { type: 'element' }>;
type Text = Extract<ElementContent, { type: 'text' }>;

/** `www.`를 뗀 소문자 호스트 이름. `www.scwon.me`와 `scwon.me`를 같은 호스트로 본다. */
function bareHost(url: URL): string {
  return url.hostname.replace(/^www\./, '');
}

/**
 * `href`가 외부 링크인지 판정한다. `http(s)`이면서 호스트가 사이트 호스트와 다를 때만 참이다.
 * 상대 주소·해시는 사이트 주소에 맞춰 풀리므로 거짓이고, `mailto:` 같은 다른 스킴도 거짓이다.
 * @param href 링크의 `href` 값 그대로
 * @param site 사이트 주소(`astro.config`의 `site`), 예: `https://www.scwon.me`
 */
export function isExternalLink(href: string, site: string): boolean {
  let url: URL;
  try {
    url = new URL(href, site);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return bareHost(url) !== bareHost(new URL(site));
}

/** 숨은 글자. 스크린 리더는 링크 글자 뒤에 이어 읽는다(앞 공백 포함). */
const SPOKEN_MARK = ' (외부 링크)';

/**
 * ↗ 모양. 창 틀 제목 표시줄 GitHub 링크가 쓰는 디자인 시스템 `ExternalIcon`(Shell/icons.tsx)의 사본이다.
 * hast 단계는 React 컴포넌트를 그릴 수 없어 다시 적고, 같은 모양인지는 테스트가 맞대어 본다.
 */
export const EXTERNAL_ICON_PATH = 'M7 13 13 7m-5 0h5v5';

function icon(): Element {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      viewBox: '0 0 20 20',
      ariaHidden: 'true',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.6',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      // 크기·간격은 GitHub 링크와 같다. 본문 글자 안에 놓이도록 inline으로 둔다.
      className: ['ml-px', 'inline', 'size-[0.95em]'],
    },
    children: [
      { type: 'element', tagName: 'path', properties: { d: EXTERNAL_ICON_PATH }, children: [] },
    ],
  };
}

function span(className: string, children: ElementContent[]): Element {
  return { type: 'element', tagName: 'span', properties: { className: [className] }, children };
}

function text(value: string): Text {
  return { type: 'text', value };
}

function isBlank(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

/** 끝 공백을 뺀 글자를 [마지막 글자(자소 묶음) 앞, 마지막 글자, 끝 공백]으로 가른다. */
function splitLastGrapheme(value: string): [before: string, last: string, trailing: string] {
  const body = value.trimEnd();
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(body)];
  const last = segments.at(-1)?.segment ?? '';
  return [body.slice(0, body.length - last.length), last, value.slice(body.length)];
}

/**
 * 링크 글자 뒤에 ↗와 숨은 글자를 넣은 새 자식 목록. ↗는 링크의 마지막 글자와 함께 줄바꿈 없는 묶음에
 * 넣어 줄 맨 앞에 ↗만 남지 않게 한다. 낱말 전체가 아니라 마지막 글자만 묶는다. 본문은 어절 단위로
 * 줄을 바꾸므로(`word-break: keep-all`) 보이는 결과가 같고, 긴 URL은 여전히 중간에서 끊길 수 있다.
 * 링크가 요소(인라인 코드 등)로 끝나면 그 요소를 ↗와 함께 묶는다.
 */
function marked(children: ElementContent[]): ElementContent[] {
  let end = children.length - 1;
  while (end >= 0 && isBlank(children[end])) end -= 1;
  const head = children.slice(0, Math.max(end, 0));
  const tail = children.slice(end + 1);
  const spoken = span('sr-only', [text(SPOKEN_MARK)]);
  const last = children[end];

  if (!last) return [...children, span('whitespace-nowrap', [icon()]), spoken];
  if (last.type !== 'text') {
    return [...head, span('whitespace-nowrap', [last, icon()]), ...tail, spoken];
  }
  const [before, letter, trailing] = splitLastGrapheme(last.value);
  return [
    ...head,
    ...(before ? [text(before)] : []),
    span('whitespace-nowrap', [text(letter), icon()]),
    ...(trailing ? [text(trailing)] : []),
    ...tail,
    spoken,
  ];
}

/** `hastExternalLinks`의 설정. */
export interface ExternalLinksOptions {
  /** 사이트 주소(`astro.config`의 `site`). 이 호스트(`www.` 유무 무관)가 아닌 http(s) 링크가 외부 링크다. */
  site: string;
}

/**
 * 본문의 외부 링크 글자 뒤에 ↗(장식, `aria-hidden`)와 숨은 글자 "(외부 링크)"를 넣는 Sätteri hast 플러그인.
 * Markdown 링크(`[글자](주소)`, 자동 링크)와 MDX에 JSX로 쓴 `<a href="…">`(글자 그대로인 `href`)를 본다.
 * 링크에 있던 속성은 건드리지 않고 `target="_blank"`도 넣지 않는다(새 탭은 독자가 고른다).
 * MDX 처리에만 걸리므로 창 틀 안 링크(프로필 연락처 등)는 대상이 아니다.
 */
export function hastExternalLinks({ site }: ExternalLinksOptions): HastPluginDefinition {
  return defineHastPlugin({
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties.href;
        if (typeof href !== 'string' || !isExternalLink(href, site)) return;
        ctx.replaceNode(node, { ...node, children: marked(node.children) });
      },
    },
    // 문단 안(`text`)과 줄 맨 앞(`flow`)의 JSX `<a>`
    mdxJsxTextElement: { filter: ['a'], visit: visitJsx },
    mdxJsxFlowElement: { filter: ['a'], visit: visitJsx },
  });

  function visitJsx(
    node: Readonly<MdxJsxTextElementHast | MdxJsxFlowElementHast>,
    ctx: HastVisitorContext,
  ) {
    const href = node.attributes.find(
      (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'href',
    )?.value;
    if (typeof href !== 'string' || !isExternalLink(href, site)) return;
    ctx.replaceNode(node, { ...node, children: marked(node.children as ElementContent[]) });
  }
}
