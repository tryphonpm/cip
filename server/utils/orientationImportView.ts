import { toIsoDateString } from './parseOrientationWorkbook'

interface ImportedByRef {
  name?: string
  email?: string
}

function serializeUser(value: unknown): OrientationImportedBy | null {
  if (!value || typeof value !== 'object') return null
  const user = value as ImportedByRef
  if (!user.name && !user.email) return null
  return {
    name: user.name || '',
    email: user.email || ''
  }
}

function isoDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return toIsoDateString(value)
  }
  if (typeof value === 'string' && value) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return toIsoDateString(d)
  }
  return null
}

export interface OrientationImportSource {
  _id: unknown
  filename?: string
  importedBy?: unknown
  ligne1?: string
  ligne2?: string
  documentDate?: Date | string | null
  sheetName?: string
  columns?: OrientationColumn[]
  keys?: string[]
  rowCount?: number
  warnings?: string[]
  data?: OrientationRow[]
  createdAt?: Date | string
}

export function toOrientationImportSummary(doc: OrientationImportSource): OrientationImportSummary {
  const createdAt = doc.createdAt instanceof Date || typeof doc.createdAt === 'string'
    ? new Date(doc.createdAt)
    : null
  const importedAt = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toISOString()
    : ''

  return {
    id: String(doc._id),
    filename: doc.filename || '',
    importedAt,
    documentDate: isoDate(doc.documentDate),
    ligne1: doc.ligne1 || '',
    ligne2: doc.ligne2 || '',
    rowCount: doc.rowCount || 0,
    sheetName: doc.sheetName || '',
    importedBy: serializeUser(doc.importedBy)
  }
}

function serializeFieldValue(
  value: OrientationFieldValue,
  columnType: OrientationValueType
): OrientationFieldValue {
  if (value == null) return null
  if (columnType === 'date') {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : toIsoDateString(value)
    }
    if (typeof value === 'string') return value
  }
  return value
}

function serializeOrientationRows(
  rows: OrientationRow[],
  columns: OrientationColumn[]
): OrientationRow[] {
  if (!columns.length) return rows
  const typeByKey = new Map(columns.map(column => [column.nom, column.type]))
  return rows.map((row) => {
    const serialized: OrientationRow = {}
    for (const [key, value] of Object.entries(row)) {
      const columnType = typeByKey.get(key) || 'string'
      serialized[key] = serializeFieldValue(value ?? null, columnType)
    }
    return serialized
  })
}

export function toOrientationImportDetail(doc: OrientationImportSource): OrientationImportDetail {
  const columns = doc.columns || []
  return {
    ...toOrientationImportSummary(doc),
    columns,
    keys: doc.keys || [],
    warnings: doc.warnings || [],
    data: serializeOrientationRows(doc.data || [], columns)
  }
}
