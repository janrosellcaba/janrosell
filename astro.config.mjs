// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import node from '@astrojs/node';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],

  output: 'server',

  adapter: node({
    mode: 'standalone',
  }),
  
  vite: {
    preview: {
      allowedHosts: true,
    },
    server: {
      allowedHosts: true,
    }
  }
});
