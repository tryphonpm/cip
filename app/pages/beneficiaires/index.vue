<script setup lang="ts">
const q = ref('')
const cip = ref('')
const clpe = ref('')
const cds = ref('')
const statut = ref('')

const query = computed(() => ({
  q: q.value || undefined,
  cip: cip.value || undefined,
  clpe: clpe.value || undefined,
  cds: cds.value || undefined,
  statut: statut.value || undefined
}))

const { data, refresh } = await useFetch('/api/beneficiaires', { query })
watch(query, () => refresh())

const rows = computed(() => (data.value?.beneficiaires || []).map(b => ({
  ...b,
  identite: `${b.prenom} ${b.nom}`,
  orientation: formatDate(b.dateOrientation),
  rdv: formatDate(b.datePremierRdv)
})))
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Bénéficiaires</h1>
      <p class="text-slate-500">{{ data?.total ?? 0 }} fiche(s).</p>
    </div>
    <UInput v-model="q" icon="i-lucide-search" placeholder="Nom, prénom ou code FSE" class="max-w-md" />
    <FilterBar v-model:cip="cip" v-model:clpe="clpe" v-model:cds="cds" v-model:statut="statut" />
    <UCard>
      <UTable
        :data="rows"
        :columns="[
          { accessorKey: 'identite', header: 'Personne' },
          { accessorKey: 'cipNom', header: 'CIP' },
          { accessorKey: 'cds', header: 'CDS' },
          { accessorKey: 'statut', header: 'Statut' },
          { accessorKey: 'fseCode', header: 'FSE' },
          { accessorKey: 'projetProfessionnel', header: 'Projet pro.' },
          { accessorKey: 'orientation', header: 'Orientation' }
        ]"
      >
        <template #identite-cell="{ row }">
          <NuxtLink :to="`/beneficiaires/${row.original._id}`" class="font-medium text-teal-800 hover:underline">
            {{ row.original.identite }}
          </NuxtLink>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
