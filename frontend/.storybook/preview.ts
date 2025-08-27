import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { ref } from 'vue'
// import { vi } from 'vitest'; // vi のインポートを削除

// グローバルCSSのインポート
import '../app/assets/css/main.css';

// Nuxtの自動インポートをモック
setup(() => {
  // vi.stubGlobalの代わりに、windowオブジェクトに直接ダミー関数を定義します
  const global = window as any;
  global.useState = (key: string, init: () => any) => ref(init());
  global.useFetch = () => Promise.resolve({ data: ref(null), error: ref(null) });
  global.useRuntimeConfig = () => ({ public: {} });
  global.navigateTo = () => {};
  global.useRoute = () => ({});
});

const preview: Preview = {
  parameters: {
    // actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;