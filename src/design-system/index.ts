/**
 * 디자인 시스템 3층 진입점. 소비자(레이아웃·페이지·콘텐츠 컴포넌트)는 CSS 진입점
 * `styles/index.css`와 이 파일만 import한다.
 */
export { Badge, type BadgeProps } from './components/Badge/Badge';
export { Button, type ButtonProps } from './components/Button/Button';
export { IconButton, type IconButtonProps } from './components/IconButton/IconButton';
export {
  Shell,
  type CurrentFile,
  type Profile,
  type ShellProps,
  type TreeFile,
  type TreeYear,
} from './components/Shell/Shell';
export { nextFile } from './components/Shell/tree.logic';
export { Tabs, type TabsProps } from './components/Tabs/Tabs';
export { ThemeToggle, type ThemeToggleProps } from './components/ThemeToggle/ThemeToggle';
export { Tooltip, TooltipContent, TooltipTrigger } from './components/Tooltip/Tooltip';
export {
  $reading,
  emptyReading,
  resetReading,
  setReading,
  type ReadingState,
} from './stores/reading';
export {
  chapterNo,
  currentBlock,
  locateInOutline,
  readingPercent,
  readingSymbol,
  type ReadingPlace,
} from './stores/reading.logic';
export { $activeTab, $openTabs, closeTab, openTab, showTab } from './stores/tabs';
export { POSTS_LOG, type TabEntry, type TabFile } from './stores/tabs.logic';
export type { EditorFile, FileKind, OutlineItem } from './stores/file.logic';
export { $theme, setTheme, toggleTheme } from './stores/theme';
export type { Theme } from './stores/theme.logic';
