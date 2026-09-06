export default defineNuxtRouteMiddleware(async (to) => {
  const log = (hypothesisId: string, message: string, data: Record<string, unknown> = {}) => {
    // #region agent log
    fetch('http://127.0.0.1:7533/ingest/71991fc5-0344-424f-94ec-bddb6bd94748', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a4834' },
      body: JSON.stringify({
        sessionId: '1a4834',
        runId: 'pre-fix',
        hypothesisId,
        location: 'middleware/auth.global.ts',
        message,
        data,
        timestamp: Date.now()
      })
    }).catch(() => {})
    // #endregion
  }

  if (to.path === '/login') return
  const { user, fetchUser } = useAuth()
  const hadUserBefore = Boolean(user.value)
  log('H1', 'auth middleware enter', { to: to.path, hadUserBefore })

  if (!user.value) {
    await fetchUser()
  }

  log('H1', 'auth middleware after fetchUser', {
    to: to.path,
    hasUser: Boolean(user.value),
    hadUserBefore
  })

  if (!user.value) {
    log('H1', 'auth middleware redirect login', { to: to.path })
    return navigateTo('/login')
  }
})
