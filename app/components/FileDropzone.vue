<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  description?: string
  accept?: string
  disabled?: boolean
}>(), {
  label: 'Glissez-déposez le fichier Excel ici',
  description: 'ou cliquez pour parcourir vos dossiers (fichier .xlsx uniquement)',
  accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
})

const file = defineModel<File | null>({ default: null })

function onUpdate(value: File | File[] | null | undefined) {
  if (Array.isArray(value)) {
    file.value = value[0] ?? null
    return
  }
  file.value = value ?? null
}
</script>

<template>
  <UFileUpload
    :model-value="file ?? undefined"
    :accept="accept"
    :label="label"
    :description="description"
    :disabled="disabled"
    icon="i-lucide-file-spreadsheet"
    variant="area"
    size="lg"
    class="file-dropzone"
    @update:model-value="onUpdate"
  />
</template>
