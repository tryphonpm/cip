export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

export function normalizeName(value: string | null | undefined): string {
  return stripAccents(String(value || ''))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeHeader(value: string): string {
  return stripAccents(String(value || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function normalizeCds(value: string | null | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const n = normalizeName(raw)
  if (n.includes('OYONNAX')) return 'Oyonnax'
  if (n.includes('NANTUA')) return 'Nantua'
  return titleCase(raw)
}

export function parseBilanType(value: string | null | undefined): BilanType | null {
  const n = normalizeHeader(String(value || ''))
  if (!n) return null
  if (n.includes('renouvel')) return 'renouvellement'
  if (n.includes('tripartite')) return 'tripartite'
  if (n.includes('reo') || n.includes('reorient')) return 'reo_ft'
  return null
}

export function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 1) return true
  const n = String(value ?? '').trim().toLowerCase()
  return n === '1' || n === 'oui' || n === 'true' || n === 'x'
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime())
  next.setMonth(next.getMonth() + months)
  return next
}

export function daysBetween(from: Date, to: Date): number {
  const ms = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
    - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round(ms / 86_400_000)
}
