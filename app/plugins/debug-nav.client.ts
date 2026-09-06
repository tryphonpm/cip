import { nextTick } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const log = (hypothesisId: string, message: string, data: Record<string, unknown> = {}) => {
    // #region agent log
    fetch('http://127.0.0.1:7533/ingest/71991fc5-0344-424f-94ec-bddb6bd94748', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a4834' },
      body: JSON.stringify({
        sessionId: '1a4834',
        runId: 'pre-fix',
        hypothesisId,
        location: 'plugins/debug-nav.client.ts',
        message,
        data,
        timestamp: Date.now()
      })
    }).catch(() => {})
    // #endregion
  }

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    log('H5', 'vue:error', {
      info,
      error: error instanceof Error ? error.message : String(error)
    })
  })

  nuxtApp.hook('app:mounted', () => {
    const route = useRoute()
    log('H3', 'app:mounted', {
      path: route.path,
      layout: route.meta.layout ?? 'default'
    })
  })

  const router = useRouter()
  router.beforeEach((to, from) => {
    log('H3', 'router:beforeEach', {
      from: from.fullPath,
      to: to.fullPath,
      toLayout: to.meta.layout ?? 'default'
    })
  })

  router.afterEach((to, from) => {
    log('H3', 'router:afterEach', {
      from: from.fullPath,
      to: to.fullPath,
      toLayout: to.meta.layout ?? 'default'
    })
    nextTick(() => {
      const h1 = document.querySelector('main h1')?.textContent?.trim() || ''
      log('H6', 'main h1 after navigation', {
        path: to.path,
        h1,
        stuckOnStatistiques: to.path !== '/statistiques' && h1 === 'Statistiques'
      })
    })
  })

  router.onError((error) => {
    log('H5', 'router:onError', {
      error: error instanceof Error ? error.message : String(error)
    })
  })
})
