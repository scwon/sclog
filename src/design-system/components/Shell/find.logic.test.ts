import { describe, expect, it } from 'vitest';
import {
  findInBlocks,
  findPosition,
  firstVisibleMatch,
  resumeMatch,
  scrollToCenter,
  scrollToCenterX,
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

  it('counts touching matches one by one: "ㅋ" in "ㅋㅋㅋ" is three, "개발" in "개발개발" is two', () => {
    expect(spans(findInBlocks(blocks(['ㅋㅋㅋ']), 'ㅋ'))).toEqual([
      '0.0:0-0.0:1',
      '0.0:1-0.0:2',
      '0.0:2-0.0:3',
    ]);
    expect(spans(findInBlocks(blocks(['개발개발']), '개발'))).toEqual([
      '0.0:0-0.0:2',
      '0.0:2-0.0:4',
    ]);
  });

  it('merges two matches whose widened syllables overlap into one', () => {
    // "ᆯᄇ"(받침 ㄹ + 첫소리 ㅂ)는 "발발발"에서 두 번 맞고, 넓히면 둘 다 가운데 "발"을 덮는다.
    expect(spans(findInBlocks(blocks(['발발발']), '\u11af\u1107'))).toEqual(['0.0:0-0.0:3']);
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

describe('scrollToCenterX', () => {
  // 가로로 넘치는 코드 블록의 보이는 폭: 300px부터 900px까지(가운데 600).
  const view = { left: 300, right: 900 };

  it('does not move when the match is inside the visible width', () => {
    expect(scrollToCenterX({ left: 320, right: 360 }, view)).toBe(0);
  });

  it('moves a match past the right edge to the centre (scrolls right)', () => {
    expect(scrollToCenterX({ left: 1380, right: 1420 }, view)).toBe(800);
    // 오른쪽 끝에 걸쳐 일부만 보이는 일치도 옮긴다.
    expect(scrollToCenterX({ left: 880, right: 920 }, view)).toBe(300);
  });

  it('moves a match before the left edge to the centre (scrolls left)', () => {
    expect(scrollToCenterX({ left: 0, right: 40 }, view)).toBe(-580);
  });
});

/** 일치를 문서 순서의 자리(숫자)로 둔 대역의 견주기. */
const byPlace = (a: number, b: number) => a - b;

describe('resumeMatch', () => {
  it('keeps the same match when it is still there after re-collecting', () => {
    expect(resumeMatch([10, 20, 30], 20, byPlace)).toBe(1);
  });

  it('moves to the next match when the current one disappeared (folded away)', () => {
    expect(resumeMatch([10, 30, 40], 20, byPlace)).toBe(1);
  });

  it('stays on the right match when new matches appear before it (a details opened above)', () => {
    expect(resumeMatch([5, 7, 10, 20], 20, byPlace)).toBe(3);
  });

  it('falls back to the last match when every match is before the old one', () => {
    expect(resumeMatch([10, 20], 30, byPlace)).toBe(1);
  });

  it('has no match when nothing is found', () => {
    expect(resumeMatch([], 20, byPlace)).toBe(-1);
  });
});
