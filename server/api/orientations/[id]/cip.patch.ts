import mongoose from 'mongoose'
import { OrientationImport } from '../../../models/OrientationImport'
import { SalariesCip } from '../../../models/SalariesCip'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const body = await readBody<{ rowIndex?: unknown, cip?: unknown }>(event)
  const rowIndex = Number(body.rowIndex)
  if (!Number.isInteger(rowIndex) || rowIndex < 0) {
    throw createError({ statusCode: 400, message: 'Index de ligne invalide.' })
  }

  const cip = String(body.cip ?? '').trim()

  const doc = await OrientationImport.findById(id)
  if (!doc) {
    throw createError({ statusCode: 404, message: 'Import d\'orientations introuvable.' })
  }

  const rows = Array.isArray(doc.data) ? doc.data as OrientationRow[] : []
  if (rowIndex >= rows.length) {
    throw createError({ statusCode: 400, message: 'Cette ligne n\'existe pas dans l\'import.' })
  }

  const currentRow = rows[rowIndex]
  if (!currentRow) {
    throw createError({ statusCode: 400, message: 'Cette ligne n\'existe pas dans l\'import.' })
  }

  const cds = orientationFieldText(currentRow, 'CDS')
  if (cip) {
    if (!cds) {
      throw createError({
        statusCode: 422,
        message: 'Veuillez d\'abord attribuer un CDS avant de sélectionner un CIP.'
      })
    }

    const salary = await SalariesCip.findOne({ 'identite.NOM_AFFICHAGE': cip }).lean()
    if (!salary) {
      throw createError({ statusCode: 422, message: 'Le CIP sélectionné est introuvable.' })
    }
    if (!cdsLabelsMatch(String(salary.CDS ?? ''), cds)) {
      throw createError({
        statusCode: 422,
        message: 'Le CIP sélectionné n\'appartient pas au CDS de cette ligne.'
      })
    }
  }

  const row: OrientationRow = { ...currentRow }
  const cipKey = Object.keys(row).find(key => key.toLowerCase() === 'cip') || 'CIP'
  row[cipKey] = cip
  rows[rowIndex] = row
  doc.data = rows
  doc.markModified('data')
  await doc.save()

  const populated = await OrientationImport.findById(doc._id)
    .populate('importedBy', 'name email')
    .lean()

  return {
    import: toOrientationImportDetail(populated || doc.toObject())
  }
})
