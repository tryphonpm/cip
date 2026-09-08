import mongoose from 'mongoose'
import { OrientationImport } from '../../../models/OrientationImport'

function parseIsoDateInput(value: unknown): Date | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!match) {
    throw createError({ statusCode: 422, message: 'Date du premier RDV invalide.' })
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    Number.isNaN(date.getTime())
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw createError({ statusCode: 422, message: 'Date du premier RDV invalide.' })
  }
  return date
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identifiant d\'import invalide.' })
  }

  const body = await readBody<{ rowIndex?: unknown, datePremierRdv?: unknown }>(event)
  const rowIndex = Number(body.rowIndex)
  if (!Number.isInteger(rowIndex) || rowIndex < 0) {
    throw createError({ statusCode: 400, message: 'Index de ligne invalide.' })
  }

  const datePremierRdv = parseIsoDateInput(body.datePremierRdv)

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
  const dateKey = Object.keys(row).find(key => key.toLowerCase() === 'datepremierrdv') || 'datePremierRdv'
  row[dateKey] = datePremierRdv
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
