// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://bulk.recipes',

  // Astro 7 changed the default to 'jsx' (whitespace between adjacent inline
  // elements is dropped). Pinning `true` keeps the v6 whitespace semantics so
  // this migration is a pure dependency move; adopting 'jsx' is its own change.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel(),
  integrations: [preact(), sitemap()]
});