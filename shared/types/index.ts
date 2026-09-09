export type UserRole = 'admin' | 'coordinatrice' | 'cip'
export type BeneficiaireStatut = 'actif' | 'sortie'
export type BilanType = 'renouvellement' | 'reo_ft' | 'tripartite'
export type AlertType =
  | 'delai_premier_rdv'
  | 'absence_ce'
  | 'absence_dates_bilan'
  | 'absence_fse'
  | 'absence_bilan'
export type AlertStatus = 'open' | 'resolved'

export interface DispositifSaisi {
  nom: string
  valeur: string
}

export interface AbsencesMensuelles {
  avantCe1?: number
  avantCe2?: number
  mois: number[]
}

export interface SuspensionInfo {
  demande: boolean
  dateDemande?: string | null
  dateCourrierCds?: string | null
  manifeste?: boolean | null
}

export const ALERT_LABELS: Record<AlertType, string> = {
  delai_premier_rdv: 'Délai du 1er RDV dépassé',
  absence_ce: 'Absence de CE renseigné',
  absence_dates_bilan: 'Absence de dates de bilan de parcours',
  absence_fse: 'Absence FSE saisi',
  absence_bilan: 'Absence de bilan de parcours'
}

export const BILAN_LABELS: Record<BilanType, string> = {
  renouvellement: 'Renouvellement',
  reo_ft: 'Réorientation FT',
  tripartite: 'Tripartite'
}

export const DEFAULT_DISPOSITIFS = [
  'FLE',
  'Declic Emploi HBA',
  'MIFE 01',
  'Aide financière',
  'Conseillers numériques',
  'GO ON',
  'Mobilité',
  'Ariane',
  'Agent de santé',
  'ADAPT',
  'ORSAC',
  'Répit parental',
  'Clauses sociales',
  'Autres'
] as const

export type OrientationValueType = 'string' | 'date' | 'integer' | 'mail'

export type OrientationFieldValue = string | number | Date | null

export interface OrientationRow {
  [colonne: string]: OrientationFieldValue
}

export const ORIENTATION_ROW_STATUT_DEFAULT = 'En attente'
export const ORIENTATION_ROW_STATUT_OK = 'OK'
export const ORIENTATION_ROW_STATUT_SUIVI = 'SUIVI'

export const ORIENTATION_ROW_STATUT_OPTIONS = [
  ORIENTATION_ROW_STATUT_DEFAULT,
  ORIENTATION_ROW_STATUT_OK
] as const

export type OrientationRowStatutEditable = typeof ORIENTATION_ROW_STATUT_OPTIONS[number]
export type OrientationRowStatut = OrientationRowStatutEditable | typeof ORIENTATION_ROW_STATUT_SUIVI

export function normalizeOrientationRowStatut(value: string): OrientationRowStatut {
  if (value === ORIENTATION_ROW_STATUT_SUIVI) return ORIENTATION_ROW_STATUT_SUIVI
  if (value === 'En cours') return ORIENTATION_ROW_STATUT_OK
  return ORIENTATION_ROW_STATUT_OPTIONS.includes(value as OrientationRowStatutEditable)
    ? value as OrientationRowStatutEditable
    : ORIENTATION_ROW_STATUT_DEFAULT
}

export function buildStatutSelectItems(): { label: string, value: OrientationRowStatutEditable }[] {
  return ORIENTATION_ROW_STATUT_OPTIONS.map(value => ({ label: value, value }))
}

export function isOrientationRowOk(statut: string): boolean {
  return normalizeOrientationRowStatut(statut) === ORIENTATION_ROW_STATUT_OK
}

export function isOrientationRowSuivi(statut: string): boolean {
  return normalizeOrientationRowStatut(statut) === ORIENTATION_ROW_STATUT_SUIVI
}

export function findOrientationRowKey(row: OrientationRow, field: string): string {
  const target = normalizeFieldLabel(field)
  return Object.keys(row).find(key => normalizeFieldLabel(key) === target) || field
}

export interface AttributionRowSavePayload {
  rowIndex: number
  cds: string
  cip: string
  datePremierRdv: string
  statut: string
}

export interface MappingImportBeneficiaireItem {
  cleBeneficiaire: string | null
  cleOrientation: string | null
  formatBeneficiaire?: string | null
  formatOrientation?: string | null
  Descriptif?: string
}

export interface MappingImportBeneficiaire {
  meta?: Record<string, unknown>
  mapping: MappingImportBeneficiaireItem[]
}

export function mappingImportBeneficiaireItems(raw: unknown): MappingImportBeneficiaireItem[] {
  if (!raw || typeof raw !== 'object') return []
  const mapping = (raw as { mapping?: unknown }).mapping
  if (!Array.isArray(mapping)) return []
  return mapping.filter((item): item is MappingImportBeneficiaireItem => {
    if (!item || typeof item !== 'object') return false
    const entry = item as MappingImportBeneficiaireItem
    const beneficiaireOk = entry.cleBeneficiaire == null || typeof entry.cleBeneficiaire === 'string'
    const orientationOk = entry.cleOrientation == null || typeof entry.cleOrientation === 'string'
    return beneficiaireOk && orientationOk
  })
}

export const APP_SETTINGS_KEY = 'app'

export const APP_SETTINGS_STRING_LIST_KEYS = [
  'projetsProfessionnels',
  'motifsSortie',
  'typesSortiePositive',
  'motifsReo',
  'dispositifs',
  'cds'
] as const

export type AppSettingsStringListKey = typeof APP_SETTINGS_STRING_LIST_KEYS[number]

export interface AppSettings {
  delaiPremierRdvJours: number
  projetsProfessionnels: string[]
  motifsSortie: string[]
  typesSortiePositive: string[]
  motifsReo: string[]
  dispositifs: string[]
  cds: string[]
  mapping_import_beneficiaire: MappingImportBeneficiaire
}

export type AppSettingsPatch = Partial<AppSettings>

export interface SettingsApiResponse {
  settings: AppSettings
}

export function emptyAppSettings(): AppSettings {
  return {
    delaiPremierRdvJours: 15,
    projetsProfessionnels: [],
    motifsSortie: [],
    typesSortiePositive: [],
    motifsReo: [],
    dispositifs: [],
    cds: [],
    mapping_import_beneficiaire: { mapping: [] }
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

export function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of value) {
    const text = String(item ?? '').trim()
    if (!text || seen.has(text)) continue
    seen.add(text)
    result.push(text)
  }
  return result
}

export function sanitizeMappingImportBeneficiaire(raw: unknown): MappingImportBeneficiaire {
  if (!raw || typeof raw !== 'object') return { mapping: [] }
  const record = raw as { meta?: unknown }
  const mapping = mappingImportBeneficiaireItems(raw).map(item => ({
    cleBeneficiaire: emptyToNull(item.cleBeneficiaire),
    cleOrientation: emptyToNull(item.cleOrientation),
    formatBeneficiaire: emptyToNull(item.formatBeneficiaire),
    formatOrientation: emptyToNull(item.formatOrientation),
    ...(typeof item.Descriptif === 'string' && item.Descriptif.trim()
      ? { Descriptif: item.Descriptif.trim() }
      : {})
  }))
  const result: MappingImportBeneficiaire = { mapping }
  if (record.meta && typeof record.meta === 'object') {
    result.meta = record.meta as Record<string, unknown>
  }
  return result
}

export function clampDelaiPremierRdvJours(value: unknown): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(1, Math.min(180, Math.round(parsed)))
}

export function toAppSettings(raw: unknown): AppSettings {
  const doc = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const source = doc.data && typeof doc.data === 'object'
    ? doc.data as Record<string, unknown>
    : doc
  const delai = clampDelaiPremierRdvJours(source.delaiPremierRdvJours)
  return {
    delaiPremierRdvJours: delai ?? 15,
    projetsProfessionnels: sanitizeStringList(source.projetsProfessionnels),
    motifsSortie: sanitizeStringList(source.motifsSortie),
    typesSortiePositive: sanitizeStringList(source.typesSortiePositive),
    motifsReo: sanitizeStringList(source.motifsReo),
    dispositifs: sanitizeStringList(source.dispositifs),
    cds: sanitizeStringList(source.cds),
    mapping_import_beneficiaire: sanitizeMappingImportBeneficiaire(source.mapping_import_beneficiaire)
  }
}

export function cloneAppSettings(source: AppSettings): AppSettings {
  return {
    delaiPremierRdvJours: source.delaiPremierRdvJours,
    projetsProfessionnels: [...source.projetsProfessionnels],
    motifsSortie: [...source.motifsSortie],
    typesSortiePositive: [...source.typesSortiePositive],
    motifsReo: [...source.motifsReo],
    dispositifs: [...source.dispositifs],
    cds: [...source.cds],
    mapping_import_beneficiaire: {
      ...(source.mapping_import_beneficiaire.meta
        ? { meta: { ...source.mapping_import_beneficiaire.meta } }
        : {}),
      mapping: source.mapping_import_beneficiaire.mapping.map(item => ({ ...item }))
    }
  }
}

export function pickAppSettingsPatch(body: unknown): AppSettingsPatch {
  if (!body || typeof body !== 'object') return {}
  const record = body as Record<string, unknown>
  const patch: AppSettingsPatch = {}
  if ('delaiPremierRdvJours' in record) {
    const delai = clampDelaiPremierRdvJours(record.delaiPremierRdvJours)
    if (delai !== undefined) patch.delaiPremierRdvJours = delai
  }
  for (const key of APP_SETTINGS_STRING_LIST_KEYS) {
    if (key in record) patch[key] = sanitizeStringList(record[key])
  }
  if ('mapping_import_beneficiaire' in record) {
    patch.mapping_import_beneficiaire = sanitizeMappingImportBeneficiaire(record.mapping_import_beneficiaire)
  }
  return patch
}

export function mappingImportMetaText(meta: Record<string, unknown> | undefined, field: string): string {
  if (!meta) return ''
  const value = meta[field]
  return typeof value === 'string' ? value : ''
}

export function withOrientationRowStatut(rows: OrientationRow[]): OrientationRow[] {
  return rows.map(row => ({
    ...row,
    statut: orientationFieldText(row, 'statut') || ORIENTATION_ROW_STATUT_DEFAULT
  }))
}

export function appendOrientationStatutColumn(
  columns: OrientationColumn[],
  keys: string[]
): { columns: OrientationColumn[], keys: string[] } {
  if (keys.includes('statut')) {
    return { columns, keys }
  }
  return {
    columns: [...columns, { nom: 'statut', type: 'string' }],
    keys: [...keys, 'statut']
  }
}

export interface OrientationColumn {
  nom: string
  type: OrientationValueType
}

export interface OrientationImportedBy {
  name: string
  email: string
}

export interface OrientationImportSummary {
  id: string
  filename: string
  importedAt: string
  documentDate: string | null
  ligne1: string
  ligne2: string
  rowCount: number
  sheetName: string
  importedBy: OrientationImportedBy | null
}

export interface OrientationImportDetail extends OrientationImportSummary {
  columns: OrientationColumn[]
  keys: string[]
  warnings: string[]
  data: OrientationRow[]
}

export interface AttributionCdsRow {
  index: number
  nom: string
  prenom: string
  adresse: string
  cp: string
  ville: string
  cds: string
  cip: string
  datePremierRdv: string
  statut: OrientationRowStatut
}

export type AttributionCdsTableFilter = 'all' | 'cds' | 'cip'

export function countAttributionCdsUnassigned(rows: AttributionCdsRow[]): number {
  return rows.filter(row => !row.cds).length
}

export function countAttributionCipUnassigned(rows: AttributionCdsRow[]): number {
  return rows.filter(row => !row.cip).length
}

export function filterAttributionCdsRows(
  rows: AttributionCdsRow[],
  filter: AttributionCdsTableFilter
): AttributionCdsRow[] {
  if (filter === 'cds') return rows.filter(row => !row.cds)
  if (filter === 'cip') return rows.filter(row => !row.cip)
  return rows
}

export function attributionCdsFilterLabel(count: number, field: 'CDS' | 'CIP'): string {
  const noun = count === 1 ? 'personne' : 'personnes'
  return `${count} ${noun} · ${field} à attribuer`
}

export const DEFAULT_CDS = [
  'Oyonnax',
  'Nantua',
  'Belley',
  'Valserhone',
  'Pays de Gex',
  'Croix Blanche',
  'Pierre Goujon',
  'Montrevel',
  'Pont de Vaux',
  'St Didier sur Chalaronne',
  'Trevoux',
  'Chatillon sur Chalaronne',
  'Amberieu',
  'Lagnieu',
  'Miribel'
] as const

export const CDS_UNASSIGNED = '__unassigned__'

export function cdsSelectValue(cds: string): string {
  return cds || CDS_UNASSIGNED
}

export function cdsFromSelectValue(value: unknown): string {
  const raw = String(value ?? '')
  return raw === CDS_UNASSIGNED ? '' : raw
}

export const CIP_UNASSIGNED = '__cip_unassigned__'

export function cipSelectValue(cip: string): string {
  return cip || CIP_UNASSIGNED
}

export function cipFromSelectValue(value: unknown): string {
  const raw = String(value ?? '')
  return raw === CIP_UNASSIGNED ? '' : raw
}

export function cdsLabelsMatch(a: string, b: string): boolean {
  return normalizeCdsLabel(a) === normalizeCdsLabel(b)
}

export function buildCipSelectItems(
  salaries: SalariesCipOption[],
  cds: string,
  currentCip = ''
): { label: string, value: string }[] {
  const filtered = salaries.filter(salary =>
    cds && cdsLabelsMatch(salary.cds, cds)
  )
  if (currentCip && !filtered.some(salary => salary.keyImports === currentCip)) {
    filtered.unshift({
      id: '',
      matricule: 0,
      keyImports: currentCip,
      cds
    })
  }
  return [
    { label: 'À attribuer', value: CIP_UNASSIGNED },
    ...filtered.map(salary => ({
      label: salary.keyImports,
      value: salary.keyImports
    }))
  ]
}

export function buildCdsSelectItems(cdsOptions: string[], currentCds = ''): { label: string, value: string }[] {
  const options = cdsOptions.length ? [...cdsOptions] : [...DEFAULT_CDS]
  const normalized = matchCdsOption(currentCds, options)
  if (normalized && !options.includes(normalized)) {
    options.unshift(normalized)
  }
  return [
    { label: 'À attribuer', value: CDS_UNASSIGNED },
    ...options.map(value => ({ label: value, value }))
  ]
}

function normalizeFieldLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\bst\.?\b/g, 'saint')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCdsLabel(value: string): string {
  return normalizeFieldLabel(value)
}

export function orientationFieldText(row: OrientationRow, header: string): string {
  const target = normalizeFieldLabel(header)
  for (const [key, value] of Object.entries(row)) {
    if (normalizeFieldLabel(key) !== target) continue
    if (value == null || value === '') return ''
    return String(value)
  }
  return ''
}

export function orientationFieldRaw(row: OrientationRow, header: string): OrientationFieldValue {
  const target = normalizeFieldLabel(header)
  for (const [key, value] of Object.entries(row)) {
    if (normalizeFieldLabel(key) !== target) continue
    return value ?? null
  }
  return null
}

export function formatIsoDateUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function orientationFieldIsoDate(row: OrientationRow, header: string): string {
  const target = normalizeFieldLabel(header)
  for (const [key, value] of Object.entries(row)) {
    if (normalizeFieldLabel(key) !== target) continue
    if (value == null || value === '') return ''
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : formatIsoDateUtc(value)
    }
    if (typeof value === 'string') {
      const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
      if (isoMatch) return isoMatch[1]
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? '' : formatIsoDateUtc(parsed)
    }
  }
  return ''
}

export function matchCdsOption(value: string, options: string[]): string {
  const raw = value.trim()
  if (!raw) return ''
  if (options.includes(raw)) return raw
  const target = normalizeCdsLabel(raw)
  return options.find(option => normalizeCdsLabel(option) === target) || raw
}

export function toAttributionCdsRows(rows: OrientationRow[], cdsOptions: string[]): AttributionCdsRow[] {
  return rows.map((row, index) => ({
    index,
    nom: orientationFieldText(row, 'Nom'),
    prenom: orientationFieldText(row, 'Prénom'),
    adresse: orientationFieldText(row, 'Adresse'),
    cp: orientationFieldText(row, 'CP'),
    ville: orientationFieldText(row, 'Ville'),
    cds: matchCdsOption(orientationFieldText(row, 'CDS'), cdsOptions),
    cip: orientationFieldText(row, 'CIP'),
    datePremierRdv: orientationFieldIsoDate(row, 'datePremierRdv'),
    statut: normalizeOrientationRowStatut(orientationFieldText(row, 'statut'))
  }))
}

export interface BeneficiairesFilterOptions {
  cips: string[]
  clpes: string[]
  cds: string[]
}

export interface SalariesCipOption {
  id: string
  matricule: number
  keyImports: string
  cds: string
}

export interface SalariesCipIdentite {
  SA_NOM: string
  SA_PRENOM: string
  NOM_AFFICHAGE: string
}

export function buildSalariesCipKeyImports(
  identite: Pick<SalariesCipIdentite, 'SA_PRENOM' | 'SA_NOM'>
): string {
  const prenom = String(identite.SA_PRENOM ?? '').trim().toUpperCase()
  const nom = String(identite.SA_NOM ?? '').trim()
  return `${prenom} ${nom}`.trim()
}

export interface SalariesCipManager {
  MANAGER: number
  complements_post: {
    DISPLAY_NAME: string
  }
}

export interface SalariesCipStructure {
  RQCODE: string
  RQTITLE_FR: string
}

export interface SalariesCipEmploi {
  IDPOSTE: string
  FAMILLEEMPLOI: string
  CODESSFAMEMPLOI: string
  CODEFAMEMPLOI: string
}

export interface SalariesCipLdap {
  MAIL_PRO: string
}

export interface SalariesCip {
  _id?: string
  MATRICULE: number
  identite: SalariesCipIdentite
  manager: SalariesCipManager
  structure: SalariesCipStructure
  emploi: SalariesCipEmploi
  ldap: SalariesCipLdap
  CDS: string
  key_imports: string
}

export const ALL_SEMESTRES = '__all_semestres__'

export const CIP_LOTS = ['1', '2', '3', '4'] as const

export type CipLot = typeof CIP_LOTS[number]

export const CIP_LOT_PERIMETRES: Record<CipLot, string> = {
  '1': 'Périmètre d’intervention de Grand Bourg Agglomération, de la communauté de communes de Bresse et Saône, de la communauté de communes de La Veyle ainsi que le territoire de la commune de Saint-Laurent-sur-Saône',
  '2': 'Périmètre d’intervention de Haut Bugey Agglomération, de Pays de Gex Agglo ainsi que de Terre Valserhône l’Interco',
  '3': 'Périmètre d’intervention de la communauté de communes de Plaine de l’Ain, de la communauté de communes de Rives de l’Ain Pays du Cerdon, de la communauté de communes de Bugey Sud ainsi que le périmètre des communes de Seyssel, Corbonod et Anglefort',
  '4': 'Périmètre d’intervention de la communauté de communes de la Côtière, de la communauté de communes de Miribel et du Plateau, de la communauté de communes de la Dombes, ainsi que de la communauté de communes de Dombes Saône Vallée'
}

export interface SemestreOption {
  id: string
  label: string
  start: string
  end: string
}

export interface BilanCountByKey {
  key: string
  count: number
}

export interface BilanLotRow {
  lot: string
  lotLabel: string
  perimetre: string
  orientations: number
  doublons: number
  fileActive: number
  sorties: number
  demandesCli: number
}

export interface BilanTotaux {
  orientations: number
  doublons: number
  fileActive: number
  sorties: number
  demandesCli: number
}

export interface BilanSemestriel {
  semestre: SemestreOption
  semestres: SemestreOption[]
  totaux: BilanTotaux
  parLot: BilanLotRow[]
  sortiesParMotif: BilanCountByKey[]
}

export function lotLabel(lot: string): string {
  const n = normalizeLotNumber(lot)
  return n ? `Lot ${n}` : 'Lot non renseigné'
}

export function normalizeLotNumber(lot: string | null | undefined): string {
  const match = String(lot || '').match(/(\d+)/)
  return match?.[1] || ''
}

export function semestreIdFromDate(date: Date): string {
  const year = date.getUTCFullYear()
  const half = date.getUTCMonth() < 6 ? 1 : 2
  return `${year}-S${half}`
}

function semestreParts(id: string): { year: number, half: 1 | 2 } | null {
  const match = /^(\d{4})-S([12])$/.exec(id)
  if (!match) return null
  return { year: Number(match[1]), half: Number(match[2]) as 1 | 2 }
}

export function parseSemestreId(id: string): { year: number, half: 1 | 2 } | null {
  return semestreParts(id)
}

export function semestreBounds(id: string): { start: Date, end: Date } | null {
  const parsed = semestreParts(id)
  if (!parsed) return null
  if (parsed.half === 1) {
    return {
      start: new Date(Date.UTC(parsed.year, 0, 1)),
      end: new Date(Date.UTC(parsed.year, 5, 30))
    }
  }
  return {
    start: new Date(Date.UTC(parsed.year, 6, 1)),
    end: new Date(Date.UTC(parsed.year, 11, 31))
  }
}

export function semestreLabel(id: string): string {
  const parsed = semestreParts(id)
  if (!parsed) return id
  if (parsed.half === 1) {
    return `1er semestre ${parsed.year} (1er janvier – 30 juin ${parsed.year})`
  }
  return `2e semestre ${parsed.year} (1er juillet – 31 décembre ${parsed.year})`
}

export function buildSemestreOptions(from: Date, to: Date): SemestreOption[] {
  const startYear = from.getUTCFullYear()
  const startHalf: 1 | 2 = from.getUTCMonth() < 6 ? 1 : 2
  const endYear = to.getUTCFullYear()
  const endHalf: 1 | 2 = to.getUTCMonth() < 6 ? 1 : 2
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return []

  const options: SemestreOption[] = []
  let year = startYear
  let half: 1 | 2 = startHalf
  while (year < endYear || (year === endYear && half <= endHalf)) {
    const start = half === 1
      ? new Date(Date.UTC(year, 0, 1))
      : new Date(Date.UTC(year, 6, 1))
    const end = half === 1
      ? new Date(Date.UTC(year, 5, 30))
      : new Date(Date.UTC(year, 11, 31))
    const id = `${year}-S${half}`
    const label = half === 1
      ? `1er semestre ${year} (1er janvier – 30 juin ${year})`
      : `2e semestre ${year} (1er juillet – 31 décembre ${year})`
    options.push({
      id,
      label,
      start: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`,
      end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`
    })
    if (half === 1) {
      half = 2
    }
    else {
      half = 1
      year += 1
    }
    if (options.length > 40) break
  }
  return options.reverse()
}
