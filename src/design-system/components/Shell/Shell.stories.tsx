import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { setReading } from '../../stores/reading';
import { $readingHistory } from '../../stores/readingHistory';
import { emptyHistory, type ReadingHistory } from '../../stores/readingHistory.logic';
import type { OutlineItem } from '../../stores/file.logic';
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

/** 글이 여럿인 트리. 꼬리표 스토리가 쓴다. 이름이 긴 파일은 꼬리표 대신 이름이 먼저 말줄임된다. */
const markedTree: ShellProps['tree'] = [
  {
    year: '2024',
    files: [
      {
        url: '/blog/korean-search/',
        title: '한국어 검색을 직접 만들기',
        path: 'posts/2024/korean-search.mdx',
      },
      {
        url: '/blog/astro-island-notes-with-a-very-long-file-name/',
        title: 'Astro 아일랜드 노트',
        path: 'posts/2024/astro-island-notes-with-a-very-long-file-name.mdx',
      },
      {
        url: '/blog/frontend-team/',
        title: '프론트엔드 팀 이야기',
        path: 'posts/2024/frontend-team.mdx',
      },
    ],
  },
  ...tree,
];

/** 읽은 글 둘, 읽는 중인 글 둘(42%·71%)인 기록. */
const markedHistory: ReadingHistory = {
  read: ['/blog/frontend-team/', '/blog/pro-developer-2023-days/'],
  positions: [
    { url: '/blog/astro-island-notes-with-a-very-long-file-name/', chapter: 'one', percent: 42 },
    { url: '/blog/korean-search/', chapter: 'two', percent: 71 },
  ],
};

/** 읽기 기록을 채운다(저장소에는 쓰지 않는다). 스토리를 떠나면 비운다. */
function SeedHistory({ history }: { history: ReadingHistory }) {
  useEffect(() => {
    $readingHistory.set(history);
    return () => $readingHistory.set(emptyHistory());
  }, [history]);
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
  args: {
    brand: 'scwon’s blog',
    author: '원성철',
    githubUrl: 'https://github.com/scwon',
    sourceUrl: 'https://github.com/scwon/sclog',
    tree,
    profile,
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
 * 꼬리표가 붙은 탐색기: 읽은 글은 `✓`이고 이름이 흐리며, 읽는 중인 글은 `42%`(강조 글자)다. 긴 파일 이름은
 * 꼬리표를 남기고 먼저 말줄임된다. 스크린 리더는 "읽음"·"42% 읽는 중"으로 읽는다.
 */
export const ReadingMarks: Story = {
  args: { tree: markedTree },
  render: (args) => (
    <>
      <Shell {...args} />
      <SeedHistory history={markedHistory} />
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
        <p className="p-8 text-text-muted">글 본문이 여기에 열린다.</p>
      </Editor>
    </>
  ),
};

/** 프로필 화면 맨 아래의 읽기 기록 칸: `이 브라우저에 2편 읽음 · 2편 읽는 중`과 `기록 지우기`. 누르면 안내 한 줄만 남는다. */
export const ReadingHistorySection: Story = {
  args: { tree: markedTree },
  render: (args) => (
    <>
      <Shell {...args} />
      <SeedHistory history={markedHistory} />
      <Editor
        file={{ title: 'posts.log', path: 'posts.log', url: '/', kind: 'log', summary: '글 4편' }}
      >
        <p className="p-8 text-text-muted">흐름 로그가 여기에 열린다.</p>
      </Editor>
    </>
  ),
};
