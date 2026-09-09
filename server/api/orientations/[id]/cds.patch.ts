import mongoose from 'mongoose'
import { OrientationImport } from '../../../models/OrientationImport'
import { SalariesCip } from '../../../models/SalariesCip'
import { Settings } from '../../../models/Settings'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const body = await readBody<{ rowIndex?: unknown, cds?: unknown }>(event)
  const rowIndex = Number(body.rowIndex)
  if (!Number.isInteger(rowIndex) || rowIndex < 0) {
    throw createError({ statusCode: 400, message: 'Index de ligne invalide.' })
  }

  const cds = String(body.cds ?? '').trim()
  const settings = await Settings.findOne({ key: 'app' }).lean()
  const allowed = Array.isArray(settings?.cds) && settings.cds.length
    ? settings.cds.map((item: string) => String(item))
    : [...DEFAULT_CDS]

  if (cds && !allowed.includes(cds)) {
    throw createError({ statusCode: 422, message: 'Le CDS sélectionné n\'appartient pas au référentiel.' })
  }

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

  const row: OrientationRow = { ...currentRow }
  const cdsKey = Object.keys(row).find(key => key.toLowerCase() === 'cds') || 'CDS'
  row[cdsKey] = cds

  const previousCds = orientationFieldText(currentRow, 'CDS')
  const currentCip = orientationFieldText(currentRow, 'CIP')
  if (currentCip) {
    const cipKey = Object.keys(row).find(key => key.toLowerCase() === 'cip') || 'CIP'
    if (!cds) {
      row[cipKey] = ''
    }
    else if (!cdsLabelsMatch(previousCds, cds)) {
      const salary = await SalariesCip.findOne({ key_imports: currentCip }).lean()
      if (!salary || !cdsLabelsMatch(String(salary.CDS ?? ''), cds)) {
        row[cipKey] = ''
      }
    }
  }

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
