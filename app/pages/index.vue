<script setup lang="ts">
const { data: stats, refresh: refreshStats } = await useFetch('/api/stats')
const { data: alerts, refresh: refreshAlerts } = await useFetch('/api/alerts', { query: { status: 'open' } })

onMounted(() => {
  refreshStats()
  refreshAlerts()
})

const t = computed(() => stats.value?.totaux)
const openAlerts = computed(() => alerts.value?.alerts || [])
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Tableau de bord</h1>
      <p class="text-slate-500">Vue d'ensemble des accompagnements CIP+ et des alertes ouvertes.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Dossiers" :value="t?.dossiers ?? 0" hint="Tous statuts confondus" />
      <KpiCard label="Accompagnement effectif" :value="t?.accompagnementEffectif ?? 0" tone="success" hint="Hors sorties sans CE" />
      <KpiCard label="Sorties sans CE" :value="t?.sortiesSansCe ?? 0" tone="warning" />
      <KpiCard label="Alertes ouvertes" :value="openAlerts.length" :tone="openAlerts.length ? 'danger' : 'success'" />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="CE signés" :value="t?.ceSignes ?? 0" />
      <KpiCard label="PMSMP" :value="t?.pmsmp ?? 0" />
      <KpiCard label="FSE renseignés" :value="t?.fse ?? 0" />
      <KpiCard label="Taux d'absentéisme" :value="`${t?.tauxAbsenteisme ?? 0} %`" hint="Absences / créneaux suivis" />
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Dernières alertes</h2>
          <UButton to="/alertes" variant="ghost" size="sm">Tout voir</UButton>
        </div>
      </template>
      <p v-if="!openAlerts.length" class="text-sm text-slate-500">Aucune alerte ouverte. Importez un fichier reporting pour lancer l'analyse.</p>
      <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="alert in openAlerts.slice(0, 8)" :key="alert._id" class="flex items-start justify-between gap-4 py-3">
          <div>
            <p class="text-sm font-medium">{{ ALERT_LABELS[alert.type as AlertType] }}</p>
            <p class="text-sm text-slate-500">{{ alert.message }}</p>
          </div>
          <UBadge :color="alert.severity === 'danger' ? 'error' : 'warning'" variant="subtle">
            {{ alert.severity === 'danger' ? 'Urgent' : 'À traiter' }}
          </UBadge>
        </li>
      </ul>
    </UCard>
  </div>
</template>
