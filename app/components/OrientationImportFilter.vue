<script setup lang="ts">
const props = defineProps<{
  imports: OrientationImportSummary[]
  disabled?: boolean
}>()

const selectedId = defineModel<string>({ default: '' })

const items = computed(() =>
  props.imports.map((item, index) => ({
    label: importLabel(item, index),
    value: item.id
  }))
)

function importLabel(item: OrientationImportSummary, index: number): string {
  const importedAt = item.importedAt ? new Date(item.importedAt) : null
  const date = importedAt && !Number.isNaN(importedAt.getTime())
    ? importedAt.toLocaleDateString('fr-FR')
    : 'Date inconnue'
  const time = importedAt && !Number.isNaN(importedAt.getTime())
    ? importedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''
  const prefix = index === 0 ? 'Plus récente · ' : ''
  return `${prefix}${date}${time ? ` ${time}` : ''} · ${item.rowCount} pers. · ${item.filename}`
}
</script>

<template>
  <UFormField label="Importation">
    <USelect
      v-model="selectedId"
      :items="items"
      :disabled="disabled || !imports.length"
      value-key="value"
      label-key="label"
      placeholder="Sélectionnez une importation"
      class="import-filter"
    />
  </UFormField>
</template>
