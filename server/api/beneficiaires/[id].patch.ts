import { Beneficiaire } from '../../models/Beneficiaire'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ projetProfessionnel?: string }>(event)
  const beneficiaire = await Beneficiaire.findById(id)
  if (!beneficiaire) throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })

  if (typeof body.projetProfessionnel === 'string') {
    beneficiaire.projetProfessionnel = body.projetProfessionnel
    await beneficiaire.save()
  }

  return { beneficiaire }
})
