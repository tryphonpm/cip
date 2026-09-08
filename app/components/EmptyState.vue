<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string
}>(), {
  icon: 'i-lucide-inbox'
})
</script>

<template>
  <div class="empty-state">
    <UIcon :name="icon" class="empty-state-icon" />
    <p class="empty-state-title">{{ title }}</p>
    <p v-if="description" class="empty-state-lead">{{ description }}</p>
  </div>
</template>
