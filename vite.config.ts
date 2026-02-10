import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'; // TODO: Uncomment after installing @vitejs/plugin-basic-ssl

export default defineConfig(({ command }) => ({
  plugins: [
    command === 'serve' ? basicSsl() : []
  ],
  server: {
    host: true,
    https: true,
    port: 5173
  },
  build: {
    target: 'esnext'
  }
}));
