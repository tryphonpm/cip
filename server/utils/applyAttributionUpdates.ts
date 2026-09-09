import { SalariesCip } from '../models/SalariesCip'

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

export async function applyAttributionUpdates(
  rows: OrientationRow[],
  updates: AttributionRowSavePayload[],
  allowedCds: string[]
): Promise<OrientationRow[]> {
  const nextRows = rows.map(row => ({ ...row }))
  const salaries = await SalariesCip.find()
    .select('key_imports CDS')
    .lean()
  const salaryCdsByKeyImports = new Map(
    salaries.map(salary => [String(salary.key_imports ?? ''), String(salary.CDS ?? '')])
  )

  for (const update of updates) {
    const rowIndex = update.rowIndex
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= nextRows.length) {
      throw createError({ statusCode: 400, message: 'Index de ligne invalide.' })
    }

    const currentRow = nextRows[rowIndex]
    if (!currentRow) {
      throw createError({ statusCode: 400, message: 'Cette ligne n\'existe pas dans l\'import.' })
    }

    const cds = String(update.cds ?? '').trim()
    const cip = String(update.cip ?? '').trim()
    const statut = normalizeOrientationRowStatut(String(update.statut ?? ''))
    const datePremierRdv = parseIsoDateInput(update.datePremierRdv)

    if (cds && !allowedCds.includes(cds)) {
      throw createError({ statusCode: 422, message: 'Le CDS sélectionné n\'appartient pas au référentiel.' })
    }

    if (cip) {
      if (!cds) {
        throw createError({
          statusCode: 422,
          message: 'Veuillez d\'abord attribuer un CDS avant de sélectionner un CIP.'
        })
      }
      const salaryCds = salaryCdsByKeyImports.get(cip)
      if (!salaryCds) {
        throw createError({ statusCode: 422, message: 'Le CIP sélectionné est introuvable.' })
      }
      if (!cdsLabelsMatch(salaryCds, cds)) {
        throw createError({
          statusCode: 422,
          message: 'Le CIP sélectionné n\'appartient pas au CDS de cette ligne.'
        })
      }
    }

    const row: OrientationRow = { ...currentRow }
    row[findOrientationRowKey(row, 'CDS')] = cds
    row[findOrientationRowKey(row, 'CIP')] = cip
    row[findOrientationRowKey(row, 'datePremierRdv')] = datePremierRdv
    const statutKey = findOrientationRowKey(row, 'statut')
    if (isOrientationRowSuivi(orientationFieldText(currentRow, 'statut'))) {
      row[statutKey] = ORIENTATION_ROW_STATUT_SUIVI
    }
    else {
      row[statutKey] = statut
    }
    nextRows[rowIndex] = row
  }

  return nextRows
}
