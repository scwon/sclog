/**
 * 탐색기 트리 규칙. DOM을 모르고 트리(props)와 URL만 본다. 빌드(글 끝 줄)와 창 틀(팔레트 명령)이 같이 쓴다.
 */

import type { TreeFile, TreeRoot } from './Shell';

/**
 * 다음 파일: 탐색기에서 같은 루트 폴더 안, 바로 다음으로 새 글 하나. 폴더 안의 글은 새 글이 먼저 놓이므로 목록에서
 * 바로 앞 항목이다. 루트 폴더를 넘지 않고 읽은 글도 건너뛰지 않는다. 폴더의 가장 새 글이거나 트리에 없는 URL이면 `null`.
 */
export function nextFile(tree: TreeRoot[], url: string): TreeFile | null {
  for (const { files } of tree) {
    const index = files.findIndex((file) => file.url === url);
    if (index >= 0) return files[index - 1] ?? null;
  }
  return null;
}

/** 트리의 모든 글 URL(루트 순서, 그 안은 트리 순서). 읽기 기록을 발행 글로 거를 때 쓴다. */
export function treeUrls(tree: TreeRoot[]): string[] {
  return tree.flatMap((root) => root.files.map((file) => file.url));
}
