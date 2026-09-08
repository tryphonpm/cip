<script setup lang="ts">
const props = defineProps<{
  rows: AttributionCdsRow[]
  cdsOptions: string[]
  salaries: SalariesCipOption[]
}>()

const emit = defineEmits<{
  'update:cds': [payload: { index: number, cds: string }]
  'update:cip': [payload: { index: number, cip: string }]
  'update:datePremierRdv': [payload: { index: number, datePremierRdv: string }]
  'update:statut': [payload: { index: number, statut: OrientationRowStatut }]
}>()

const effectiveOptions = computed(() =>
  props.cdsOptions.length ? props.cdsOptions : [...DEFAULT_CDS]
)

const statutItems = buildStatutSelectItems()

function rowClass(statut: OrientationRowStatut): string {
  if (isOrientationRowSuivi(statut)) return 'attribution-row-suivi'
  if (isOrientationRowOk(statut)) return 'attribution-row-active'
  return ''
}

const tableMeta = computed(() => ({
  class: {
    tr: (row: { original: AttributionCdsRow }) => rowClass(row.original.statut)
  }
}))

const columns = [
  { accessorKey: 'nom', header: 'Nom' },
  { accessorKey: 'prenom', header: 'Prénom' },
  { accessorKey: 'adresse', header: 'Adresse' },
  { accessorKey: 'cp', header: 'CP' },
  { accessorKey: 'ville', header: 'Ville' },
  { id: 'cds', header: 'CDS' },
  { id: 'cip', header: 'CIP' },
  { id: 'datePremierRdv', header: '1er RDV' },
  { id: 'statut', header: 'Statut' }
]

function onCdsChange(index: number, value: unknown) {
  emit('update:cds', { index, cds: cdsFromSelectValue(value) })
}

function onCipChange(index: number, value: unknown) {
  emit('update:cip', { index, cip: cipFromSelectValue(value) })
}

function onDatePremierRdvChange(index: number, value: string) {
  emit('update:datePremierRdv', { index, datePremierRdv: value })
}

function onStatutChange(index: number, value: unknown) {
  emit('update:statut', { index, statut: normalizeOrientationRowStatut(String(value ?? '')) })
}

function statutSelectValue(statut: OrientationRowStatut): OrientationRowStatutEditable {
  const normalized = normalizeOrientationRowStatut(statut)
  return normalized === ORIENTATION_ROW_STATUT_SUIVI ? ORIENTATION_ROW_STATUT_DEFAULT : normalized
}

function attributionSelectUi(widthClass: string, isUnassigned: boolean) {
  return {
    base: isUnassigned ? `${widthClass} select-unassigned` : widthClass
  }
}
</script>

<template>
  <div class="table-scroll">
    <UTable :data="rows" :columns="columns" :meta="tableMeta">
      <template #cds-cell="{ row }">
        <USelectMenu
          :model-value="cdsSelectValue(row.original.cds)"
          :items="buildCdsSelectItems(effectiveOptions, row.original.cds)"
          value-key="value"
          label-key="label"
          :search-input="false"
          placeholder="À attribuer"
          :ui="attributionSelectUi('cds-select', !row.original.cds)"
          @update:model-value="onCdsChange(row.original.index, $event)"
        />
      </template>
      <template #cip-cell="{ row }">
        <USelectMenu
          :model-value="cipSelectValue(row.original.cip)"
          :items="buildCipSelectItems(salaries, row.original.cds, row.original.cip)"
          :disabled="!row.original.cds"
          value-key="value"
          label-key="label"
          :search-input="false"
          placeholder="À attribuer"
          :ui="attributionSelectUi('cip-select', !row.original.cip)"
          @update:model-value="onCipChange(row.original.index, $event)"
        />
      </template>
      <template #datePremierRdv-cell="{ row }">
        <AttributionDatePicker
          :model-value="row.original.datePremierRdv"
          @update:model-value="onDatePremierRdvChange(row.original.index, $event)"
        />
      </template>
      <template #statut-cell="{ row }">
        <span
          v-if="isOrientationRowSuivi(row.original.statut)"
          class="attribution-statut-label"
        >
          SUIVI
        </span>
        <USelect
          v-else
          :model-value="statutSelectValue(row.original.statut)"
          :items="statutItems"
          value-key="value"
          label-key="label"
          class="statut-select"
          @update:model-value="onStatutChange(row.original.index, $event)"
        />
      </template>
    </UTable>
  </div>
</template>
