import mongoose from 'mongoose'
import { OrientationImport } from '../../../models/OrientationImport'
import { Settings } from '../../../models/Settings'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const body = await readBody<{ rows?: unknown }>(event)
  if (!Array.isArray(body.rows) || !body.rows.length) {
    throw createError({ statusCode: 400, message: 'Aucune ligne à enregistrer.' })
  }

  const updates: AttributionRowSavePayload[] = body.rows.map((item) => {
    const row = item as Partial<AttributionRowSavePayload>
    const rowIndex = Number(row.rowIndex)
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw createError({ statusCode: 400, message: 'Index de ligne invalide.' })
    }
    return {
      rowIndex,
      cds: String(row.cds ?? '').trim(),
      cip: String(row.cip ?? '').trim(),
      datePremierRdv: String(row.datePremierRdv ?? '').trim(),
      statut: String(row.statut ?? ORIENTATION_ROW_STATUT_DEFAULT).trim()
    }
  })

  const settings = await Settings.findOne({ key: 'app' }).lean()
  const allowedCds = Array.isArray(settings?.cds) && settings.cds.length
    ? settings.cds.map((item: string) => String(item))
    : [...DEFAULT_CDS]

  const doc = await OrientationImport.findById(id)
  if (!doc) {
    throw createError({ statusCode: 404, message: 'Import d\'orientations introuvable.' })
  }

  const rows = Array.isArray(doc.data) ? doc.data as OrientationRow[] : []
  doc.data = await applyAttributionUpdates(rows, updates, allowedCds)
  doc.markModified('data')
  await doc.save()

  const populated = await OrientationImport.findById(doc._id)
    .populate('importedBy', 'name email')
    .lean()

  return {
    import: toOrientationImportDetail(populated || doc.toObject())
  }
})
