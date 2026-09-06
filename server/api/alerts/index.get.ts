import { Alert } from '../../models/Alert'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filter: Record<string, unknown> = {}
  if (query.status) filter.status = query.status
  if (query.type) filter.type = query.type
  if (query.cip) filter[''] = query.cip

  const alerts = await Alert.find(query.status || query.type ? filter : { status: 'open' })
    .populate({
      path: 'beneficiaireId',
      select: 'nom prenom cipNom clpe cds statut fseCode dateOrientation datePremierRdv'
    })
    .sort({ createdAt: -1 })
    .lean()

  const cip = query.cip ? String(query.cip) : ''
  const filtered = cip
    ? alerts.filter((a) => {
        const b = a.beneficiaireId as { cipNom?: string } | null
        return b?.cipNom === cip
      })
    : alerts

  return { alerts: filtered, total: filtered.length }
})
