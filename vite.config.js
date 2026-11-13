import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Allow the VS Code forwarded address (e.g. xxxx.devtunnels.ms) to open the app.
    allowedHosts: true,
    // Send API and file requests to Laravel, so only one port (5173) is needed.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/storage': 'http://127.0.0.1:8000',
    },
  },
});