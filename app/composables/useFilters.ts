export const ALL_FILTER = '__all__'

export function toFilterQuery(value: string | undefined | null) {
  if (!value || value === ALL_FILTER) return undefined
  return value
}
