import { Beneficiaire } from '../../models/Beneficiaire'
import { Alert } from '../../models/Alert'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const beneficiaire = await Beneficiaire.findById(id).lean()
  if (!beneficiaire) throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  const alerts = await Alert.find({ beneficiaireId: id }).lean()
  return { beneficiaire, alerts }
})
