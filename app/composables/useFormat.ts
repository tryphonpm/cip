export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

export function formatNumber(value: number | null | undefined) {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(value)
}
