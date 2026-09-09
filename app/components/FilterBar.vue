<script setup lang="ts">
const props = withDefaults(defineProps<{
  optionsSource?: 'referentiel' | 'beneficiaires'
}>(), {
  optionsSource: 'referentiel'
})

const cip = defineModel<string>('cip', { default: ALL_FILTER })
const clpe = defineModel<string>('clpe', { default: ALL_FILTER })
const cds = defineModel<string>('cds', { default: ALL_FILTER })
const statut = defineModel<string>('statut', { default: ALL_FILTER })

const { data: filtersData } = useFetch('/api/filters', {
  lazy: true,
  immediate: props.optionsSource === 'referentiel'
})
const { data: salariesData } = useFetch<{ salaries: SalariesCipOption[] }>('/api/salaries-cip', {
  lazy: true,
  immediate: props.optionsSource === 'referentiel'
})
const { data: beneficiairesFiltersData } = useFetch<BeneficiairesFilterOptions>('/api/beneficiaires/filters', {
  lazy: true,
  immediate: props.optionsSource === 'beneficiaires'
})

function toSelectItems(allLabel: string, values: string[]) {
  return [
    { label: allLabel, value: ALL_FILTER },
    ...values.map(value => ({ label: value, value }))
  ]
}

const cipItems = computed(() => {
  if (props.optionsSource === 'beneficiaires') {
    return toSelectItems('Tous les CIP', beneficiairesFiltersData.value?.cips ?? [])
  }

  const keys = [...new Set(
    (salariesData.value?.salaries ?? [])
      .map(salary => salary.keyImports)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'fr'))

  return toSelectItems('Tous les CIP', keys)
})

const clpeItems = computed(() => {
  if (props.optionsSource === 'beneficiaires') {
    return toSelectItems('Tous les CLPE', beneficiairesFiltersData.value?.clpes ?? [])
  }

  return toSelectItems('Tous les CLPE', filtersData.value?.clpes ?? [])
})

const cdsItems = computed(() => {
  if (props.optionsSource === 'beneficiaires') {
    return toSelectItems('Tous les CDS', beneficiairesFiltersData.value?.cds ?? [])
  }

  return toSelectItems('Tous les CDS', filtersData.value?.cds ?? [])
})
const statutItems = [
  { label: 'Tous les statuts', value: ALL_FILTER },
  { label: 'Actifs', value: 'actif' },
  { label: 'Sorties', value: 'sortie' }
]
</script>

<template>
  <div class="grid gap-3 md:grid-cols-4">
    <USelect v-model="cip" :items="cipItems" value-key="value" label-key="label" />
    <USelect v-model="clpe" :items="clpeItems" value-key="value" label-key="label" />
    <USelect v-model="cds" :items="cdsItems" value-key="value" label-key="label" />
    <USelect v-model="statut" :items="statutItems" value-key="value" label-key="label" />
  </div>
</template>
