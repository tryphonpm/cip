import mongoose from 'mongoose'
import { Beneficiaire } from '../../../models/Beneficiaire'
import { OrientationImport } from '../../../models/OrientationImport'
import { Settings } from '../../../models/Settings'

function parseAttributionRows(raw: unknown): AttributionRowSavePayload[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
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
}

function setRowStatut(row: OrientationRow, statut: string): OrientationRow {
  const next = { ...row }
  next[findOrientationRowKey(next, 'statut')] = statut
  return next
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const body = await readBody<{ rows?: unknown }>(event)
  const settings = await Settings.findOne({ key: 'app' }).lean()
  const mapping = mappingImportBeneficiaireItems(settings?.mapping_import_beneficiaire)
  if (!mapping.length) {
    throw createError({
      statusCode: 422,
      message: 'Le mapping d\'import des bénéficiaires est introuvable dans les paramètres.'
    })
  }

  const allowedCds = Array.isArray(settings?.cds) && settings.cds.length
    ? settings.cds.map((item: string) => String(item))
    : [...DEFAULT_CDS]

  const doc = await OrientationImport.findById(id)
  if (!doc) {
    throw createError({ statusCode: 404, message: 'Import d\'orientations introuvable.' })
  }

  let rows = Array.isArray(doc.data) ? doc.data as OrientationRow[] : []
  const updates = parseAttributionRows(body.rows)
  if (updates.length) {
    rows = await applyAttributionUpdates(rows, updates, allowedCds)
  }

  const okRowIndices = rows
    .map((row, rowIndex) => (isOrientationRowOk(orientationFieldText(row, 'statut')) ? rowIndex : -1))
    .filter(rowIndex => rowIndex >= 0)

  if (!okRowIndices.length) {
    throw createError({
      statusCode: 422,
      message: 'Aucune personne au statut « OK » à transférer vers le suivi.'
    })
  }

  let created = 0
  let skipped = 0
  let invalid = 0
  const promotedIndices: number[] = []

  for (const rowIndex of okRowIndices) {
    const row = rows[rowIndex]
    if (!row) continue

    const mapped = mapOrientationRowToBeneficiaire(row, mapping, allowedCds, String(doc.filename ?? ''))
    if (!mapped) {
      invalid += 1
      continue
    }

    const existing = await Beneficiaire.findOne({
      nomNormalise: mapped.nomNormalise,
      prenomNormalise: mapped.prenomNormalise
    }).select('_id').lean()

    if (existing) {
      skipped += 1
      continue
    }

    await Beneficiaire.create(mapped)
    created += 1
    promotedIndices.push(rowIndex)
  }

  if (promotedIndices.length) {
    for (const rowIndex of promotedIndices) {
      const row = rows[rowIndex]
      if (row) rows[rowIndex] = setRowStatut(row, ORIENTATION_ROW_STATUT_SUIVI)
    }
    doc.data = rows
    doc.markModified('data')
    await doc.save()
  }

  const populated = await OrientationImport.findById(doc._id)
    .populate('importedBy', 'name email')
    .lean()

  return {
    import: toOrientationImportDetail(populated || doc.toObject()),
    suivi: {
      created,
      skipped,
      invalid,
      promoted: promotedIndices.length,
      totalOk: okRowIndices.length
    }
  }
})
