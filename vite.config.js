import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    react(),
    inject({
      $: 'jquery',
      jQuery: 'jquery',
    })],
});

