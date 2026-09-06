import { Beneficiaire } from '../../models/Beneficiaire'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filter: Record<string, unknown> = {}
  if (query.cip) filter.cipNom = query.cip
  if (query.clpe) filter.clpe = query.clpe
  if (query.cds) filter.cds = query.cds
  if (query.statut) filter.statut = query.statut
  if (query.projet) filter.projetProfessionnel = query.projet
  if (query.q) {
    const q = String(query.q).trim()
    filter.$or = [
      { nom: new RegExp(q, 'i') },
      { prenom: new RegExp(q, 'i') },
      { fseCode: new RegExp(q, 'i') }
    ]
  }

  const beneficiaires = await Beneficiaire.find(filter)
    .sort({ nom: 1, prenom: 1 })
    .lean()

  return { beneficiaires, total: beneficiaires.length }
})
