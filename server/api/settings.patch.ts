import { Settings } from '../models/Settings'

export default defineEventHandler(async (event) => {
  if (event.context.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Réservé à l\'administration' })
  }
  const body = await readBody<{
    delaiPremierRdvJours?: number
    projetsProfessionnels?: string[]
  }>(event)

  const settings = await Settings.findOneAndUpdate(
    { key: 'app' },
    {
      ...(typeof body.delaiPremierRdvJours === 'number'
        ? { delaiPremierRdvJours: Math.max(1, Math.min(180, body.delaiPremierRdvJours)) }
        : {}),
      ...(Array.isArray(body.projetsProfessionnels)
        ? { projetsProfessionnels: body.projetsProfessionnels.map(s => String(s).trim()).filter(Boolean) }
        : {})
    },
    { new: true }
  )

  if (typeof body.delaiPremierRdvJours === 'number') {
    await recomputeAlerts()
  }

  return { settings }
})
