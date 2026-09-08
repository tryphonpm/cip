import { readFileSync } from 'node:fs'
import path from 'node:path'

export function mappingImportBeneficiaireFilePath(): string {
  return path.resolve(process.cwd(), 'CDC/mapping-beneficiaire-orientationimports.json')
}

export function loadMappingImportBeneficiaire(): Record<string, unknown> {
  const raw = readFileSync(mappingImportBeneficiaireFilePath(), 'utf8')
  return JSON.parse(raw) as Record<string, unknown>
}
