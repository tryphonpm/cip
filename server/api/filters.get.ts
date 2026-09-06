import { Beneficiaire } from '../models/Beneficiaire'
import { Structure } from '../models/Structure'

export default defineEventHandler(async () => {
  const [structures, cds] = await Promise.all([
    Structure.find().sort({ cipNom: 1 }).lean(),
    Beneficiaire.distinct('cds')
  ])
  return {
    cips: [...new Set(structures.map(s => s.cipNom).filter(Boolean))],
    clpes: [...new Set(structures.map(s => s.clpe).filter(Boolean))],
    territoires: [...new Set(structures.map(s => s.territoire).filter(Boolean))],
    cds: cds.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'fr')),
    structures
  }
})
