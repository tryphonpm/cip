export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/_')) return
  event.context.user = await requireUser(event)
})
