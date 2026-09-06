import { Beneficiaire } from '../models/Beneficiaire'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rows = await Beneficiaire.find().lean()
  const filtered = applyFilters(rows, {
    cip: query.cip ? String(query.cip) : undefined,
    clpe: query.clpe ? String(query.clpe) : undefined,
    territoire: query.territoire ? String(query.territoire) : undefined,
    cds: query.cds ? String(query.cds) : undefined,
    statut: query.statut ? String(query.statut) : undefined
  })
  return computeStats(filtered)
})
