import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  publicDir: 'public',
  root: '.',
  define: {
    // CRA의 환경변수 패턴을 Vite에서 사용할 수 있도록 설정
    'process.env': process.env
  },
  // HTML 처리 개선
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  // React 컴포넌트 처리 개선
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
