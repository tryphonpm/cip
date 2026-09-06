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
