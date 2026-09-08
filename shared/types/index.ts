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
  if (currentCip && !filtered.some(salary => salary.nomAffichage === currentCip)) {
    filtered.unshift({
      id: '',
      matricule: 0,
      nomAffichage: currentCip,
      cds
    })
  }
  return [
    { label: 'À attribuer', value: CIP_UNASSIGNED },
    ...filtered.map(salary => ({
      label: salary.nomAffichage,
      value: salary.nomAffichage
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

function normalizeCdsLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\bst\.?\b/g, 'saint')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function orientationFieldText(row: OrientationRow, header: string): string {
  const target = normalizeCdsLabel(header)
  for (const [key, value] of Object.entries(row)) {
    if (normalizeCdsLabel(key) !== target) continue
    if (value == null || value === '') return ''
    return String(value)
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
    cip: orientationFieldText(row, 'CIP')
  }))
}

export interface SalariesCipOption {
  id: string
  matricule: number
  nomAffichage: string
  cds: string
}

export interface SalariesCipIdentite {
  SA_NOM: string
  SA_PRENOM: string
  NOM_AFFICHAGE: string
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
}
