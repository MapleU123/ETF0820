import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'maskable-icon-512x512.png',
          'apple-touch-icon.png',
          'screenshot-desktop.png',
          'screenshot-mobile.png',
          'manifest.json',
        ],
        manifest: {
          name: 'ETF08212 - 网格做T记录器',
          short_name: '做T记录器',
          description: '专业基金与ETF网格交易、日内做T记录器，支持做T摊薄成本、日历看板、收益分析与AI拍照识单',
          theme_color: '#0f172a',
          background_color: '#020617',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'portrait',
          start_url: './',
          scope: './',
          id: './',
          lang: 'zh-CN',
          dir: 'ltr',
          prefer_related_applications: false,
          related_applications: [],
          launch_handler: {
            client_mode: 'navigate-existing',
          },
          categories: ['finance', 'productivity', 'utilities', 'business'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          screenshots: [
            {
              src: 'screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: '网格做T持仓与做T收益看板',
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow',
              label: '日内做T摊薄成本与快捷录入',
            },
          ],
          shortcuts: [
            {
              name: '快速做T录入',
              short_name: '录入做T',
              description: '录入最新一笔网格做T交易',
              url: './?tab=entry',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
            {
              name: '持仓管理看板',
              short_name: '持仓看板',
              description: '查看持仓底仓与摊薄成本',
              url: './?tab=holdings',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
            {
              name: '日历收益看板',
              short_name: '做T日历',
              description: '查看每日做T落袋利润日历',
              url: './?tab=calendar',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                },
              ],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
