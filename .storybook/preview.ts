import type { Preview } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/design-system/styles/index.css';
import { suppressThemeTransitions } from '../src/design-system/stores/theme';

/**
 * 툴바가 `<html data-theme>`를 바꾸는 순간에는 사이트의 `setTheme`처럼 전환 효과를 끈다. 이게 없으면 색이
 * 옛 테마에서 서서히 바뀌는 동안 a11y 애드온이 검사해 명암비 오탐을 낸다. MutationObserver 콜백은 다음
 * 스타일 계산 전에 돌므로 새 테마와 전환 차단이 같은 프레임에 적용된다.
 */
new MutationObserver(suppressThemeTransitions).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // 사이트와 같이 <html data-theme>을 바꾼다(ADR 0002). 기본값이 data-theme·html이다.
  decorators: [
    withThemeByDataAttribute({
      themes: { dark: 'dark', light: 'light' },
      defaultTheme: 'dark',
    }),
  ],
};

export default preview;
