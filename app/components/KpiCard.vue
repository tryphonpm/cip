<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'danger' | 'success'
}>()
</script>

<template>
  <UCard :class="{
    'ring-1 ring-amber-300': tone === 'warning',
    'ring-1 ring-red-300': tone === 'danger',
    'ring-1 ring-teal-300': tone === 'success'
  }">
    <p class="text-xs uppercase tracking-wide text-slate-500">{{ label }}</p>
    <p class="mt-1 text-3xl font-semibold tabular-nums">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </UCard>
</template>
