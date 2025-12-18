import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
        'VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY || ''),
        'VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
