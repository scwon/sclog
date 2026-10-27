import { describe, expect, it } from 'vitest';
import {
  headingAbove,
  slugOf,
  toolbarAllowed,
  toolbarPlacement,
  visibleActions,
  type ElementStep,
  type SelectionAction,
  type SelectionContext,
} from './selection.logic';

/** 본문 문단 안의 글자: 문단 → 본문 → 글 → 에디터. */
const paragraph: ElementStep[] = [
  { name: 'p' },
  { name: 'div', id: 'content', classes: ['doc-prose'] },
  { name: 'article', classes: ['doc'] },
  { name: 'main', id: 'editor' },
];

describe('toolbarAllowed: 선택 툴바를 띄울 선택인가', () => {
  it('본문 문단에서 세 글자 넘게 고르면 띄운다', () => {
    expect(
      toolbarAllowed({
        start: paragraph,
        end: paragraph,
        text: '개발자로 일한 지',
        coarsePointer: false,
      }),
    ).toBe(true);
  });

  it('한쪽 끝이라도 본문 밖(글 제목, 꼬리)이면 띄우지 않는다', () => {
    const title: ElementStep[] = [
      { name: 'h1', classes: ['doc-title'] },
      { name: 'header', classes: ['doc-head'] },
      { name: 'article', classes: ['doc'] },
    ];
    const text = '개발자로 일한 지';
    expect(toolbarAllowed({ start: title, end: paragraph, text, coarsePointer: false })).toBe(
      false,
    );
    expect(toolbarAllowed({ start: paragraph, end: title, text, coarsePointer: false })).toBe(
      false,
    );
  });

  it.each([
    ['코드 블록', [{ name: 'span' }, { name: 'code' }, { name: 'pre' }]],
    [
      '코드 블록 머리(언어 라벨)',
      [{ name: 'span' }, { name: 'div', classes: ['code-block-wrapper'] }],
    ],
    ['표', [{ name: 'td' }, { name: 'tr' }, { name: 'tbody' }, { name: 'table' }]],
    [
      '장 제목',
      [
        { name: 'span', id: 'intro:text' },
        { name: 'h2', id: 'intro' },
      ],
    ],
    ['소절 제목', [{ name: 'h4', id: 'deep' }]],
    ['목차', [{ name: 'a' }, { name: 'li' }, { name: 'ul' }, { name: 'nav' }]],
  ] satisfies [string, ElementStep[]][])('%s 안에 끝이 있으면 띄우지 않는다', (_, inner) => {
    const inside = [...inner, ...paragraph.slice(1)];
    const text = '개발자로 일한 지';
    expect(toolbarAllowed({ start: inside, end: paragraph, text, coarsePointer: false })).toBe(
      false,
    );
    expect(toolbarAllowed({ start: paragraph, end: inside, text, coarsePointer: false })).toBe(
      false,
    );
  });

  it('문장 속 인라인 코드·강조·링크는 일반 글자로 본다', () => {
    const inline: ElementStep[] = [
      { name: 'code' },
      { name: 'strong' },
      { name: 'a' },
      ...paragraph,
    ];
    expect(
      toolbarAllowed({ start: inline, end: inline, text: 'useStore 훅', coarsePointer: false }),
    ).toBe(true);
  });

  it('공백을 뺀 글자가 세 자 미만이면 띄우지 않는다', () => {
    const facts = { start: paragraph, end: paragraph, coarsePointer: false };
    expect(toolbarAllowed({ ...facts, text: '개발' })).toBe(false);
    expect(toolbarAllowed({ ...facts, text: ' 개\n 발\t' })).toBe(false);
    expect(toolbarAllowed({ ...facts, text: '개 발 자' })).toBe(true);
  });

  it('터치 화면(coarse 포인터)에서는 띄우지 않는다', () => {
    expect(
      toolbarAllowed({ start: paragraph, end: paragraph, text: '개발자로', coarsePointer: true }),
    ).toBe(false);
  });
});

/** 본문 단: 화면 왼쪽 300px에서 680px 폭. */
const column = { left: 300, right: 980 };
/** 넉넉한 화면과 버튼 하나짜리 툴바(36px 정사각). 들이기·묶기가 일어나지 않는다. */
const room = {
  screen: { top: 0, bottom: 2400, right: 1400 },
  button: { width: 36, height: 36 },
};

describe('toolbarPlacement: 상자와 버튼 자리', () => {
  // 세 줄에 걸친 선택. 줄 높이 28px, 첫 줄은 중간부터, 끝 줄은 중간까지.
  const lines = [
    { top: 100, bottom: 128, left: 520, right: 980 },
    { top: 128, bottom: 156, left: 300, right: 980 },
    { top: 156, bottom: 184, left: 300, right: 610 },
  ];

  it('상자는 첫 줄 위에서 끝 줄 아래까지, 폭은 본문 단 전체(여백을 조금 둔다)', () => {
    expect(toolbarPlacement({ ...room, lines, column, backward: false })?.box).toEqual({
      top: 94,
      bottom: 190,
      left: 290,
      right: 990,
    });
  });

  it('버튼 기준점은 상자 오른쪽 가장자리, 마우스를 놓은 끝 줄 높이다', () => {
    expect(toolbarPlacement({ ...room, lines, column, backward: false })?.anchor).toEqual({
      top: 156,
      bottom: 184,
      left: 990,
      right: 990,
    });
  });

  it('위로 드래그하면 끝이 첫 줄이라 버튼도 첫 줄 높이다', () => {
    const placement = toolbarPlacement({ ...room, lines, column, backward: true });
    expect(placement?.anchor).toEqual({ top: 100, bottom: 128, left: 990, right: 990 });
    expect(placement?.box).toEqual({ top: 94, bottom: 190, left: 290, right: 990 });
  });

  it('여러 문단에 걸치면 사이 문단 전체의 rect가 섞여도 상자 하나, 버튼은 끝 줄', () => {
    const across = [
      { top: 100, bottom: 128, left: 700, right: 980 },
      // 사이 문단 전체(요소 rect)와 그 안의 줄들
      { top: 150, bottom: 262, left: 300, right: 980 },
      { top: 150, bottom: 178, left: 300, right: 980 },
      { top: 234, bottom: 262, left: 300, right: 980 },
      { top: 284, bottom: 312, left: 300, right: 420 },
    ];
    expect(toolbarPlacement({ ...room, lines: across, column, backward: false })).toEqual({
      box: { top: 94, bottom: 318, left: 290, right: 990 },
      line: { top: 284, bottom: 312 },
      inset: false,
      anchor: { top: 284, bottom: 312, left: 990, right: 990 },
    });
  });

  it('끝 줄과 아래 변이 같은 요소 rect가 있으면 줄 높이(짧은 rect)를 고른다', () => {
    const tail = [
      { top: 100, bottom: 128, left: 300, right: 980 },
      { top: 100, bottom: 156, left: 300, right: 980 },
      { top: 128, bottom: 156, left: 300, right: 500 },
    ];
    expect(toolbarPlacement({ ...room, lines: tail, column, backward: false })?.anchor.top).toBe(
      128,
    );
    expect(toolbarPlacement({ ...room, lines: tail, column, backward: true })?.anchor.bottom).toBe(
      128,
    );
  });

  it('글자 rect가 줄 높이보다 낮으면 줄 높이(선택색이 칠해지는 줄 상자)까지 위아래로 넓혀 잰다', () => {
    // 글자 높이 24px, 줄 높이 36px: 위아래로 6px씩 넓힌다.
    const glyphs = [
      { top: 106, bottom: 130, left: 520, right: 980 },
      { top: 142, bottom: 166, left: 300, right: 610 },
    ];
    expect(
      toolbarPlacement({ ...room, lines: glyphs, column, backward: false, lineHeight: 36 }),
    ).toEqual({
      box: { top: 94, bottom: 178, left: 290, right: 990 },
      line: { top: 136, bottom: 172 },
      inset: false,
      anchor: { top: 136, bottom: 172, left: 990, right: 990 },
    });
  });

  it('오른쪽 여백이 버튼 폭보다 좁으면 버튼을 상자 안쪽 오른쪽 위로 들인다', () => {
    // 상자 오른쪽 990, 간격 6, 버튼 폭 36: 화면 오른쪽이 1032보다 작으면 바깥에 들어가지 않는다.
    const narrow = { ...room, screen: { ...room.screen, right: 1010 } };
    const placement = toolbarPlacement({ lines, column, backward: false, ...narrow });
    expect(placement?.inset).toBe(true);
    expect(placement?.anchor).toEqual({ top: 100, bottom: 100, left: 990, right: 990 });

    const fits = { ...room, screen: { ...room.screen, right: 1032 } };
    expect(toolbarPlacement({ lines, column, backward: false, ...fits })?.inset).toBe(false);
  });

  describe('상자가 화면보다 길면 버튼 세로 위치를 화면 안으로 묶는다', () => {
    // 화면은 위 140(탭·경로 표시줄 아래)부터 900까지. 선택은 100에서 2000까지 이어진다.
    const screen = { top: 140, bottom: 900, right: 1400 };
    const tall = [
      { top: 100, bottom: 128, left: 520, right: 980 },
      { top: 128, bottom: 1972, left: 300, right: 980 },
      { top: 1972, bottom: 2000, left: 300, right: 610 },
    ];

    it('끝 줄이 화면 아래에 있으면 버튼은 화면 아래 끝에 붙는다', () => {
      const anchor = toolbarPlacement({
        ...room,
        screen,
        lines: tall,
        column,
        backward: false,
      })?.anchor;
      expect(anchor).toEqual({ top: 864, bottom: 892, left: 990, right: 990 });
    });

    it('위로 드래그해 끝 줄이 화면 위에 있으면 버튼은 화면 위 끝에 붙는다', () => {
      const anchor = toolbarPlacement({
        ...room,
        screen,
        lines: tall,
        column,
        backward: true,
      })?.anchor;
      expect(anchor).toEqual({ top: 140, bottom: 168, left: 990, right: 990 });
    });

    it('안으로 들인 버튼도 상자 위 끝이 화면 위에 있으면 화면 위 끝에 붙는다', () => {
      const narrow = { ...screen, right: 1010 };
      const placement = toolbarPlacement({
        ...room,
        screen: narrow,
        lines: tall,
        column,
        backward: false,
      });
      expect(placement?.inset).toBe(true);
      expect(placement?.anchor).toEqual({ top: 140, bottom: 140, left: 990, right: 990 });
    });

    it('상자가 통째로 화면 밖이면 버튼도 상자를 따라 밖에 있다', () => {
      const above = { ...screen, top: 400 };
      const placement = toolbarPlacement({
        ...room,
        screen: above,
        lines,
        column,
        backward: false,
      });
      expect(placement?.anchor).toEqual({ top: 156, bottom: 184, left: 990, right: 990 });
    });
  });

  it('높이가 없는 rect는 버리고, 남는 것이 없으면 자리가 없다', () => {
    const empty = [{ top: 120, bottom: 120, left: 300, right: 300 }];
    expect(toolbarPlacement({ ...room, lines: empty, column, backward: false })).toBeNull();
    expect(toolbarPlacement({ ...room, lines: [], column, backward: false })).toBeNull();
  });
});

const action = (id: string, when: (c: SelectionContext) => boolean): SelectionAction => ({
  id,
  label: id,
  icon: null,
  mobile: false,
  when,
  run: () => true,
});

describe('visibleActions: 툴바에 그릴 동작', () => {
  const ctx: SelectionContext = { text: '개발자로 일한 지', slug: 'developer', headingId: 'intro' };

  it('when이 참인 동작만 등록한 순서대로 남긴다', () => {
    const actions = [
      action('copy', () => true),
      action('search', (c) => c.headingId === 'elsewhere'),
      action('quote', (c) => c.slug === 'developer'),
    ];
    expect(visibleActions(actions, ctx).map(({ id }) => id)).toEqual(['copy', 'quote']);
  });
});

describe('selection context', () => {
  it('slugOf: 글 파일 주소에서 slug를 꺼낸다', () => {
    expect(slugOf('/blog/developer/')).toBe('developer');
    expect(slugOf('/blog/2023-retro')).toBe('2023-retro');
    expect(slugOf(undefined)).toBeNull();
    expect(slugOf('/')).toBeNull();
  });

  it('headingAbove: 선택이 시작한 블록부터 위로 가장 가까운 제목의 id', () => {
    const blocks: ElementStep[] = [
      { name: 'p' },
      { name: 'ul' },
      { name: 'h3', id: 'section' },
      { name: 'p' },
      { name: 'h2', id: 'chapter' },
    ];
    expect(headingAbove(blocks)).toBe('section');
    expect(headingAbove([{ name: 'h4', id: 'self' }, ...blocks])).toBe('self');
    expect(headingAbove([{ name: 'p' }, { name: 'h2' }, { name: 'p' }])).toBeNull();
    expect(headingAbove([])).toBeNull();
  });
});
