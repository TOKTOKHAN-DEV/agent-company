import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * granite.config.ts 의 `web.commands` 가 이 설정으로 vite 를 띄웁니다.
 *
 * 심사가 CSR·SSG 만 허용하므로 산출물은 정적이어야 합니다. SSR 플러그인이나
 * 서버 미들웨어를 추가하지 마세요 — 번들에 서버가 들어가면 반려됩니다.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // 번들은 압축 해제 기준 100MB 이하여야 합니다. 큰 에셋은 번들에 넣지 말고
    // CDN 에서 지연 로딩하세요.
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
});
