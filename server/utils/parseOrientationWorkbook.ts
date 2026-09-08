import ExcelJS from 'exceljs'
import { normalizeHeader } from './normalize'

export interface ParsedOrientationWorkbook {
  ligne1: string
  ligne2: string
  documentDate: Date | null
  sheetName: string
  columns: OrientationColumn[]
  keys: string[]
  data: OrientationRow[]
  warnings: string[]
}

interface ExcelRichText {
  richText?: { text?: string }[]
}

interface ExcelFormula {
  result?: unknown
  formula?: string
}

interface ExcelHyperlink {
  text?: string
  hyperlink?: string
}

const HEADER_MARKERS = ['nir', 'nom', 'prenom', 'civilite']
const MAX_ROWS = 8_000
const FR_DATE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[tT ].*)?$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmpty(value: unknown): boolean {
  if (value == null || value === '') return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

function cellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  if (typeof value === 'object') {
    const rich = value as ExcelRichText
    if (Array.isArray(rich.richText)) {
      return rich.richText.map(part => part.text || '').join('')
    }
    const link = value as ExcelHyperlink
    if (link.text != null || link.hyperlink != null) {
      return String(link.text || link.hyperlink || '')
    }
    const formula = value as ExcelFormula
    if (formula.result != null) return cellText(formula.result)
  }
  return String(value)
}

function frenchString(value: unknown): string {
  return cellText(value)
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 80_000) return null
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial * 86_400_000)
  const date = new Date(utc)
  return Number.isNaN(date.getTime()) ? null : date
}

function toUtcDate(year: number, monthIndex: number, day: number): Date | null {
  if (year < 1800 || year > 2200) return null
  const date = new Date(Date.UTC(year, monthIndex, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== monthIndex
    || date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

function expandYear(year: number): number {
  if (year >= 100) return year
  return year < 50 ? 2000 + year : 1900 + year
}

export function toIsoDateString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function parseDateValue(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return toUtcDate(value.getFullYear(), value.getMonth(), value.getDate())
  }
  if (typeof value === 'number') return excelSerialToDate(value)
  if (typeof value === 'object') {
    const formula = value as ExcelFormula
    if (formula.result != null) return parseDateValue(formula.result)
  }
  const text = frenchString(value)
  if (!text || text.includes('#')) return null
  const iso = text.match(ISO_DATE)
  if (iso) return toUtcDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  const fr = text.match(FR_DATE)
  if (fr) {
    return toUtcDate(expandYear(Number(fr[3])), Number(fr[2]) - 1, Number(fr[1]))
  }
  return null
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.round(value)
  }
  if (typeof value === 'object' && value && 'result' in value) {
    return parseInteger((value as ExcelFormula).result)
  }
  const text = frenchString(value).replace(/\s/g, '').replace(',', '.')
  if (!text || !/^-?\d+$/.test(text)) return null
  if (text.startsWith('0') && text.length > 1) return null
  const n = Number(text)
  return Number.isSafeInteger(n) ? n : null
}

function parseMail(value: unknown): string | null {
  let text = frenchString(value)
  if (!text) return null
  const hyper = typeof value === 'object' && value
    ? String((value as ExcelHyperlink).hyperlink || '')
    : ''
  if (hyper.startsWith('mailto:')) {
    text = hyper.slice('mailto:'.length)
  }
  const mail = text.normalize('NFC').trim().toLowerCase()
  return EMAIL.test(mail) ? mail : null
}

function isIdentifierColumn(header: string): boolean {
  const h = normalizeHeader(header)
  return (
    h === 'nir'
    || h === 'cp'
    || h.includes('code postal')
    || h.includes('tel')
    || h.includes('telephone')
    || h.includes('mobile')
    || h.includes('fixe')
  )
}

function inferColumnType(header: string): OrientationValueType {
  const h = normalizeHeader(header)
  if (h.includes('mail') || h.includes('email')) return 'mail'
  if (h.includes('date')) return 'date'
  if (h === 'age' || h === 'n ligne' || (h.includes('ligne') && (h.startsWith('n') || h.includes('numero')))) {
    return 'integer'
  }
  return 'string'
}

function identifierString(header: string, value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const digits = String(Math.trunc(value))
    const h = normalizeHeader(header)
    if (h === 'cp' || h.includes('code postal')) return digits.padStart(5, '0')
    if (h.includes('tel') || h.includes('telephone') || h.includes('mobile') || h.includes('fixe')) {
      return digits.length === 9 ? `0${digits}` : digits
    }
    return digits
  }
  return frenchString(value)
}

function looksLikeHeader(values: string[]): boolean {
  const normalized = values.map(v => normalizeHeader(v)).filter(Boolean)
  const hits = HEADER_MARKERS.filter(marker => normalized.some(v => v === marker || v.includes(marker)))
  return hits.length >= 3
}

function uniqueKeys(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((raw, index) => {
    const base = frenchString(raw) || `colonne_${index + 1}`
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}_${count + 1}`
  })
}

function extractDocumentDate(texts: string[], filename: string): Date | null {
  const joined = texts.join('\n')
  const labeled = joined.match(/(?:actualis[ée]e?\s+le|saisies?\s+le)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)
  if (labeled) return parseDateValue(labeled[1])
  for (const text of texts) {
    const match = text.match(FR_DATE) || text.match(ISO_DATE)
    if (match) {
      const parsed = parseDateValue(match[0])
      if (parsed) return parsed
    }
  }
  const fromName = filename.match(/(\d{4}-\d{2}-\d{2})/)
  if (fromName) return parseDateValue(fromName[1])
  return null
}

function pickOrientationSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  const named = workbook.worksheets.find((sheet) => {
    const n = normalizeHeader(sheet.name)
    return n.includes('orientation') && !n.includes('arret')
  })
  if (named) return named
  for (const sheet of workbook.worksheets) {
    const n = normalizeHeader(sheet.name)
    if (n.includes('arret')) continue
    const header = findHeaderRow(sheet)
    if (header) return sheet
  }
  return workbook.worksheets[0] || null
}

function rowStrings(row: ExcelJS.Row, maxCol: number): string[] {
  const values: string[] = []
  for (let c = 1; c <= maxCol; c++) {
    values.push(frenchString(row.getCell(c).value))
  }
  return values
}

function findHeaderRow(sheet: ExcelJS.Worksheet): { rowNumber: number, maxCol: number } | null {
  const maxCol = Math.max(sheet.actualColumnCount || 0, sheet.columnCount || 0, 20)
  const last = Math.min(sheet.actualRowCount || sheet.rowCount || 10, 12)
  for (let r = 1; r <= last; r++) {
    const values = rowStrings(sheet.getRow(r), maxCol)
    if (looksLikeHeader(values)) return { rowNumber: r, maxCol }
  }
  return null
}

function formatCell(
  header: string,
  columnType: OrientationValueType,
  raw: unknown,
  warnings: string[],
  rowNumber: number
): OrientationFieldValue {
  if (isEmpty(raw) || (typeof raw === 'string' && frenchString(raw) === '')) return null

  if (isIdentifierColumn(header)) {
    const text = identifierString(header, raw)
    return text || null
  }

  if (columnType === 'mail') {
    const mail = parseMail(raw)
    if (mail) return mail
    warnings.push(`Ligne ${rowNumber} : adresse mail d'un format inattendu.`)
    const fallback = frenchString(raw)
    return fallback || null
  }

  if (columnType === 'date') {
    const date = parseDateValue(raw)
    if (date) return date
    warnings.push(`Ligne ${rowNumber} : date illisible dans la colonne « ${header} ».`)
    return frenchString(raw) || null
  }

  if (columnType === 'integer') {
    const n = parseInteger(raw)
    if (n != null) return n
    warnings.push(`Ligne ${rowNumber} : nombre entier illisible dans la colonne « ${header} ».`)
    return frenchString(raw) || null
  }

  const mail = parseMail(raw)
  if (mail) return mail
  const date = raw instanceof Date || (typeof raw === 'number' && raw > 20_000)
    ? parseDateValue(raw)
    : parseDateValue(frenchString(raw).match(FR_DATE)?.[0] || '')
  if (date) return date
  const asInt = parseInteger(raw)
  if (typeof raw === 'number' && asInt != null) return asInt
  return frenchString(raw) || null
}

export async function parseOrientationWorkbook(
  buffer: Uint8Array,
  filename = ''
): Promise<ParsedOrientationWorkbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

  const sheet = pickOrientationSheet(workbook)
  if (!sheet) {
    throw createError({ statusCode: 422, message: 'Aucune feuille Excel n\'a été trouvée dans ce fichier.' })
  }

  const maxColGuess = Math.max(sheet.actualColumnCount || 0, sheet.columnCount || 0, 20)
  const ligne1 = frenchString(sheet.getRow(1).getCell(1).value)
  const ligne2 = frenchString(sheet.getRow(2).getCell(1).value)

  const header = findHeaderRow(sheet)
  if (!header) {
    throw createError({
      statusCode: 422,
      message: 'Impossible de repérer la ligne d\'en-têtes (NIR, nom, prénom). Vérifiez qu\'il s\'agit bien de la liste des orientations BRSA.'
    })
  }

  const headerValues = rowStrings(sheet.getRow(header.rowNumber), header.maxCol || maxColGuess)
  let lastHeader = -1
  for (let i = headerValues.length - 1; i >= 0; i--) {
    if (headerValues[i] !== '') {
      lastHeader = i
      break
    }
  }
  const width = lastHeader >= 0 ? lastHeader + 1 : headerValues.length
  const rawHeaders = headerValues.slice(0, width)
  const keys = uniqueKeys(rawHeaders)
  const columns: OrientationColumn[] = keys.map(nom => ({ nom, type: inferColumnType(nom) }))

  const dateTexts = [ligne1, ligne2]
  if (header.rowNumber > 3) {
    dateTexts.push(frenchString(sheet.getRow(3).getCell(1).value))
  }
  const documentDate = extractDocumentDate(dateTexts, filename)

  const data: OrientationRow[] = []
  const warnings: string[] = []
  const lastRow = Math.min(sheet.actualRowCount || sheet.rowCount || header.rowNumber, MAX_ROWS + header.rowNumber)

  for (let r = header.rowNumber + 1; r <= lastRow; r++) {
    const excelRow = sheet.getRow(r)
    const rawCells: unknown[] = []
    for (let c = 1; c <= width; c++) {
      rawCells.push(excelRow.getCell(c).value)
    }
    const hasValue = rawCells.some(cell => !isEmpty(cell) && frenchString(cell) !== '')
    if (!hasValue) continue

    const item: OrientationRow = {}
    columns.forEach((column, index) => {
      item[column.nom] = formatCell(column.nom, column.type, rawCells[index], warnings, r)
    })
    data.push(item)
  }

  if (normalizeHeader(sheet.name).includes('arret') && data.length) {
    warnings.push('La feuille importée ressemble à une liste d\'arrêts plutôt qu\'aux nouvelles orientations.')
  }

  return {
    ligne1,
    ligne2,
    documentDate,
    sheetName: sheet.name,
    columns,
    keys,
    data,
    warnings: [...new Set(warnings)].slice(0, 80)
  }
}
