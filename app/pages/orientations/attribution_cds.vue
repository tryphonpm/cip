<script setup lang="ts">
definePageMeta({ layout: 'default' })

const selectedId = ref('')
const rowFilter = ref<AttributionCdsTableFilter>('all')
const pending = ref<{ index: number, field: 'cds' | 'cip' } | null>(null)
const error = ref('')

const { data: list } = useFetch<{ imports: OrientationImportSummary[] }>('/api/orientations', {
  query: { limit: 20 }
})
const { data: settings } = useFetch<{ settings?: { cds?: string[] } }>('/api/settings')
const { data: salariesData } = useFetch<{ salaries: SalariesCipOption[] }>('/api/salaries-cip')

const imports = computed(() => list.value?.imports ?? [])
const salaries = computed(() => salariesData.value?.salaries ?? [])

watch(imports, (items) => {
  if (!items.length) {
    selectedId.value = ''
    return
  }
  if (!selectedId.value || !items.some(item => item.id === selectedId.value)) {
    selectedId.value = items[0]?.id ?? ''
  }
}, { immediate: true })

watch(selectedId, () => {
  rowFilter.value = 'all'
})

const { data: detailResponse, pending: loading, refresh } = useAsyncData(
  () => `orientation-attribution-${selectedId.value || 'none'}`,
  async () => {
    if (!selectedId.value) return null
    const response = await $fetch<{ import: OrientationImportDetail }>(`/api/orientations/${selectedId.value}`)
    return response.import
  },
  { watch: [selectedId] }
)

const current = computed(() => detailResponse.value ?? null)
const cdsOptions = computed(() => {
  const fromSettings = settings.value?.settings?.cds
  if (Array.isArray(fromSettings) && fromSettings.length) return fromSettings
  return [...DEFAULT_CDS]
})
const rows = computed(() => toAttributionCdsRows(current.value?.data ?? [], cdsOptions.value))
const cdsUnassignedCount = computed(() => countAttributionCdsUnassigned(rows.value))
const cipUnassignedCount = computed(() => countAttributionCipUnassigned(rows.value))
const filteredRows = computed(() => filterAttributionCdsRows(rows.value, rowFilter.value))

async function onCdsUpdate(payload: { index: number, cds: string }) {
  if (!current.value) return
  pending.value = { index: payload.index, field: 'cds' }
  error.value = ''
  try {
    await $fetch(`/api/orientations/${current.value.id}/cds`, {
      method: 'PATCH',
      body: { rowIndex: payload.index, cds: payload.cds }
    })
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Impossible d\'enregistrer le CDS.'
  }
  finally {
    pending.value = null
  }
}

async function onCipUpdate(payload: { index: number, cip: string }) {
  if (!current.value) return
  pending.value = { index: payload.index, field: 'cip' }
  error.value = ''
  try {
    await $fetch(`/api/orientations/${current.value.id}/cip`, {
      method: 'PATCH',
      body: { rowIndex: payload.index, cip: payload.cip }
    })
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Impossible d\'enregistrer le CIP.'
  }
  finally {
    pending.value = null
  }
}
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Attribution CDS"
      lead="Attribuez un centre de solidarité et un CIP à chaque personne d'une liste d'orientations. Le filtre propose les 20 importations les plus récentes."
    />

    <OrientationImportFilter v-model="selectedId" :imports="imports" />

    <UAlert v-if="error" color="error" :title="error" />

    <UCard>
      <template #header>
        <h2 class="section-title">
          {{ current?.ligne2 || current?.filename || 'Importation sélectionnée' }}
        </h2>
      </template>
      <p v-if="current" class="page-lead">
        {{ current.rowCount }} personne(s)
        <span v-if="current.documentDate"> · document du {{ formatDate(current.documentDate) }}</span>
        <span v-if="current.importedAt"> · importé le {{ formatDate(current.importedAt) }}</span>
      </p>

      <AttributionCdsFilterBar
        v-if="current && !loading"
        v-model="rowFilter"
        :cds-unassigned-count="cdsUnassignedCount"
        :cip-unassigned-count="cipUnassignedCount"
        class="mt-4"
      />

      <EmptyState
        v-if="!loading && !imports.length"
        title="Aucun import d'orientations"
        description="Importez d'abord une liste quotidienne pour attribuer les CDS."
        icon="i-lucide-folder-up"
      />
      <div v-else-if="loading" class="table-loading">
        <UIcon name="i-lucide-loader-circle" class="table-loading-icon" />
        <p class="page-lead">Chargement de l'importation…</p>
      </div>
      <OrientationCdsTable
        v-else-if="current"
        class="mt-4"
        :rows="filteredRows"
        :cds-options="cdsOptions"
        :salaries="salaries"
        :pending="pending"
        @update:cds="onCdsUpdate"
        @update:cip="onCipUpdate"
      />
    </UCard>
  </div>
</template>
