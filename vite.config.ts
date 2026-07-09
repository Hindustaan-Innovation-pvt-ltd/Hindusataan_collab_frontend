import { defineConfig } from 'vite'
// @ts-ignore
import path from 'path'
// @ts-ignore
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/boards': 'http://127.0.0.1:8000',
      '/board/upload': 'http://127.0.0.1:8000',
      '/board/upload-file': 'http://127.0.0.1:8000',
      '/board/search-document-stream': 'http://127.0.0.1:8000',
      '/board/status': 'http://127.0.0.1:8000',
      '/generate-flowchart': 'http://127.0.0.1:8000',
      '/generate-graph': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000'
    }
  },
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
