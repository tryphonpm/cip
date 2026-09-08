import { SalariesCip } from '../../models/SalariesCip'

export default defineEventHandler(async () => {
  const docs = await SalariesCip.find()
    .select('MATRICULE identite.NOM_AFFICHAGE CDS')
    .lean()

  return {
    salaries: toSalariesCipOptions(docs)
  }
})
