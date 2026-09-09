<script setup lang="ts">
definePageMeta({ layout: 'default' })

const selectedId = ref('')
const rowFilter = ref<AttributionCdsTableFilter>('all')
const editableRows = ref<AttributionCdsRow[]>([])
const saving = ref(false)
const launching = ref(false)
const error = ref('')
const success = ref('')

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
  success.value = ''
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

function syncEditableRows() {
  if (!current.value) {
    editableRows.value = []
    return
  }
  editableRows.value = toAttributionCdsRows(current.value.data, cdsOptions.value)
}

watch([current, cdsOptions], syncEditableRows, { immediate: true })

const cdsUnassignedCount = computed(() => countAttributionCdsUnassigned(editableRows.value))
const cipUnassignedCount = computed(() => countAttributionCipUnassigned(editableRows.value))
const filteredRows = computed(() => filterAttributionCdsRows(editableRows.value, rowFilter.value))
const okRowCount = computed(() => editableRows.value.filter(row => isOrientationRowOk(row.statut)).length)
const busy = computed(() => saving.value || launching.value)

function attributionPayload() {
  return {
    rows: editableRows.value.map(row => ({
      rowIndex: row.index,
      cds: row.cds,
      cip: row.cip,
      datePremierRdv: row.datePremierRdv,
      statut: row.statut
    }))
  }
}

function patchRow(index: number, patch: Partial<AttributionCdsRow>) {
  editableRows.value = editableRows.value.map((row) => {
    if (row.index !== index) return row
    const next = { ...row, ...patch }
    if (patch.cds !== undefined && patch.cds !== row.cds) {
      if (!next.cds) {
        next.cip = ''
      }
      else if (next.cip) {
        const salary = salaries.value.find(item => item.keyImports === next.cip)
        if (!salary || !cdsLabelsMatch(salary.cds, next.cds)) {
          next.cip = ''
        }
      }
    }
    return next
  })
  success.value = ''
}

function onCdsUpdate(payload: { index: number, cds: string }) {
  patchRow(payload.index, { cds: payload.cds })
}

function onCipUpdate(payload: { index: number, cip: string }) {
  patchRow(payload.index, { cip: payload.cip })
}

function onDatePremierRdvUpdate(payload: { index: number, datePremierRdv: string }) {
  patchRow(payload.index, { datePremierRdv: payload.datePremierRdv })
}

function onStatutUpdate(payload: { index: number, statut: OrientationRowStatut }) {
  patchRow(payload.index, { statut: payload.statut })
}

async function saveAttribution() {
  if (!current.value) return
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const response = await $fetch<{ import: OrientationImportDetail }>(`/api/orientations/${current.value.id}/attribution`, {
      method: 'PATCH',
      body: attributionPayload()
    })
    detailResponse.value = response.import
    syncEditableRows()
    success.value = 'Les modifications ont été enregistrées.'
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Impossible d\'enregistrer les modifications.'
  }
  finally {
    saving.value = false
  }
}

function suiviSuccessMessage(suivi: {
  created: number
  skipped: number
  invalid: number
  promoted: number
  totalOk: number
}): string {
  const parts = [`${suivi.created} dossier(s) de suivi créé(s) sur ${suivi.totalOk} personne(s) au statut « OK ».`]
  if (suivi.promoted) parts.push(`${suivi.promoted} ligne(s) passée(s) au statut « SUIVI ».`)
  if (suivi.skipped) parts.push(`${suivi.skipped} déjà présent(s) dans le suivi.`)
  if (suivi.invalid) parts.push(`${suivi.invalid} ligne(s) ignorée(s) (identité incomplète).`)
  return parts.join(' ')
}

async function launchSuivi() {
  if (!current.value) return
  launching.value = true
  error.value = ''
  success.value = ''
  try {
    const response = await $fetch<{
      import: OrientationImportDetail
      suivi: { created: number, skipped: number, invalid: number, promoted: number, totalOk: number }
    }>(`/api/orientations/${current.value.id}/suivi`, {
      method: 'POST',
      body: attributionPayload()
    })
    detailResponse.value = response.import
    syncEditableRows()
    success.value = suiviSuccessMessage(response.suivi)
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Impossible de lancer le suivi.'
  }
  finally {
    launching.value = false
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
    <UAlert v-if="success" color="success" :title="success" />

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
      <template v-else-if="current">
        <OrientationCdsTable
          class="mt-4"
          :rows="filteredRows"
          :cds-options="cdsOptions"
          :salaries="salaries"
          @update:cds="onCdsUpdate"
          @update:cip="onCipUpdate"
          @update:date-premier-rdv="onDatePremierRdvUpdate"
          @update:statut="onStatutUpdate"
        />
        <div class="attribution-save-bar">
          <UButton
            class="attribution-save-button"
            size="lg"
            icon="i-lucide-save"
            :loading="saving"
            :disabled="busy"
            @click="saveAttribution"
          >
            Enregistrer
          </UButton>
          <UButton
            class="attribution-suivi-button"
            size="lg"
            color="success"
            icon="i-lucide-play"
            :loading="launching"
            :disabled="busy || !okRowCount"
            @click="launchSuivi"
          >
            Lancer le suivi
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
