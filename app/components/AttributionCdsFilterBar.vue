<script setup lang="ts">
defineProps<{
  cdsUnassignedCount: number
  cipUnassignedCount: number
}>()

const filter = defineModel<AttributionCdsTableFilter>({ default: 'all' })
</script>

<template>
  <div class="attribution-filter-bar">
    <UButton
      size="sm"
      :variant="filter === 'cds' ? 'solid' : 'outline'"
      :color="filter === 'cds' ? 'primary' : 'neutral'"
      icon="i-lucide-building-2"
      @click="filter = 'cds'"
    >
      {{ attributionCdsFilterLabel(cdsUnassignedCount, 'CDS') }}
    </UButton>
    <UButton
      size="sm"
      :variant="filter === 'cip' ? 'solid' : 'outline'"
      :color="filter === 'cip' ? 'primary' : 'neutral'"
      icon="i-lucide-user-round"
      @click="filter = 'cip'"
    >
      {{ attributionCdsFilterLabel(cipUnassignedCount, 'CIP') }}
    </UButton>
    <UButton
      size="sm"
      :variant="filter === 'all' ? 'solid' : 'outline'"
      :color="filter === 'all' ? 'primary' : 'neutral'"
      icon="i-lucide-users"
      @click="filter = 'all'"
    >
      Toutes les personnes
    </UButton>
  </div>
</template>
