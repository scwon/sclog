/**
 * 글자 맞추기 규칙. 검색 화면의 본문 찾기와 명령 팔레트의 파일 찾기가 같은 정규화를 쓴다.
 * 한글 음절을 NFD로 풀어 자모 단위로 맞추므로, 입력 중인 음절("개바")로도 "개발"이 맞는다.
 */

/** 맞출 글자로 바꾼다: NFD로 풀고 소문자로 맞춘다. 검색어와 본문에 똑같이 쓴다. */
export function normalizeForMatch(text: string): string {
  return text.normalize('NFD').toLowerCase();
}

/** 원래 문자열에서의 일치 범위 `[시작, 끝)`. 위치는 UTF-16 오프셋(`String.prototype.slice`와 같은 단위)이다. */
export type MatchRange = [start: number, end: number];

/** `matchRanges`의 선택. */
export interface MatchOptions {
  /**
   * 하나로 합칠 범위. `touching`(기본값)은 겹치거나 맞닿은 범위를 합친다(검색 화면 발췌는 칠한 띠 하나면 된다).
   * `overlap`은 같은 글자를 함께 덮는 범위만 합치고 맞닿은 범위는 따로 둔다(찾기 줄은 일치를 하나씩 센다).
   */
  merge?: 'touching' | 'overlap';
}

/**
 * `text`에서 `query`가 맞은 범위를 모두 찾는다. 둘 다 `normalizeForMatch`로 바꿔 부분 문자열로 맞추고, 범위는
 * 원래 문자열의 위치로 돌려준다. 일치가 음절 중간에서 시작하거나 끝나면 그 음절 전체로 넓힌다. 어떤 범위를 하나로
 * 합칠지는 `options.merge`가 정한다. 검색어 다듬기(앞뒤 공백, 최소 글자 수)는 부르는 쪽이 정한다.
 */
export function matchRanges(
  text: string,
  query: string,
  { merge = 'touching' }: MatchOptions = {},
): MatchRange[] {
  const needle = normalizeForMatch(query);
  if (!needle) return [];
  // 정규화한 글자 하나하나가 원래 문자열의 어느 글자(시작·끝 오프셋)에서 왔는지 적어 둔다.
  const from: number[] = [];
  const to: number[] = [];
  let haystack = '';
  let offset = 0;
  for (const char of text) {
    const folded = normalizeForMatch(char);
    for (let i = 0; i < folded.length; i += 1) {
      from.push(offset);
      to.push(offset + char.length);
    }
    haystack += folded;
    offset += char.length;
  }

  const ranges: MatchRange[] = [];
  for (
    let at = haystack.indexOf(needle);
    at >= 0;
    at = haystack.indexOf(needle, at + needle.length)
  ) {
    const start = from[at];
    const end = to[at + needle.length - 1];
    const last = ranges.at(-1);
    // 겹친 범위는 늘 합치고, 맞닿은 범위(`start === last[1]`)는 `touching`일 때만 합친다.
    if (last && (start < last[1] || (merge === 'touching' && start === last[1])))
      last[1] = Math.max(last[1], end);
    else ranges.push([start, end]);
  }
  return ranges;
}
