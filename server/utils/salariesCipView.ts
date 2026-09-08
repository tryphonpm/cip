import type { SalariesCipOption } from '../../shared/types'

interface SalariesCipSource {
  _id?: { toString(): string } | string
  MATRICULE?: number
  identite?: {
    NOM_AFFICHAGE?: string
  }
  CDS?: string
}

export function toSalariesCipOption(doc: SalariesCipSource): SalariesCipOption {
  const id = doc._id != null ? String(doc._id) : ''
  return {
    id,
    matricule: Number(doc.MATRICULE ?? 0),
    nomAffichage: String(doc.identite?.NOM_AFFICHAGE ?? ''),
    cds: String(doc.CDS ?? '')
  }
}

export function toSalariesCipOptions(docs: SalariesCipSource[]): SalariesCipOption[] {
  return docs
    .map(toSalariesCipOption)
    .filter(option => option.nomAffichage)
    .sort((a, b) => a.nomAffichage.localeCompare(b.nomAffichage, 'fr'))
}
