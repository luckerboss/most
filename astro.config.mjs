import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://audit-most.ru',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    host: true, // слушать все интерфейсы, как это делает next
  }
});

