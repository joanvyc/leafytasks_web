// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@clerk/nuxt'
  ],

  runtimeConfig: {
    internalApiBase:
      process.env.INTERNAL_API_BASE ??
      process.env.PUBLIC_API_BASE   ??
      "https://api.leafytasks.com",

    public: {
      apiBase:
        process.env.PUBLIC_API_BASE ??
        "https://api.leafytasks.com",
    },
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  ui: {
    primary: 'indigo',
    gray: 'slate',
    borderRadius: 'lg',
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
