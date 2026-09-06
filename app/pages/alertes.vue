<script setup lang="ts">
const status = ref('open')
const type = ref('')
const cip = ref('')

const query = computed(() => ({
  status: status.value || undefined,
  type: type.value || undefined,
  cip: cip.value || undefined
}))

const { data, refresh } = await useFetch('/api/alerts', { query })
const { data: filters } = await useFetch('/api/filters')
watch(query, () => refresh())

const typeItems = [
  { label: 'Tous les types', value: '' },
  ...Object.entries(ALERT_LABELS).map(([value, label]) => ({ value, label }))
]
const statusItems = [
  { label: 'Ouvertes', value: 'open' },
  { label: 'Résolues', value: 'resolved' },
  { label: 'Toutes', value: '' }
]
const cipItems = computed(() => [
  { label: 'Tous les CIP', value: '' },
  ...(filters.value?.cips || []).map((v: string) => ({ label: v, value: v }))
])

async function resolve(id: string) {
  await $fetch(`/api/alerts/${id}`, { method: 'PATCH', body: { status: 'resolved' } })
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Alertes</h1>
      <p class="text-slate-500">{{ data?.total ?? 0 }} alerte(s) selon les filtres.</p>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <USelect v-model="status" :items="statusItems" value-key="value" label-key="label" />
      <USelect v-model="type" :items="typeItems" value-key="value" label-key="label" />
      <USelect v-model="cip" :items="cipItems" value-key="value" label-key="label" />
    </div>

    <UCard>
      <div v-if="!data?.alerts?.length" class="text-sm text-slate-500">Aucune alerte.</div>
      <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="alert in data.alerts" :key="alert._id" class="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="alert.severity === 'danger' ? 'error' : 'warning'" variant="subtle">
                {{ ALERT_LABELS[alert.type as AlertType] }}
              </UBadge>
              <UBadge v-if="alert.status === 'resolved'" color="neutral" variant="subtle">Résolue</UBadge>
            </div>
            <p class="mt-1 text-sm">{{ alert.message }}</p>
            <p v-if="alert.beneficiaireId" class="text-xs text-slate-500">
              {{ alert.beneficiaireId.prenom }} {{ alert.beneficiaireId.nom }} · {{ alert.beneficiaireId.cipNom }} · {{ alert.beneficiaireId.cds }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              v-if="alert.beneficiaireId"
              size="sm"
              variant="outline"
              :to="`/beneficiaires/${alert.beneficiaireId._id}`"
            >
              Fiche
            </UButton>
            <UButton v-if="alert.status === 'open'" size="sm" @click="resolve(alert._id)">
              Marquer résolue
            </UButton>
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>
