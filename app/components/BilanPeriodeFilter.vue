<script setup lang="ts">
const semestre = defineModel<string>({ default: ALL_SEMESTRES })

defineProps<{
  items: { label: string, value: string }[]
}>()
</script>

<template>
  <UFormField label="Période / semestre" class="periode-filter">
    <USelect
      v-model="semestre"
      :items="items"
      value-key="value"
      label-key="label"
    />
  </UFormField>
</template>
