import mongoose from 'mongoose'
import { OrientationImport } from '../../models/OrientationImport'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const doc = await OrientationImport.findById(id)
    .populate('importedBy', 'name email')
    .lean()

  if (!doc) {
    throw createError({ statusCode: 404, message: 'Import d\'orientations introuvable.' })
  }

  return { import: toOrientationImportDetail(doc) }
})
