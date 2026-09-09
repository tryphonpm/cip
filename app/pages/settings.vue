<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')

const { data, pending, refresh } = useFetch<SettingsApiResponse>('/api/settings')

const form = ref<AppSettings>(emptyAppSettings())
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const alertsRecomputed = ref(false)

watch(() => data.value?.settings, (settings) => {
  if (!settings) return
  form.value = cloneAppSettings(settings)
}, { immediate: true })

interface SettingsTab {
  label: string
  icon: string
  value: string
  lead: string
  addLabel?: string
  placeholder?: string
}

const tabs: SettingsTab[] = [
  {
    label: 'Alertes',
    icon: 'i-lucide-timer',
    value: 'alertes',
    lead: 'Une alerte est créée si le 1er rendez-vous n\'est pas saisi, ou s\'il a lieu plus de N jours après la date d\'orientation.'
  },
  {
    label: 'Projets professionnels',
    icon: 'i-lucide-briefcase',
    value: 'projetsProfessionnels',
    lead: 'Liste proposée sur la fiche bénéficiaire.',
    addLabel: 'Ajouter un projet',
    placeholder: 'Libellé du projet'
  },
  {
    label: 'Motifs de sortie',
    icon: 'i-lucide-log-out',
    value: 'motifsSortie',
    lead: 'Motifs de sortie du parcours, également enrichis lors des imports reporting.',
    addLabel: 'Ajouter un motif',
    placeholder: 'Libellé du motif'
  },
  {
    label: 'Sorties positives',
    icon: 'i-lucide-badge-check',
    value: 'typesSortiePositive',
    lead: 'Types de sorties considérées comme positives.',
    addLabel: 'Ajouter un type',
    placeholder: 'Libellé du type'
  },
  {
    label: 'Réorientations',
    icon: 'i-lucide-git-branch',
    value: 'motifsReo',
    lead: 'Motifs de réorientation.',
    addLabel: 'Ajouter un motif',
    placeholder: 'Libellé du motif'
  },
  {
    label: 'Dispositifs',
    icon: 'i-lucide-layers',
    value: 'dispositifs',
    lead: 'Dispositifs d\'accompagnement pouvant être renseignés sur une fiche.',
    addLabel: 'Ajouter un dispositif',
    placeholder: 'Libellé du dispositif'
  },
  {
    label: 'CDS',
    icon: 'i-lucide-building-2',
    value: 'cds',
    lead: 'Centres de solidarité utilisés pour l\'attribution des orientations.',
    addLabel: 'Ajouter un CDS',
    placeholder: 'Nom du centre'
  },
  {
    label: 'Mapping import',
    icon: 'i-lucide-arrow-left-right',
    value: 'mapping',
    lead: 'Correspondance des clés entre une fiche bénéficiaire et une ligne d\'orientation.'
  }
]

function isListTab(value: string): value is AppSettingsStringListKey {
  return (APP_SETTINGS_STRING_LIST_KEYS as readonly string[]).includes(value)
}

async function saveSettings() {
  if (!isAdmin.value) return
  saving.value = true
  saved.value = false
  alertsRecomputed.value = false
  error.value = ''
  const previousDelai = data.value?.settings.delaiPremierRdvJours
  try {
    await $fetch<SettingsApiResponse>('/api/settings', {
      method: 'PATCH',
      body: form.value
    })
    await refresh()
    saved.value = true
    alertsRecomputed.value = previousDelai !== form.value.delaiPremierRdvJours
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.data?.message || err.message || 'Enregistrement impossible.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Paramètres"
      lead="Modifiez les référentiels de l'application : alertes, listes métier et mapping d'import."
    />

    <UAlert
      v-if="!isAdmin"
      color="warning"
      title="Consultation seule"
      description="Seuls les comptes administrateurs peuvent modifier ces valeurs."
    />
    <UAlert
      v-if="error"
      color="error"
      :title="error"
    />

    <UCard>
      <div v-if="pending && !data" class="table-loading">
        <UIcon name="i-lucide-loader-circle" class="table-loading-icon" />
        <p class="page-lead">Chargement des paramètres…</p>
      </div>
      <UTabs
        v-else
        class="settings-tabs"
        variant="link"
        :ui="{ list: 'overflow-x-auto' }"
        :items="tabs"
      >
        <template #content="{ item }">
          <div class="settings-tab-panel">
            <p class="page-lead">{{ item.lead }}</p>
            <UFormField
              v-if="item.value === 'alertes'"
              label="Seuil (jours calendaires)"
            >
              <UInput
                v-model.number="form.delaiPremierRdvJours"
                class="settings-number-input"
                type="number"
                min="1"
                max="180"
                :disabled="!isAdmin"
              />
            </UFormField>
            <SettingsStringList
              v-else-if="isListTab(item.value)"
              v-model="form[item.value]"
              :disabled="!isAdmin"
              :add-label="item.addLabel"
              :placeholder="item.placeholder"
            />
            <SettingsMappingEditor
              v-else-if="item.value === 'mapping'"
              v-model="form.mapping_import_beneficiaire"
              :disabled="!isAdmin"
            />
          </div>
        </template>
      </UTabs>

      <div class="settings-save-bar">
        <UButton
          icon="i-lucide-save"
          :loading="saving"
          :disabled="!isAdmin || saving || pending"
          @click="saveSettings"
        >
          Enregistrer
        </UButton>
        <span v-if="saved" class="page-lead">
          Enregistré.
          <template v-if="alertsRecomputed"> Les alertes ont été recalculées.</template>
        </span>
      </div>
    </UCard>
  </div>
</template>
