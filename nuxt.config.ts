export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cip',
    sessionSecret: process.env.SESSION_SECRET || 'cip-dev-secret-change-me',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@cip.local',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    public: {
      appName: 'CIP+'
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'CIP+ · Statistiques et alertes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  compatibilityDate: '2026-06-30'
})
