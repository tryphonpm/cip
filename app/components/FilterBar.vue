<script setup lang="ts">
const log = (hypothesisId: string, message: string, data: Record<string, unknown> = {}) => {
  // #region agent log
  fetch('http://127.0.0.1:7533/ingest/71991fc5-0344-424f-94ec-bddb6bd94748', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a4834' },
    body: JSON.stringify({
      sessionId: '1a4834',
      runId: 'post-fix',
      hypothesisId,
      location: 'components/FilterBar.vue',
      message,
      data,
      timestamp: Date.now()
    })
  }).catch(() => {})
  // #endregion
}

const cip = defineModel<string>('cip', { default: ALL_FILTER })
const clpe = defineModel<string>('clpe', { default: ALL_FILTER })
const cds = defineModel<string>('cds', { default: ALL_FILTER })
const statut = defineModel<string>('statut', { default: ALL_FILTER })

log('H5', 'FilterBar setup start')
const { data } = useFetch('/api/filters', { lazy: true })
log('H5', 'FilterBar useFetch initialized', { lazy: true })

const cipItems = computed(() => [
  { label: 'Tous les CIP', value: ALL_FILTER },
  ...(data.value?.cips || []).map((v: string) => ({ label: v, value: v }))
])
const clpeItems = computed(() => [
  { label: 'Tous les CLPE', value: ALL_FILTER },
  ...(data.value?.clpes || []).map((v: string) => ({ label: v, value: v }))
])
const cdsItems = computed(() => [
  { label: 'Tous les CDS', value: ALL_FILTER },
  ...(data.value?.cds || []).map((v: string) => ({ label: v, value: v }))
])
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
