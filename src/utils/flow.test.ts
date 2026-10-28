import { describe, expect, it, vi } from 'vitest';
import type { BlogPost } from './blog';

vi.mock('astro:content', () => ({ render: async () => ({ headings: [] }) }));

const { flowPost, listLines, rootLines } = await import('./flow');

function makePost(collection: 'blog' | 'ai-written', id: string, pubDate: string): BlogPost {
  return {
    id,
    collection,
    body: '',
    data: { title: id, pubDate: new Date(pubDate), tags: [], draft: false, description: id },
  } as unknown as BlogPost;
}

/** 장 `count`개를 가진 흐름 로그의 글. */
function entry(collection: 'blog' | 'ai-written', id: string, pubDate: string, count = 0) {
  const post = makePost(collection, id, pubDate);
  const headings = Array.from({ length: count }, (_, index) => ({
    depth: 2,
    slug: `ch-${index + 1}`,
    text: `장 ${index + 1}`,
  }));
  return { post, flow: flowPost(post, headings) };
}

/** 줄을 비교하기 쉬운 글자로 줄인다. */
function shape(lines: ReturnType<typeof listLines>) {
  return lines.map((line) => {
    switch (line.kind) {
      case 'banner':
      case 'comment':
        return `${line.no} ${line.kind} ${line.text}`;
      case 'dir':
        return `${line.no} dir ${line.year} (${line.count})`;
      case 'log':
        return `${line.no} log ${line.post.url}${line.foldable ? ' foldable' : ''}`;
      case 'step':
        return `${line.no} step ${line.step.href}`;
      case 'folded':
        return `folded ${line.post.id}`;
      case 'entry':
        return `${line.no} entry ${line.label} -> ${line.href} (${line.note})${line.heading ? ' heading' : ''}`;
      case 'end':
        return `${line.no} end ${line.label}`;
      default:
        return `${line.no} ${line.kind}`;
    }
  });
}

describe('flowPost', () => {
  it('links an AI post and its chapters under /ai-written/', () => {
    const { flow } = entry('ai-written', 'note', '2026-10-01', 1);
    expect(flow.url).toBe('/ai-written/note/');
    expect(flow.steps.map((step) => step.href)).toEqual(['/ai-written/note/#ch-1']);
  });
});

describe('listLines with steps (폴더 화면 ai-written/)', () => {
  it('stacks AI posts by year with their chapter flow and counts them in the end line', () => {
    const lines = listLines(
      [entry('ai-written', 'b', '2026-10-01', 2), entry('ai-written', 'a', '2025-01-01', 0)],
      { title: 'ai-written/', comment: 'AI가 처음부터 끝까지 쓴 글', steps: true },
    );
    expect(shape(lines)).toEqual([
      '1 banner ai-written/',
      '2 comment AI가 처음부터 끝까지 쓴 글',
      '3 blank',
      '4 dir 2026 (1)',
      '5 log /ai-written/b/ foldable',
      '6 step /ai-written/b/#ch-1',
      '7 step /ai-written/b/#ch-2',
      'folded b',
      '8 dir 2025 (1)',
      '9 log /ai-written/a/',
      '10 end 글 2편',
    ]);
  });

  it('keeps post cards without chapter flow when steps is off (태그별 글)', () => {
    const lines = listLines([entry('blog', 'x', '2023-04-30', 2)], {
      title: '#회고',
      comment: '#회고 태그가 붙은 글 1편',
    });
    expect(shape(lines)).toEqual([
      '1 banner #회고',
      '2 comment #회고 태그가 붙은 글 1편',
      '3 blank',
      '4 dir 2023 (1)',
      '5 log /blog/x/',
      '6 end 글 1편',
    ]);
  });
});

const site = { brand: 'sclog', author: 'scwon', githubUrl: 'https://github.com/scwon' };

describe('rootLines (루트 디렉터리 뷰)', () => {
  it('lists the folders given as link lines after the banner and counts them in the end line', () => {
    const lines = rootLines(site, [
      { href: '/blog/', label: 'posts/', note: '글 3편' },
      { href: '/ai-written/', label: 'ai-written/', note: '글 1편' },
    ]);
    expect(shape(lines)).toEqual([
      '1 banner sclog',
      '2 comment scwon ·',
      '3 blank',
      '4 entry posts/ -> /blog/ (글 3편)',
      '5 entry ai-written/ -> /ai-written/ (글 1편)',
      '6 end 폴더 2개',
    ]);
    expect(lines[1]).toMatchObject({ link: { href: site.githubUrl, label: 'github.com/scwon' } });
  });

  it('ends with 폴더 1개 when only posts/ is given', () => {
    const lines = rootLines(site, [{ href: '/blog/', label: 'posts/', note: '글 1편' }]);
    expect(shape(lines).slice(3)).toEqual(['4 entry posts/ -> /blog/ (글 1편)', '5 end 폴더 1개']);
  });
});
