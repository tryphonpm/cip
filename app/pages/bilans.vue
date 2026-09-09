<script setup lang="ts">
definePageMeta({ layout: 'default' })

const semestre = ref(semestreIdFromDate(new Date()))
const exporting = ref(false)
const exportError = ref('')

const query = computed(() => ({
  semestre: semestre.value || undefined
}))

const { data, status } = useFetch<BilanSemestriel>('/api/bilans', {
  query,
  lazy: true
})

const semestreItems = computed(() =>
  (data.value?.semestres || []).map(item => ({ label: item.label, value: item.id }))
)

watch(() => data.value?.semestre.id, (id) => {
  if (id && !semestreItems.value.some(item => item.value === semestre.value)) {
    semestre.value = id
  }
}, { immediate: true })

watch(semestre, () => {
  exportError.value = ''
})

const totaux = computed(() => data.value?.totaux)
const lotRows = computed(() => (data.value?.parLot || []).map(row => ({
  lotLabel: row.lotLabel,
  orientations: row.orientations,
  doublons: row.doublons,
  fileActive: row.fileActive,
  sorties: row.sorties,
  demandesCli: row.demandesCli
})))
const motifRows = computed(() => data.value?.sortiesParMotif || [])

const lotColumns = [
  { accessorKey: 'lotLabel', header: 'Lot' },
  { accessorKey: 'orientations', header: 'Orientations' },
  { accessorKey: 'doublons', header: 'Doublons' },
  { accessorKey: 'fileActive', header: 'File active' },
  { accessorKey: 'sorties', header: 'Sorties' },
  { accessorKey: 'demandesCli', header: 'Demandes CLI' }
]

const motifColumns = [
  { accessorKey: 'key', header: 'Motif' },
  { accessorKey: 'count', header: 'Nombre' }
]

async function downloadWord() {
  exporting.value = true
  exportError.value = ''
  try {
    const blob = await $fetch<Blob>('/api/bilans/export', {
      query: query.value,
      responseType: 'blob'
    })
    const suffix = data.value?.semestre.id === ALL_SEMESTRES
      ? 'tous-semestres'
      : (data.value?.semestre.id || 'export')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Bilan-CIP-plus-${suffix}.docx`
    link.click()
    URL.revokeObjectURL(url)
  }
  catch (error: unknown) {
    const err = error as { message?: string, data?: { message?: string } }
    exportError.value = err.data?.message || err.message || 'Export du bilan Word impossible.'
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Bilans semestriels"
      lead="Indicateurs d’activité CIP+ sur la période choisie, prêts à être injectés dans le modèle Word (remplacement de tags)."
    />

    <div class="bilan-toolbar">
      <BilanPeriodeFilter v-model="semestre" :items="semestreItems" />
      <UButton
        icon="i-lucide-file-down"
        :loading="exporting"
        :disabled="status === 'pending'"
        @click="downloadWord"
      >
        Télécharger le bilan Word
      </UButton>
    </div>

    <UAlert
      v-if="exportError"
      color="error"
      :title="exportError"
    />
    <p v-if="status === 'pending'" class="page-lead">Calcul en cours…</p>

    <div class="kpi-grid">
      <KpiCard
        label="Orientations reçues"
        :value="totaux?.orientations ?? 0"
        hint="Tous lots confondus · flux sur la période"
      />
      <KpiCard
        label="File active"
        :value="totaux?.fileActive ?? 0"
        tone="success"
        hint="Tous lots confondus · stock à la date d’arrêt"
      />
      <KpiCard
        label="Sorties du dispositif"
        :value="totaux?.sorties ?? 0"
        hint="Tous motifs confondus"
      />
      <KpiCard
        label="Demandes de passage en CLI"
        :value="totaux?.demandesCli ?? 0"
        hint="Demandes d’étude de situation du reporting CIP"
      />
    </div>

    <StatTable
      title="Orientations, file active et sorties par lot"
      :data="lotRows"
      :columns="lotColumns"
      empty="Aucun lot à afficher pour cette période."
    />

    <StatTable
      title="Sorties par motif"
      :data="motifRows"
      :columns="motifColumns"
      empty="Aucune sortie sur la période sélectionnée."
    />
  </div>
</template>
