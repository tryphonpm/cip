<script setup lang="ts">
const route = useRoute()
const { data, refresh } = await useFetch(`/api/beneficiaires/${route.params.id}`)
const { data: settings } = await useFetch('/api/settings')
const projet = ref('')

watch(() => data.value?.beneficiaire?.projetProfessionnel, (v) => {
  projet.value = v || ''
}, { immediate: true })

const projetItems = computed(() => [
  { label: 'Non renseigné', value: '' },
  ...(settings.value?.settings?.projetsProfessionnels || []).map((p: string) => ({ label: p, value: p }))
])

async function saveProjet() {
  await $fetch(`/api/beneficiaires/${route.params.id}`, {
    method: 'PATCH',
    body: { projetProfessionnel: projet.value }
  })
  await refresh()
}

const b = computed(() => data.value?.beneficiaire)
</script>

<template>
  <div v-if="b" class="space-y-6">
    <div>
      <NuxtLink to="/beneficiaires" class="text-sm text-teal-800 hover:underline">← Bénéficiaires</NuxtLink>
      <h1 class="mt-2 text-2xl font-semibold">{{ b.prenom }} {{ b.nom }}</h1>
      <p class="text-slate-500">{{ b.civilite }} · {{ b.age ? `${b.age} ans` : 'âge n.r.' }} · {{ b.cipNom }} · {{ b.cds }}</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <UCard>
        <template #header><h2 class="font-semibold">Parcours</h2></template>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt class="text-slate-500">Statut</dt><dd>{{ b.statut }}</dd>
          <dt class="text-slate-500">Orientation</dt><dd>{{ formatDate(b.dateOrientation) }}</dd>
          <dt class="text-slate-500">1er RDV</dt><dd>{{ formatDate(b.datePremierRdv) }}</dd>
          <dt class="text-slate-500">CE 6 mois</dt><dd>{{ formatDate(b.ceSigne6) }}</dd>
          <dt class="text-slate-500">Fin CE 6 mois</dt><dd>{{ formatDate(b.finCe6) }}</dd>
          <dt class="text-slate-500">CE 12 mois</dt><dd>{{ formatDate(b.ceSigne12) }}</dd>
          <dt class="text-slate-500">Date sortie</dt><dd>{{ formatDate(b.dateSortie) }}</dd>
          <dt class="text-slate-500">Motif sortie</dt><dd>{{ b.motifSortie || '—' }}</dd>
          <dt class="text-slate-500">Réorientation</dt><dd>{{ b.motifReo || '—' }}</dd>
          <dt class="text-slate-500">Type sortie</dt><dd>{{ b.typeSortie || '—' }}</dd>
        </dl>
      </UCard>
      <UCard>
        <template #header><h2 class="font-semibold">Suivi et FSE</h2></template>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt class="text-slate-500">Bilan</dt><dd>{{ b.bilanType ? BILAN_LABELS[b.bilanType as BilanType] : '—' }}</dd>
          <dt class="text-slate-500">Date bilan 7e mois</dt><dd>{{ formatDate(b.bilanDate7) }}</dd>
          <dt class="text-slate-500">Date bilan 14e mois</dt><dd>{{ formatDate(b.bilanDate14) }}</dd>
          <dt class="text-slate-500">FSE</dt><dd>{{ b.fseCode || '—' }}</dd>
          <dt class="text-slate-500">PMSMP</dt><dd>{{ b.pmsmp ? 'Oui' : 'Non' }}</dd>
          <dt class="text-slate-500">CLPE</dt><dd>{{ b.clpe || '—' }}</dd>
          <dt class="text-slate-500">Freins</dt><dd>{{ b.freins?.join(', ') || '—' }}</dd>
        </dl>
        <div class="mt-4 space-y-2">
          <UFormField label="Projet professionnel">
            <USelect v-model="projet" :items="projetItems" value-key="value" label-key="label" />
          </UFormField>
          <UButton size="sm" @click="saveProjet">Enregistrer</UButton>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header><h2 class="font-semibold">Dispositifs sollicités</h2></template>
      <p v-if="!b.dispositifs?.length" class="text-sm text-slate-500">Aucun.</p>
      <ul v-else class="text-sm">
        <li v-for="d in b.dispositifs" :key="d.nom">{{ d.nom }} : {{ d.valeur }}</li>
      </ul>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Absences et suspension</h2></template>
      <p class="text-sm">Avant CE : {{ b.absences?.avantCe1 || 0 }} / {{ b.absences?.avantCe2 || 0 }}</p>
      <p class="mt-2 text-sm">Mensuelles : {{ (b.absences?.mois || []).map((n: number, i: number) => `M${i + 1}:${n}`).join(' · ') }}</p>
      <p class="mt-2 text-sm">Demande de suspension : {{ b.suspensions?.demande ? 'Oui' : 'Non' }}</p>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Alertes</h2></template>
      <ul v-if="data?.alerts?.length" class="space-y-2 text-sm">
        <li v-for="a in data.alerts" :key="a._id">
          <UBadge :color="a.status === 'open' ? 'warning' : 'neutral'" variant="subtle" class="mr-2">
            {{ ALERT_LABELS[a.type as AlertType] }}
          </UBadge>
          {{ a.message }}
        </li>
      </ul>
      <p v-else class="text-sm text-slate-500">Aucune alerte.</p>
    </UCard>

    <UCard v-if="b.commentaires">
      <template #header><h2 class="font-semibold">Commentaires</h2></template>
      <p class="whitespace-pre-wrap text-sm">{{ b.commentaires }}</p>
    </UCard>
  </div>
</template>
