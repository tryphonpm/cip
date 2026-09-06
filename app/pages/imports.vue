<script setup lang="ts">
const { data, refresh } = await useFetch('/api/imports')
const file = ref<File | null>(null)
const pending = ref(false)
const result = ref<Record<string, unknown> | null>(null)
const error = ref('')

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

async function upload() {
  if (!file.value) return
  pending.value = true
  error.value = ''
  result.value = null
  try {
    const body = new FormData()
    body.append('file', file.value)
    const dataRes = await $fetch<{ batch: Record<string, unknown> }>('/api/imports', {
      method: 'POST',
      body
    })
    result.value = dataRes.batch
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.message || err.data?.message || 'Import impossible'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Imports</h1>
      <p class="text-slate-500">Déposez un fichier reporting CIP au format .xlsx (modèle Céline).</p>
    </div>

    <UCard>
      <div class="space-y-4">
        <input type="file" accept=".xlsx" class="block text-sm" @change="onFile">
        <UButton :disabled="!file" :loading="pending" @click="upload">
          Importer le fichier
        </UButton>
        <UAlert v-if="error" color="error" :title="error" />
        <div v-if="result" class="rounded-lg bg-teal-50 p-4 text-sm dark:bg-teal-950">
          <p class="font-medium">Import réussi · {{ (result.structure as { nom?: string })?.nom }}</p>
          <p class="mt-1">{{ JSON.stringify(result.counts) }}</p>
          <ul v-if="(result.warnings as string[])?.length" class="mt-2 list-disc pl-5 text-amber-800">
            <li v-for="w in (result.warnings as string[]).slice(0, 10)" :key="w">{{ w }}</li>
          </ul>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Historique</h2></template>
      <UTable
        :data="data?.batches || []"
        :columns="[
          { accessorKey: 'filename', header: 'Fichier' },
          { accessorKey: 'createdAt', header: 'Date' },
          { accessorKey: 'counts.upserted', header: 'Fiches' }
        ]"
      >
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
          <span class="text-slate-400"> {{ new Date(row.original.createdAt).toLocaleTimeString('fr-FR') }}</span>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
