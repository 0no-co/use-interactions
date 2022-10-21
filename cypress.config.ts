import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,

  component: {
    specPattern: 'src/**/*.test.{js,ts,jsx,tsx}',
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
