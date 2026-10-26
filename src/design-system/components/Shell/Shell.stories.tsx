import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { setReading } from '../../stores/reading';
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
  photoBack: '/images/profile/dot.png',
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

/** 홈 상태: `posts.log`가 활성 탭이고 탐색기에는 글 트리만 있다. 상태줄에 열기 요약이 2초 보인다. */
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

/** 프로필 화면: 활동 막대 맨 위 프로필 아이콘을 눌러 패널이 탐색기 대신 프로필을 보인다. 사진에 마우스를 올리면 뒤집힌다. */
export const ProfileOpen: Story = {
  ...Home,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '프로필' }));
  },
};
