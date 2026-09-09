import type { SalariesCipOption } from '../../shared/types'

interface SalariesCipSource {
  _id?: { toString(): string } | string
  MATRICULE?: number
  key_imports?: string
  CDS?: string
}

export function toSalariesCipOption(doc: SalariesCipSource): SalariesCipOption {
  const id = doc._id != null ? String(doc._id) : ''
  return {
    id,
    matricule: Number(doc.MATRICULE ?? 0),
    keyImports: String(doc.key_imports ?? ''),
    cds: String(doc.CDS ?? '')
  }
}

export function toSalariesCipOptions(docs: SalariesCipSource[]): SalariesCipOption[] {
  return docs
    .map(toSalariesCipOption)
    .filter(option => option.keyImports)
    .sort((a, b) => a.keyImports.localeCompare(b.keyImports, 'fr'))
}
