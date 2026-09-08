<script setup lang="ts">
const props = defineProps<{
  rows: AttributionCdsRow[]
  cdsOptions: string[]
  salaries: SalariesCipOption[]
  pending?: { index: number, field: 'cds' | 'cip' } | null
}>()

const emit = defineEmits<{
  'update:cds': [payload: { index: number, cds: string }]
  'update:cip': [payload: { index: number, cip: string }]
}>()

const effectiveOptions = computed(() =>
  props.cdsOptions.length ? props.cdsOptions : [...DEFAULT_CDS]
)

const columns = [
  { accessorKey: 'nom', header: 'Nom' },
  { accessorKey: 'prenom', header: 'Prénom' },
  { accessorKey: 'adresse', header: 'Adresse' },
  { accessorKey: 'cp', header: 'CP' },
  { accessorKey: 'ville', header: 'Ville' },
  { id: 'cds', header: 'CDS' },
  { id: 'cip', header: 'CIP' }
]

function isPending(index: number, field: 'cds' | 'cip'): boolean {
  return props.pending?.index === index && props.pending?.field === field
}

function onCdsChange(index: number, value: unknown) {
  emit('update:cds', { index, cds: cdsFromSelectValue(value) })
}

function onCipChange(index: number, value: unknown) {
  emit('update:cip', { index, cip: cipFromSelectValue(value) })
}

function attributionSelectUi(widthClass: string, isUnassigned: boolean) {
  return {
    base: isUnassigned ? `${widthClass} select-unassigned` : widthClass
  }
}
</script>

<template>
  <div class="table-scroll">
    <UTable :data="rows" :columns="columns">
      <template #cds-cell="{ row }">
        <USelectMenu
          :model-value="cdsSelectValue(row.original.cds)"
          :items="buildCdsSelectItems(effectiveOptions, row.original.cds)"
          :disabled="isPending(row.original.index, 'cds') || isPending(row.original.index, 'cip')"
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
          :disabled="!row.original.cds || isPending(row.original.index, 'cip') || isPending(row.original.index, 'cds')"
          value-key="value"
          label-key="label"
          :search-input="false"
          placeholder="À attribuer"
          :ui="attributionSelectUi('cip-select', !row.original.cip)"
          @update:model-value="onCipChange(row.original.index, $event)"
        />
      </template>
    </UTable>
  </div>
</template>
