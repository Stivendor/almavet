import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Única fuente del dominio público. Al comprar el dominio se cambia SOLO esta línea
// y se regeneran canonical, og:url y og:image del index.html.
const SITE_URL = 'https://almavet.vercel.app'

// ponytail: reemplazo de texto en vez de plugin de SEO; el sitio es una sola página.
const siteUrl = () => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', SITE_URL),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteUrl()],
})
