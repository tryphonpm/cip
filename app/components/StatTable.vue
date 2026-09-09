<script setup lang="ts">
interface StatTableColumn {
  accessorKey: string
  header: string
}

withDefaults(defineProps<{
  title: string
  data: unknown[]
  columns: StatTableColumn[]
  empty?: string
}>(), {
  empty: 'Aucune donnée pour la période sélectionnée.'
})
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="section-title">{{ title }}</h2>
    </template>
    <EmptyState
      v-if="!data.length"
      :title="empty"
      icon="i-lucide-table"
    />
    <div v-else class="table-scroll">
      <UTable :data="data" :columns="columns" />
    </div>
  </UCard>
</template>
