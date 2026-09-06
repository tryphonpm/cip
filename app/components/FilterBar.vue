<script setup lang="ts">
const cip = defineModel<string>('cip', { default: '' })
const clpe = defineModel<string>('clpe', { default: '' })
const cds = defineModel<string>('cds', { default: '' })
const statut = defineModel<string>('statut', { default: '' })

const { data } = await useFetch('/api/filters')

const cipItems = computed(() => [
  { label: 'Tous les CIP', value: '' },
  ...(data.value?.cips || []).map((v: string) => ({ label: v, value: v }))
])
const clpeItems = computed(() => [
  { label: 'Tous les CLPE', value: '' },
  ...(data.value?.clpes || []).map((v: string) => ({ label: v, value: v }))
])
const cdsItems = computed(() => [
  { label: 'Tous les CDS', value: '' },
  ...(data.value?.cds || []).map((v: string) => ({ label: v, value: v }))
])
const statutItems = [
  { label: 'Tous les statuts', value: '' },
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
