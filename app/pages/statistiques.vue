<script setup lang="ts">
const cip = ref('')
const clpe = ref('')
const cds = ref('')
const statut = ref('')

const query = computed(() => ({
  cip: cip.value || undefined,
  clpe: clpe.value || undefined,
  cds: cds.value || undefined,
  statut: statut.value || undefined
}))

const { data, refresh, status } = await useFetch('/api/stats', { query })

watch(query, () => refresh())

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(';'), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Statistiques</h1>
      <p class="text-slate-500">Indicateurs calculés à partir des fichiers reporting CIP importés.</p>
    </div>

    <FilterBar v-model:cip="cip" v-model:clpe="clpe" v-model:cds="cds" v-model:statut="statut" />
    <p v-if="status === 'pending'" class="text-sm text-slate-500">Calcul en cours…</p>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Orientations" :value="data?.totaux.orientations ?? 0" />
      <KpiCard label="Accompagnement effectif" :value="data?.totaux.accompagnementEffectif ?? 0" tone="success" />
      <KpiCard label="Sorties sans CE" :value="data?.totaux.sortiesSansCe ?? 0" tone="warning" />
      <KpiCard label="CE signés" :value="data?.totaux.ceSignes ?? 0" />
      <KpiCard label="PMSMP" :value="data?.totaux.pmsmp ?? 0" />
      <KpiCard label="Demandes de suspension" :value="data?.totaux.suspensions ?? 0" />
      <KpiCard label="Taux d'absentéisme" :value="`${data?.totaux.tauxAbsenteisme ?? 0} %`" :hint="`${data?.totaux.totalAbsences ?? 0} absences / ${data?.totaux.slotsAbsences ?? 0} créneaux`" />
      <KpiCard label="FSE renseignés" :value="data?.totaux.fse ?? 0" />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <UCard>
        <template #header><h2 class="font-semibold">Orientations par CLPE et CIP</h2></template>
        <UTable :data="data?.orientationsParClpeCip || []" :columns="[
          { accessorKey: 'key', header: 'CLPE · CIP' },
          { accessorKey: 'count', header: 'Nombre' }
        ]" />
      </UCard>
      <UCard>
        <template #header><h2 class="font-semibold">Orientations par CIP</h2></template>
        <UTable :data="data?.orientationsParCip || []" :columns="[
          { accessorKey: 'key', header: 'CIP' },
          { accessorKey: 'count', header: 'Nombre' }
        ]" />
      </UCard>
      <UCard>
        <template #header><h2 class="font-semibold">Accompagnement effectif par CIP</h2></template>
        <UTable :data="data?.accompagnementParCip || []" :columns="[
          { accessorKey: 'key', header: 'CIP' },
          { accessorKey: 'count', header: 'Nombre' }
        ]" />
      </UCard>
      <UCard>
        <template #header><h2 class="font-semibold">Bilans de parcours</h2></template>
        <ul class="space-y-2 text-sm">
          <li class="flex justify-between"><span>Renouvellement</span><strong>{{ data?.bilans.renouvellement ?? 0 }}</strong></li>
          <li class="flex justify-between"><span>Réorientation FT</span><strong>{{ data?.bilans.reo_ft ?? 0 }}</strong></li>
          <li class="flex justify-between"><span>Tripartite</span><strong>{{ data?.bilans.tripartite ?? 0 }}</strong></li>
          <li class="flex justify-between border-t pt-2"><span>Total renseignés</span><strong>{{ data?.bilans.total ?? 0 }}</strong></li>
        </ul>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Liste des FSE renseignés</h2>
          <UButton size="sm" variant="outline" @click="downloadCsv('fse.csv', data?.listeFse || [])">Exporter CSV</UButton>
        </div>
      </template>
      <UTable :data="data?.listeFse || []" :columns="[
        { accessorKey: 'nom', header: 'Nom' },
        { accessorKey: 'prenom', header: 'Prénom' },
        { accessorKey: 'fseCode', header: 'FSE' },
        { accessorKey: 'cipNom', header: 'CIP' },
        { accessorKey: 'cds', header: 'CDS' },
        { accessorKey: 'statut', header: 'Statut' }
      ]" />
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Personnes par projet professionnel</h2></template>
      <div v-for="groupe in data?.projetsProfessionnels || []" :key="groupe.key" class="mb-4">
        <p class="mb-2 font-medium">{{ groupe.key }} ({{ groupe.personnes.length }})</p>
        <p class="text-sm text-slate-600">
          {{ groupe.personnes.map(p => `${p.prenom} ${p.nom}`).join(', ') || '—' }}
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Dispositifs sollicités par CIP et territoire</h2></template>
      <div v-for="d in data?.dispositifs || []" :key="d.nom" class="mb-4 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
        <p class="font-medium">{{ d.nom }} · {{ d.total }}</p>
        <p class="text-sm text-slate-500">
          CIP : {{ d.parCip.map(x => `${x.key} (${x.count})`).join(' · ') || '—' }}
        </p>
        <p class="text-sm text-slate-500">
          Territoire : {{ d.parTerritoire.map(x => `${x.key} (${x.count})`).join(' · ') || '—' }}
        </p>
      </div>
      <p v-if="!data?.dispositifs?.length" class="text-sm text-slate-500">Aucun dispositif renseigné.</p>
    </UCard>
  </div>
</template>
