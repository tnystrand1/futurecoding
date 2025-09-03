import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // For retreat mode, use different entry point and output folder
  if (mode === 'retreat') {
    return {
      plugins: [react()],
      build: {
        outDir: 'dist-retreat',
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'retreat.html')
          }
        }
      },
      define: {
        'process.env.VITE_MODE': JSON.stringify('retreat')
      }
    }
  }

  // Default configuration for main app
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    define: {
      'process.env.VITE_MODE': JSON.stringify('main')
    }
  }
})
