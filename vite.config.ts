import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'; // TODO: Uncomment after installing @vitejs/plugin-basic-ssl

export default defineConfig(({ command }) => ({
  plugins: [
    command === 'serve' ? basicSsl() : []
  ],
  server: {
    host: "::",
    // https: true, // Commented out to fix build type error
    port: 8080
  },
  build: {
    target: 'esnext'
  }
}));
