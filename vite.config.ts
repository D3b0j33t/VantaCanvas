import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'; // TODO: Uncomment after installing @vitejs/plugin-basic-ssl

export default defineConfig({
  plugins: [
    basicSsl() // TODO: Uncomment to enable HTTPS for network access
  ],
  server: {
    host: true,
    https: true, // TODO: Uncomment to enable HTTPS
    port: 5173
  },
  build: {
    target: 'esnext'
  }
});
