import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Esta es la línea crucial para GitHub Pages.
      // Le dice a tu aplicación que vivirá en una subcarpeta.
      base: '/inspeccion-de-botiquines/',
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Esta es la forma correcta de apuntar a la raíz del proyecto.
          '@': path.resolve('.'),
        }
      }
    };
});