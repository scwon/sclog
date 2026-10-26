import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { setReading } from '../../stores/reading';
import type { OutlineItem } from '../../stores/file.logic';
import { setSearchQuery } from '../../stores/search';
import type { SearchBlock, SearchIndex } from '../../stores/search-index';
import { writePanelView } from './panel';
import { Shell, type ShellProps } from './Shell';

const tree: ShellProps['tree'] = [
  {
    year: '2023',
    files: [
      {
        url: '/blog/pro-developer-2023-days/',
        title: '프로 개발자 2023일 후기',
        path: 'posts/2023/pro-developer-2023-days.mdx',
      },
    ],
  },
];

const profile: ShellProps['profile'] = {
  name: '원성철',
  role: 'Frontend Developer',
  bio: '프론트엔드 개발자 원성철입니다.',
  photo: '/images/profile/photo.jpg',
  career: ['WhaTapLabs · 2017.10~'],
  links: [
    { label: 'GitHub', url: 'https://github.com/scwon' },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/%EC%84%B1%EC%B2%A0-%EC%9B%90-b9837821b/',
    },
    { label: 'scwon1999@gmail.com', url: 'mailto:scwon1999@gmail.com' },
  ],
};

const outline: OutlineItem[] = [
  { id: 'today', text: '오늘은 2023년 04월 30일', children: [] },
  { id: 'why', text: '왜 개발자?', children: [] },
  { id: 'frontend', text: '프론트엔드 개발자', children: [] },
  {
    id: 'developer',
    text: '개발자란?',
    children: [
      { id: 'first', text: '입사 직후' },
      { id: 'y12', text: '1~2년차' },
      { id: 'y34', text: '3~4년차' },
      { id: 'y56', text: '5~6년차' },
    ],
  },
  { id: 'end', text: '마치며', children: [{ id: 'say', text: '하고 싶은 말' }] },
];

const developer = { id: 'developer', no: '04', text: '개발자란?' };

/** 검색 화면 스토리의 색인 고정값. 결과가 여러 파일·여러 줄일 때의 모양을 보려고 글 셋을 만든다. */
const searchIndex: SearchIndex = {
  v: 1,
  posts: [
    {
      url: '/blog/korean-search/',
      title: '한국어 검색을 직접 만들기',
      path: 'posts/2025/korean-search.mdx',
      blocks: [
        { line: 5, chapter: null, section: null, text: '한국어 검색을 직접 만들기' },
        {
          line: 9,
          chapter: { id: 'jamo', no: '01', text: '자모로 나누기' },
          section: null,
          text: 'NFD로 바꾸면 입력 중인 음절도 찾을 수 있다. 개발자 블로그 정도 규모에서는 이걸로 충분하다.',
        },
      ],
    },
    {
      url: '/blog/pro-developer-2023-days/',
      title: '프로 개발자 2023일 후기',
      path: 'posts/2023/pro-developer-2023-days.mdx',
      blocks: [
        { line: 5, chapter: null, section: null, text: '프로 개발자 2023일 후기' },
        ...[
          '개발자란 무엇인가를 다시 생각해 본다.',
          '입사 직후에는 개발보다 회의가 많았다.',
          '1~2년차에는 개발 속도를 올리는 데 힘을 썼다.',
          '3~4년차가 되자 남이 쓴 코드를 읽는 시간이 개발하는 시간보다 길어졌다. 읽기 좋은 코드가 무엇인지 그때 처음 생각했다.',
          '5~6년차에는 개발 문화를 만드는 일에 끼게 되었다.',
          '좋은 개발자는 결국 좋은 동료라는 생각이 든다.',
          '마지막으로, 개발을 계속하고 싶은 이유를 적어 둔다.',
        ].map((text, index): SearchBlock => ({
          line: 20 + index * 3,
          chapter: developer,
          section: index === 3 ? { id: 'y34', text: '3~4년차' } : null,
          text,
        })),
      ],
    },
    {
      url: '/blog/frontend-team/',
      title: '프론트엔드 팀의 1년',
      path: 'posts/2024/frontend-team.mdx',
      blocks: [
        {
          line: 12,
          chapter: { id: 'retro', no: '01', text: '회고' },
          section: { id: 'good', text: '잘한 것' },
          text: '프론트엔드 개발자 셋이 디자인 시스템을 처음 만들었다.',
        },
      ],
    },
  ],
};

/** 글을 3~4년차까지 읽은 상태. 창 틀이 파일을 열며 읽기 위치를 비운 뒤에 채운다(형제 effect는 순서대로 돈다). */
function ReadTo34() {
  useEffect(() => {
    setReading({
      line: 28,
      chapter: { id: 'developer', no: '04', text: '개발자란?' },
      section: { id: 'y34', text: '3~4년차' },
      percent: 53,
    });
  }, []);
  return null;
}

/** 에디터 루트(페이지 ↔ 창 틀 계약). 실제 사이트에서는 Astro 레이아웃이 정적 HTML로 그린다. */
function Editor({ file, children }: { file: Record<string, string>; children: React.ReactNode }) {
  return (
    <main
      id="editor"
      className="ide-editor"
      tabIndex={-1}
      {...Object.fromEntries(
        Object.entries(file).map(([name, value]) => [`data-file-${name}`, value]),
      )}
    >
      {children}
    </main>
  );
}

const meta = {
  title: 'Design System/Shell',
  component: Shell,
  parameters: { layout: 'fullscreen' },
  // 마지막 패널 화면은 sessionStorage에 남으므로 스토리마다 탐색기에서 시작하고 검색어를 비운다.
  beforeEach: () => {
    writePanelView('explorer');
    setSearchQuery('');
  },
  args: {
    brand: 'scwon’s blog',
    author: '원성철',
    githubUrl: 'https://github.com/scwon',
    sourceUrl: 'https://github.com/scwon/sclog',
    tree,
    profile,
    // 실제 사이트는 `/search-index.json`. Storybook에는 그 주소가 없으므로 고정값을 data URL로 넘긴다.
    searchIndexUrl: `data:application/json,${encodeURIComponent(JSON.stringify(searchIndex))}`,
  },
} satisfies Meta<typeof Shell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 홈 상태: `posts.log`가 활성 탭이고 패널은 프로필을 보인다. 상태줄에 열기 요약이 2초 보인다. */
export const Home: Story = {
  render: (args) => (
    <>
      <Shell {...args} />
      <Editor
        file={{ title: 'posts.log', path: 'posts.log', url: '/', kind: 'log', summary: '글 1편' }}
      >
        <div className="ide-crumbs">
          <ol className="ide-crumbs-path" aria-label="위치">
            <li>posts</li>
            <li aria-current="page">posts.log</li>
          </ol>
        </div>
        <p className="p-8 text-text-muted">흐름 로그가 여기에 열린다.</p>
      </Editor>
    </>
  ),
};

/**
 * 글 열림 상태: 글 탭이 활성이고, 탐색기의 현재 글이 강조되며 그 아래 개요가 보인다. 3~4년차까지 읽어
 * 개요의 현재 항목과 세로선(53%), 상태줄 `04 개발자란? › 3~4년차 · Ln 28 · 53%`가 보인다.
 */
export const ArticleOpen: Story = {
  render: (args) => (
    <>
      <Shell {...args} />
      <ReadTo34 />
      <Editor
        file={{
          title: '프로 개발자 2023일 후기',
          path: 'posts/2023/pro-developer-2023-days.mdx',
          url: '/blog/pro-developer-2023-days/',
          kind: 'post',
          size: '12145',
          reading: '7',
        }}
      >
        <div className="ide-crumbs">
          <ol className="ide-crumbs-path" aria-label="위치">
            <li>posts</li>
            <li>2023</li>
            <li aria-current="page">pro-developer-2023-days.mdx</li>
          </ol>
        </div>
        <p className="p-8 text-text-muted">글 본문이 여기에 열린다.</p>
      </Editor>
      <script
        type="application/json"
        id="editor-outline"
        // 계약상 개요는 JSON 텍스트다.
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(outline) }}
      />
    </>
  ),
};

/**
 * 검색 화면: 활동 막대의 돋보기가 선택되고, `개바`로 찾은 결과가 `N개 파일, M줄` 요약 아래 파일별로 묶인다.
 * 입력 중인 음절이라 `개발` 두 음절이 칠해지고, 제목에 검색어가 든 글이 위에 온다. 여덟 줄이 맞은 글은 다섯 줄만
 * 보이고 `… 3줄 더`로 편다.
 */
export const Search: Story = {
  beforeEach: () => {
    writePanelView('search');
    setSearchQuery('개바');
  },
  render: ArticleOpen.render,
};

/** 검색 색인을 받지 못했을 때: 안내 문구와 `다시 시도` 버튼. */
export const SearchIndexError: Story = {
  ...Search,
  args: { searchIndexUrl: '/missing-search-index.json' },
};
