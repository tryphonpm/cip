import { normalizeName } from './normalize'

const SKIP_BENEFICIAIRE_KEYS = new Set([
  '_id',
  'structureId',
  'lastImportBatchId',
  'createdAt',
  'updatedAt',
  'statut',
  'nomNormalise',
  'prenomNormalise'
])

export interface BeneficiaireFromOrientation {
  civilite: string
  nom: string
  prenom: string
  nomNormalise: string
  prenomNormalise: string
  age: number | null
  cds: string
  cipNom: string
  clpe: string
  statut: BeneficiaireStatut
  dateOrientation: Date | null
  datePremierRdv: Date | null
  orientation: Record<string, OrientationFieldValue>
}

function formatLooksLike(format: string | null | undefined, token: string): boolean {
  return String(format || '').toLowerCase().includes(token)
}

function toUtcDate(value: OrientationFieldValue): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asSerial = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86_400_000))
    return Number.isNaN(asSerial.getTime()) ? null : asSerial
  }
  const text = String(value).trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const fr = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(text)
  if (fr) {
    let year = Number(fr[3])
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
    const date = new Date(Date.UTC(year, Number(fr[2]) - 1, Number(fr[1])))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
}

function toInteger(value: OrientationFieldValue): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  const parsed = Number.parseInt(String(value).trim(), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function coerceMappedValue(
  value: OrientationFieldValue,
  format: string | null | undefined
): OrientationFieldValue {
  if (formatLooksLike(format, 'date')) return toUtcDate(value)
  if (formatLooksLike(format, 'integer')) return toInteger(value)
  if (value == null) return null
  if (value instanceof Date) return toUtcDate(value)
  if (typeof value === 'number') return value
  const text = String(value).trim()
  return text || null
}

function isFilled(value: unknown): boolean {
  return value != null && value !== ''
}

export function mapOrientationRowToBeneficiaire(
  row: OrientationRow,
  mapping: MappingImportBeneficiaireItem[],
  cdsOptions: string[],
  filename = ''
): BeneficiaireFromOrientation | null {
  const payload: Record<string, unknown> = {}
  const orientation: Record<string, OrientationFieldValue> = {}

  for (const item of mapping) {
    const beneficiaireKey = item.cleBeneficiaire
    const orientationKey = item.cleOrientation

    if (!beneficiaireKey && orientationKey) {
      const raw = orientationFieldRaw(row, orientationKey)
      orientation[orientationKey] = coerceMappedValue(raw, item.formatOrientation)
      continue
    }

    if (beneficiaireKey && !orientationKey) continue
    if (!beneficiaireKey || !orientationKey) continue
    if (SKIP_BENEFICIAIRE_KEYS.has(beneficiaireKey)) continue
    if (beneficiaireKey.includes('.')) continue

    const coerced = coerceMappedValue(
      orientationFieldRaw(row, orientationKey),
      item.formatBeneficiaire || item.formatOrientation
    )

    if (beneficiaireKey === 'nom' || beneficiaireKey === 'dateOrientation' || beneficiaireKey === 'prenom') {
      if (isFilled(payload[beneficiaireKey])) continue
      if (isFilled(coerced)) payload[beneficiaireKey] = coerced
      continue
    }

    if (beneficiaireKey === 'cds') {
      payload.cds = matchCdsOption(String(coerced ?? ''), cdsOptions)
      continue
    }

    if (beneficiaireKey === 'age') {
      payload.age = toInteger(coerced)
      continue
    }

    if (beneficiaireKey === 'datePremierRdv') {
      payload.datePremierRdv = toUtcDate(coerced)
      continue
    }

    payload[beneficiaireKey] = coerced ?? ''
  }

  const nom = String(payload.nom ?? '').trim()
  const prenom = String(payload.prenom ?? '').trim()
  if (!nom || !prenom) return null

  return {
    civilite: String(payload.civilite ?? ''),
    nom,
    prenom,
    nomNormalise: normalizeName(nom),
    prenomNormalise: normalizeName(prenom),
    age: typeof payload.age === 'number' ? payload.age : null,
    cds: String(payload.cds ?? ''),
    cipNom: String(payload.cipNom ?? ''),
    clpe: String(payload.clpe ?? ''),
    statut: 'actif',
    dateOrientation: payload.dateOrientation instanceof Date ? payload.dateOrientation : null,
    datePremierRdv: payload.datePremierRdv instanceof Date ? payload.datePremierRdv : null,
    orientation: {
      ...orientation,
      fichier_import: filename
    }
  }
}
