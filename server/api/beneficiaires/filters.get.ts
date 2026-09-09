import { Beneficiaire } from '../../models/Beneficiaire'

function sortDistinct(values: string[]): string[] {
  return values.filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
}

export default defineEventHandler(async () => {
  const [cips, clpes, cds] = await Promise.all([
    Beneficiaire.distinct('cipNom'),
    Beneficiaire.distinct('clpe'),
    Beneficiaire.distinct('cds')
  ])

  return {
    cips: sortDistinct(cips.map(String)),
    clpes: sortDistinct(clpes.map(String)),
    cds: sortDistinct(cds.map(String))
  } satisfies BeneficiairesFilterOptions
})
