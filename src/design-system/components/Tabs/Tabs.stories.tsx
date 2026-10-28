import type { MouseEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { $openTabs, closeTab, openTab } from '../../stores/tabs';
import { ROOT_TAB, type TabFile } from '../../stores/tabs.logic';
import { Tabs } from './Tabs';

const files: TabFile[] = [
  {
    url: '/blog/pro-developer-2023-days/',
    title: '프로 개발자 2023일 후기',
    path: 'posts/2023/pro-developer-2023-days.mdx',
  },
  {
    url: '/blog/design-system/',
    title: '디자인 시스템 만들기',
    path: 'posts/2026/design-system.mdx',
  },
];

let seeded = false;

/** 스토리 안에서는 실제로 이동하지 않고 그 탭을 활성 탭으로만 바꾼다. */
function activate(url: string) {
  const file = $openTabs.get()[url];
  if (file) openTab(file);
}

function stayInStory(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-tab-link]');
  if (!link) return;
  event.preventDefault();
  activate(link.getAttribute('href') ?? ROOT_TAB.url);
}

const meta = {
  title: 'Design System/Tabs',
  component: Tabs,
  args: { onNavigate: activate },
  parameters: { layout: 'fullscreen' },
  // 미리보기를 처음 열 때 한 번만 루트 탭 + 글 두 개를 열고 첫 글을 활성 탭으로 둔다(세션에 남은 탭은 지운다).
  // 데코레이터나 beforeEach는 툴바 테마를 바꿀 때마다 다시 돌아 닫은 탭이 되살아나므로 한 번만 깐다.
  beforeEach: () => {
    if (seeded) return;
    seeded = true;
    for (const url of Object.keys($openTabs.get())) closeTab(url);
    for (const file of files) openTab(file);
    openTab(files[0]);
  },
  decorators: [
    (Story) => (
      <div onClickCapture={stayInStory}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 탭 3개. 탭을 누르면 활성 탭(코랄 윗선)이 바뀌고, `×`로 닫으면 활성 탭은 왼쪽 탭으로 옮겨 간다.
 * 탭 링크에서 좌우 화살표로 오간다. 아래 버튼으로 새 탭을 열면 왼쪽에서 펼쳐진다.
 */
export const Default: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <Tabs {...args} />
      <div className="flex gap-3 px-4 font-mono text-xs">
        <button
          type="button"
          className="cursor-pointer text-text-muted underline hover:text-text"
          onClick={() =>
            openTab({
              url: `/blog/note-${Date.now()}/`,
              title: '새 글',
              path: `posts/2026/note-${new Date().getSeconds()}.mdx`,
            })
          }
        >
          새 탭 열기
        </button>
      </div>
    </div>
  ),
};
