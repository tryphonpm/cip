import { Alert } from '../../models/Alert'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status?: AlertStatus }>(event)
  const alert = await Alert.findById(id)
  if (!alert) throw createError({ statusCode: 404, message: 'Alerte introuvable' })

  if (body.status === 'resolved' || body.status === 'open') {
    alert.status = body.status
    alert.resolvedAt = body.status === 'resolved' ? new Date() : null
    alert.resolvedBy = body.status === 'resolved' ? event.context.user?._id : null
    await alert.save()
  }

  return { alert }
})
