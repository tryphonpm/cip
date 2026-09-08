<script setup lang="ts">
definePageMeta({ layout: 'default' })

const file = ref<File | null>(null)
const pending = ref(false)
const error = ref('')
const result = ref<OrientationImportDetail | null>(null)
const selected = ref<OrientationImportDetail | null>(null)

const { data, refresh } = useFetch<{ imports: OrientationImportSummary[] }>('/api/orientations', { lazy: true })

const history = computed(() => data.value?.imports || [])
const preview = computed(() => result.value || selected.value || null)

const historyColumns = [
  { accessorKey: 'filename', header: 'Fichier' },
  { accessorKey: 'documentDate', header: 'Date du document' },
  { accessorKey: 'importedAt', header: 'Horodatage' },
  { id: 'user', header: 'Utilisateur' },
  { accessorKey: 'rowCount', header: 'Lignes' }
]

async function upload() {
  if (!file.value) return
  pending.value = true
  error.value = ''
  result.value = null
  selected.value = null
  try {
    const body = new FormData()
    body.append('file', file.value)
    const dataRes = await $fetch<{ import: OrientationImportDetail }>('/api/orientations', {
      method: 'POST',
      body
    })
    result.value = dataRes.import
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Import impossible. Veuillez vérifier le fichier.'
  }
  finally {
    pending.value = false
  }
}

async function openImport(id: string) {
  result.value = null
  error.value = ''
  try {
    const dataRes = await $fetch<{ import: OrientationImportDetail }>(`/api/orientations/${id}`)
    selected.value = dataRes.import
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Impossible de charger cet import.'
  }
}

function documentLabel(item: OrientationImportSummary): string {
  if (item.documentDate) return formatDate(item.documentDate)
  return '—'
}
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Orientations BRSA"
      lead="Importez la liste quotidienne des nouvelles orientations transmise par le Conseil départemental de l'Ain (bénéficiaires du RSA)."
    />

    <UCard>
      <template #header>
        <h2 class="section-title">Nouveau fichier</h2>
      </template>
      <div class="page-stack">
        <FileDropzone v-model="file" :disabled="pending" />
        <div class="upload-actions">
          <UButton :disabled="!file" :loading="pending" icon="i-lucide-upload" @click="upload">
            Importer la liste
          </UButton>
          <p v-if="file" class="page-lead">
            Fichier sélectionné : {{ file.name }}
          </p>
        </div>
        <UAlert v-if="error" color="error" :title="error" />
        <UAlert
          v-if="result"
          color="success"
          title="Import enregistré"
          :description="`${result.rowCount} orientation(s) enregistrée(s). Date du document : ${documentLabel(result)}.`"
        />
      </div>
    </UCard>

    <UCard v-if="preview">
      <template #header>
        <h2 class="section-title">
          {{ preview.ligne2 || preview.filename }}
        </h2>
      </template>
      <p class="page-lead">
        {{ preview.ligne1 }}
      </p>
      <p class="page-lead">
        Importé le {{ formatDate(preview.importedAt) }}
        <span v-if="preview.importedBy"> par {{ preview.importedBy.name }}</span>
        · {{ preview.rowCount }} ligne(s)
      </p>
      <UAlert
        v-if="preview.warnings.length"
        class="mt-4"
        color="warning"
        title="Avertissements de lecture"
        :description="preview.warnings.slice(0, 8).join(' ')"
      />
      <div class="mt-4">
        <OrientationPreviewTable
          :keys="preview.keys"
          :columns="preview.columns"
          :rows="preview.data"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="section-title">Historique des importations</h2>
      </template>
      <EmptyState
        v-if="!history.length"
        title="Aucun import pour le moment"
        description="Déposez un fichier .xlsx pour constituer l'historique des orientations quotidiennes."
        icon="i-lucide-folder-up"
      />
      <UTable
        v-else
        :data="history"
        :columns="historyColumns"
      >
        <template #filename-cell="{ row }">
          <UButton variant="link" color="primary" @click="openImport(row.original.id)">
            {{ row.original.filename }}
          </UButton>
        </template>
        <template #documentDate-cell="{ row }">
          {{ documentLabel(row.original) }}
        </template>
        <template #importedAt-cell="{ row }">
          {{ formatDate(row.original.importedAt) }}
          <span class="text-muted"> {{ new Date(row.original.importedAt).toLocaleTimeString('fr-FR') }}</span>
        </template>
        <template #user-cell="{ row }">
          {{ row.original.importedBy?.name || '—' }}
        </template>
      </UTable>
    </UCard>
  </div>
</template>
