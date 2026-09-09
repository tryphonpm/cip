import { SalariesCip } from '../../models/SalariesCip'

export default defineEventHandler(async () => {
  const docs = await SalariesCip.find()
    .select('MATRICULE key_imports CDS')
    .lean()

  return {
    salaries: toSalariesCipOptions(docs)
  }
})
