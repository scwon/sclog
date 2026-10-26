import { describe, expect, it } from 'vitest';
import { searchPost, type SearchPostSource } from './search-index';

function source(overrides: Partial<SearchPostSource> = {}): SearchPostSource {
  return {
    url: '/blog/hello/',
    title: '안녕',
    path: 'posts/2024/hello.mdx',
    pubDate: '2024-05-01',
    tags: [],
    byline: 'scwon · 2024.05.01 · 읽는 시간 1분',
    body: '',
    headings: [],
    ...overrides,
  };
}

const lines = (post: ReturnType<typeof searchPost>) =>
  post.blocks.map(({ line, text }) => [line, text]);

describe('searchPost line numbers', () => {
  it('counts four frontmatter lines, the title and the byline before the body', () => {
    const post = searchPost(source({ body: '첫 문단' }));
    expect(lines(post)).toEqual([
      [1, '---'],
      [2, 'title: "안녕"'],
      [3, 'pubDate: 2024-05-01'],
      [4, '---'],
      [5, '안녕'],
      [6, 'scwon · 2024.05.01 · 읽는 시간 1분'],
      [7, '첫 문단'],
    ]);
  });

  it.each([
    { case: 'tags only', tags: ['회고'], heroImage: undefined, first: 8 },
    { case: 'hero image only', tags: [], heroImage: '/hero.png', first: 8 },
    { case: 'tags and hero image', tags: ['회고', '개발'], heroImage: '/hero.png', first: 9 },
  ])('adds a frontmatter line per optional field ($case)', ({ tags, heroImage, first }) => {
    const post = searchPost(source({ tags, heroImage, body: '첫 문단' }));
    expect(post.blocks.at(-1)).toMatchObject({ line: first, text: '첫 문단' });
  });

  it('writes tags and the hero image path the way the frontmatter shows them', () => {
    const post = searchPost(source({ tags: ['회고', '개발'], heroImage: '/hero.png' }));
    expect(post.blocks.slice(3, 5).map(({ text }) => text)).toEqual([
      'tags: ["회고", "개발"]',
      'heroImage: "/hero.png"',
    ]);
  });

  it('gives one line to each block separated by blank lines, and numbers them in order', () => {
    const post = searchPost(source({ body: '\n첫 문단\n이어지는 줄\n\n\n둘째 문단\n' }));
    expect(lines(post).slice(6)).toEqual([
      [7, '첫 문단 이어지는 줄'],
      [8, '둘째 문단'],
    ]);
  });
});

/** 본문 블록(frontmatter·제목·작성 정보 뒤)의 글자만. */
const bodyTexts = (body: string, headings: SearchPostSource['headings'] = []) =>
  searchPost(source({ body, headings }))
    .blocks.slice(6)
    .map(({ text }) => text);

describe('searchPost blocks', () => {
  it('keeps a fenced code block with blank lines as one block and keeps its text', () => {
    const body = ['```ts', 'const a = 1;', '', 'return **a**;', '```', '', '다음 문단'].join('\n');
    expect(bodyTexts(body)).toEqual(['const a = 1; return **a**;', '다음 문단']);
  });

  it('keeps a multi-line JSX element as one block even across blank lines', () => {
    const body = [
      '<p align="center">',
      '  <img src="/a.png" alt="쯔꾸르 게임 화면" />',
      '  <br />',
      '  <em>지금봐도 명작이다.</em>',
      '</p>',
      '',
      '<details>',
      '<summary>열기</summary>',
      '',
      '안쪽 **문단**',
      '',
      '</details>',
    ].join('\n');
    expect(bodyTexts(body)).toEqual(['지금봐도 명작이다.', '열기 안쪽 문단']);
  });

  it('counts a blockquote of several lines, a loose list and a table as one block each', () => {
    const body = [
      '> 첫 줄',
      '> 둘째 줄',
      '',
      '- 하나',
      '',
      '- 둘',
      '  이어짐',
      '',
      '1. 첫째',
      '2. 둘째',
      '',
      '| 이름 | 값 |',
      '| --- | --: |',
      '| a | `1` |',
    ].join('\n');
    expect(bodyTexts(body)).toEqual([
      '첫 줄 둘째 줄',
      '하나 둘 이어짐',
      '첫째 둘째',
      '이름 값 a 1',
    ]);
  });

  it('counts a horizontal rule as a line with no text', () => {
    expect(bodyTexts('앞\n\n---\n\n뒤')).toEqual(['앞', '', '뒤']);
  });

  it('starts a new block where a heading, quote or list interrupts a paragraph', () => {
    expect(bodyTexts('문단\n# 제목\n문단\n> 인용\n\n문단\n- 항목')).toEqual([
      '문단',
      '제목',
      '문단',
      '인용',
      '문단',
      '항목',
    ]);
  });

  it('leaves out imports, exports and comment expressions, which draw nothing', () => {
    const body = [
      "import Chart from '../Chart.astro';",
      'export const meta = { a: 1 };',
      '',
      '{/* 메모 */}',
      '',
      '{/*',
      '  여러 줄 메모',
      '*/}',
      '',
      '본문',
    ].join('\n');
    expect(bodyTexts(body)).toEqual(['본문']);
  });
});

describe('searchPost chapters and sections', () => {
  const headings = [
    { depth: 1, slug: '시작', text: '시작' },
    { depth: 1, slug: '개발자란', text: '개발자란?' },
    { depth: 2, slug: '3-4년차', text: '3~4년차' },
    { depth: 3, slug: '깊은-제목', text: '깊은 제목' },
    { depth: 1, slug: '마치며', text: '마치며' },
  ];
  const body = [
    '서문',
    '',
    '# 시작',
    '',
    '시작 문단',
    '',
    '# 개발자란?',
    '',
    '장 문단',
    '',
    '## 3~4년차',
    '',
    '절 문단',
    '',
    '### 깊은 제목',
    '',
    '깊은 문단',
    '',
    '# 마치며',
    '',
    '끝 문단',
  ].join('\n');
  const find = (text: string) =>
    searchPost(source({ body, headings })).blocks.find((candidate) => candidate.text === text);
  const place = (text: string) => {
    const block = find(text);
    return [block?.chapter?.no ?? null, block?.chapter?.id ?? null, block?.section?.id ?? null];
  };

  it('puts the frontmatter and blocks before the first chapter in no chapter', () => {
    expect(place('---')).toEqual([null, null, null]);
    expect(place('서문')).toEqual([null, null, null]);
  });

  it('puts a chapter heading and the blocks under it in that chapter with the outline number', () => {
    expect(place('시작')).toEqual(['01', '시작', null]);
    expect(place('장 문단')).toEqual(['02', '개발자란', null]);
  });

  it('puts a section heading and the blocks under it in that section', () => {
    expect(place('3~4년차')).toEqual(['02', '개발자란', '3-4년차']);
    expect(place('절 문단')).toEqual(['02', '개발자란', '3-4년차']);
  });

  it('keeps headings deeper than a section in the section above', () => {
    expect(place('깊은 문단')).toEqual(['02', '개발자란', '3-4년차']);
  });

  it('clears the section when the next chapter starts', () => {
    expect(place('끝 문단')).toEqual(['03', '마치며', null]);
  });

  it('uses the outline text for the chapter and section', () => {
    const block = find('절 문단');
    expect(block?.chapter).toEqual({ id: '개발자란', no: '02', text: '개발자란?' });
    expect(block?.section).toEqual({ id: '3-4년차', text: '3~4년차' });
  });

  it('treats a setext heading as a heading', () => {
    const blocks = searchPost(
      source({ body: '장\n===\n\n문단', headings: [{ depth: 1, slug: 'jang', text: '장' }] }),
    ).blocks.slice(6);
    expect(blocks.map(({ chapter, text }) => [chapter?.id, text])).toEqual([
      ['jang', '장'],
      ['jang', '문단'],
    ]);
  });
});

describe('searchPost plain text', () => {
  it.each([
    [
      'emphasis',
      '**굵게** *기울임* _밑줄 강조_ ~~취소~~ ***둘 다***',
      '굵게 기울임 밑줄 강조 취소 둘 다',
    ],
    ['nothing inside snake_case', 'use_state 와 a_b_c', 'use_state 와 a_b_c'],
    [
      'link syntax but keeps the text',
      '[문서](https://a.dev) 와 [참조][ref] 링크',
      '문서 와 참조 링크',
    ],
    ['images', '앞 ![그림](/a.png) 뒤', '앞 뒤'],
    [
      'code span markers but keeps the code',
      '`**not bold**` 와 ``a ` b``',
      '**not bold** 와 a ` b',
    ],
    [
      'inline JSX and HTML tags',
      '앞 <Badge tone={"x"}>꼬리표</Badge> <span class="a">뒤</span>',
      '앞 꼬리표 뒤',
    ],
    ['expressions', '값은 {props.value} 이고 {/* 메모 */} 끝', '값은 이고 끝'],
    ['escapes and entities', '\\*별\\* &amp; &lt;태그&gt; &#44;', '*별* & <태그> ,'],
    ['autolink brackets', '<https://scwon.me> 로', 'https://scwon.me 로'],
    ['line breaks', '첫 줄  \n둘째 줄<br/>셋째', '첫 줄 둘째 줄 셋째'],
  ])('strips %s', (_, body, expected) => {
    expect(bodyTexts(body)).toEqual([expected]);
  });

  it('strips markers from headings', () => {
    expect(bodyTexts('## **강조된** `code` 제목 ##', [{ depth: 2, slug: 'x', text: 'x' }])).toEqual(
      ['강조된 code 제목'],
    );
  });
});
