<script setup lang="ts">
const props = defineProps<{
  keys: string[]
  columns?: OrientationColumn[]
  rows: OrientationRow[]
}>()

const typeByKey = computed(() => {
  const map: Record<string, OrientationValueType> = {}
  for (const column of props.columns || []) {
    map[column.nom] = column.type
  }
  return map
})

const tableColumns = computed(() =>
  props.keys.map((key, index) => ({
    id: `col_${index}`,
    header: key,
    accessorFn: (row: OrientationRow) => displayValue(key, row[key] ?? null)
  }))
)

function displayValue(key: string, value: OrientationFieldValue): string {
  if (value == null || value === '') return '—'
  const type = typeByKey.value[key]
  if (type === 'date' || value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    return formatDate(value instanceof Date ? value.toISOString() : String(value))
  }
  if (typeof value === 'number') return formatNumber(value)
  return String(value)
}
</script>

<template>
  <div class="table-scroll">
    <UTable :data="rows" :columns="tableColumns" />
  </div>
</template>
