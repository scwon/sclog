/**
 * 탐색기 트리 규칙. DOM을 모르고 트리(props)와 URL만 본다. 빌드(글 끝 줄)와 창 틀(팔레트 명령)이 같이 쓴다.
 */

import type { TreeFile, TreeRoot, TreeYear } from './Shell';

/** 트리의 모든 연도 폴더(루트 순서, 그 안은 최신 연도 먼저). 루트 폴더 층을 걷고 연도 폴더만 볼 때 쓴다. */
export function treeYears(tree: TreeRoot[]): TreeYear[] {
  return tree.flatMap((root) => root.years);
}

/**
 * 다음 파일: 탐색기에서 같은 연도 폴더 안, 바로 다음으로 새 글 하나. 폴더 안의 글은 새 글이 먼저 놓이므로 목록에서
 * 바로 앞 항목이다. 연도 폴더도 루트 폴더도 넘지 않고 읽은 글도 건너뛰지 않는다. 폴더의 가장 새 글이거나 트리에 없는
 * URL이면 `null`.
 */
export function nextFile(tree: TreeRoot[], url: string): TreeFile | null {
  for (const { files } of treeYears(tree)) {
    const index = files.findIndex((file) => file.url === url);
    if (index >= 0) return files[index - 1] ?? null;
  }
  return null;
}

/** 트리의 모든 글 URL(루트 순서, 그 안은 트리 순서). 읽기 기록을 발행 글로 거를 때 쓴다. */
export function treeUrls(tree: TreeRoot[]): string[] {
  return treeYears(tree).flatMap((year) => year.files.map((file) => file.url));
}
