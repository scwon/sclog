import { useStore } from '@nanostores/react';
import { IconButton } from '../IconButton/IconButton';
import { $theme, toggleTheme } from '../../stores/theme';
import { DEFAULT_THEME, type Theme } from '../../stores/theme.logic';

const serverTheme = (): Theme => DEFAULT_THEME;

/** `ThemeToggle`의 props. */
export interface ThemeToggleProps {
  className?: string;
}

/**
 * 어두운/밝은 테마 전환 버튼. 테마 스토어를 구독하고, 누르면 테마를 바꿔 저장한다. 새 테마는 이 버튼 가운데에서
 * 원형으로 퍼진다(테마 퍼짐). `data-theme-toggle`은 퍼짐의 시작점 표지라서 다른 곳에서 테마를 바꿔도 여기서 퍼진다.
 * 이름은 "밝은 테마"로 두고 켜짐 여부는 `aria-pressed`로 알린다.
 *
 * 아이콘은 스토어 값이 아니라 `<html data-theme>`를 보는 CSS로 고른다(어두운 테마: 해, 밝은 테마: 달).
 * 서버는 테마를 모르므로, 스토어 값으로 고르면 하이드레이션 전까지 틀린 아이콘이 보인다. CSS로 고르면
 * 첫 페인트부터 맞다. `aria-pressed`는 서버 스냅샷을 기본 테마로 두고 하이드레이션 뒤 실제 값으로 다시 그린다.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useStore($theme, { ssr: serverTheme });
  return (
    <IconButton
      label="밝은 테마"
      aria-pressed={theme === 'light'}
      data-theme-toggle=""
      onClick={() => toggleTheme()}
      className={className}
    >
      <svg className="in-data-[theme=light]:hidden" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2.5v2.2m0 14.6v2.2M2.5 12h2.2m14.6 0h2.2M5.3 5.3l1.6 1.6m10.2 10.2 1.6 1.6m0-13.4-1.6 1.6M6.9 17.1l-1.6 1.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <svg className="hidden in-data-[theme=light]:block" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}
