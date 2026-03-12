import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: true, // Needed for Docker port mapping
    strictPort: false,
    port: 5173,
    allowedHosts: ['autoprospection.omega-connect.tech'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/n8n': {
        target: 'https://wfw.omega-connect.tech',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/n8n/, ''),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

