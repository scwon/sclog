import { describe, expect, it } from 'vitest';
import {
  findInBlocks,
  findPosition,
  firstVisibleMatch,
  scrollToCenter,
  stepMatch,
  type FindBlock,
} from './find.logic';

/** 텍스트 노드 대역: 이름과 글자. */
type Node = { name: string; text: string };

/** 블록 하나를 노드 글자 목록으로 만든다. 노드 이름은 `블록번호.노드번호`다. */
function blocks(...texts: string[][]): FindBlock<Node>[] {
  return texts.map((nodes, b) =>
    nodes.map((text, n) => ({ node: { name: `${b}.${n}`, text }, text })),
  );
}

/** 일치를 `노드:오프셋-노드:오프셋`으로 읽는다. */
const spans = (found: ReturnType<typeof findInBlocks<Node>>) =>
  found.map(
    ({ start, end }) => `${start.node.name}:${start.offset}-${end.node.name}:${end.offset}`,
  );

describe('findInBlocks', () => {
  it('maps a match inside one text node to that node and its offsets', () => {
    expect(spans(findInBlocks(blocks(['나는 개발자다']), '개발'))).toEqual(['0.0:3-0.0:5']);
  });

  it('maps a match spanning several text nodes of one block (inline elements)', () => {
    // <p>프론트<em>엔드</em> 개발</p>: "트엔" crosses from the first node into <em>.
    expect(spans(findInBlocks(blocks(['프론트', '엔드', ' 개발']), '트엔드 개'))).toEqual([
      '0.0:2-0.2:2',
    ]);
  });

  it('ends a match at the end of a node rather than at the start of the next one', () => {
    expect(spans(findInBlocks(blocks(['개발', '자']), '개발'))).toEqual(['0.0:0-0.0:2']);
  });

  it('starts a match at the start of a node rather than at the end of the previous one', () => {
    expect(spans(findInBlocks(blocks(['나는 ', '개발']), '개발'))).toEqual(['0.1:0-0.1:2']);
  });

  it('never makes a match across a block boundary (paragraph end)', () => {
    expect(spans(findInBlocks(blocks(['끝은 개'], ['발이다']), '개발'))).toEqual([]);
    expect(spans(findInBlocks(blocks(['개발'], ['개발']), '개발'))).toEqual([
      '0.0:0-0.0:2',
      '1.0:0-1.0:2',
    ]);
  });

  it('widens a syllable still being typed to the whole syllable: "개바" paints "개발"', () => {
    expect(spans(findInBlocks(blocks(['프론트엔드 개발 이야기']), '개바'))).toEqual([
      '0.0:6-0.0:8',
    ]);
  });

  it('ignores case like the search view', () => {
    expect(spans(findInBlocks(blocks(['Astro와 astro']), 'ASTRO'))).toEqual([
      '0.0:0-0.0:5',
      '0.0:7-0.0:12',
    ]);
  });

  it('trims the query and finds from one character', () => {
    expect(spans(findInBlocks(blocks(['가나다 가']), '  가 '))).toEqual([
      '0.0:0-0.0:1',
      '0.0:4-0.0:5',
    ]);
  });

  it('finds nothing for a blank query', () => {
    expect(findInBlocks(blocks(['   ']), '   ')).toEqual([]);
    expect(findInBlocks(blocks(['개발']), '')).toEqual([]);
  });

  it('skips empty text nodes', () => {
    expect(spans(findInBlocks(blocks(['개', '', '발']), '개발'))).toEqual(['0.0:0-0.2:1']);
  });
});

describe('stepMatch', () => {
  it('goes to the next and previous match', () => {
    expect(stepMatch(2, 12, 1)).toBe(3);
    expect(stepMatch(2, 12, -1)).toBe(1);
  });

  it('wraps from the last match to the first and back', () => {
    expect(stepMatch(11, 12, 1)).toBe(0);
    expect(stepMatch(0, 12, -1)).toBe(11);
  });

  it('stays on the only match and has nowhere to go without matches', () => {
    expect(stepMatch(0, 1, 1)).toBe(0);
    expect(stepMatch(0, 1, -1)).toBe(0);
    expect(stepMatch(-1, 0, 1)).toBe(-1);
  });
});

describe('firstVisibleMatch', () => {
  // 일치의 위·아래 끝(뷰포트 좌표), 문서 순서. 보이는 영역의 위 끝은 100이다.
  const rects = [
    { top: -400, bottom: -380 },
    { top: 90, bottom: 110 },
    { top: 300, bottom: 320 },
  ];

  it('starts at the first match at or below the top of the visible area', () => {
    expect(firstVisibleMatch(rects, 100)).toBe(1);
    expect(firstVisibleMatch(rects, 200)).toBe(2);
  });

  it('starts at the first match when every match is above the visible area', () => {
    expect(firstVisibleMatch(rects, 1000)).toBe(0);
  });

  it('has no start without matches', () => {
    expect(firstVisibleMatch([], 100)).toBe(-1);
  });
});

describe('findPosition', () => {
  it('shows the current match and the count as 3/12', () => {
    expect(findPosition('개발', 2, 12)).toBe('3/12');
  });

  it('says 결과 없음 when nothing matches', () => {
    expect(findPosition('없는 말', -1, 0)).toBe('결과 없음');
  });

  it('is empty while the query is blank', () => {
    expect(findPosition('', -1, 0)).toBe('');
    expect(findPosition('  ', -1, 0)).toBe('');
  });
});

describe('scrollToCenter', () => {
  // 보이는 영역: 위쪽 막대 아래 108px부터 아래 막대 위 876px까지(가운데 492).
  const view = { top: 108, bottom: 876 };

  it('does not move when the match is inside the visible area', () => {
    expect(scrollToCenter({ top: 200, bottom: 220 }, view)).toBe(0);
  });

  it('moves a match below the visible area to its centre', () => {
    expect(scrollToCenter({ top: 1490, bottom: 1510 }, view)).toBe(1008);
  });

  it('moves a match hidden under the top bars to the centre', () => {
    expect(scrollToCenter({ top: 100, bottom: 120 }, view)).toBe(-382);
    expect(scrollToCenter({ top: -500, bottom: -480 }, view)).toBe(-982);
  });
});
