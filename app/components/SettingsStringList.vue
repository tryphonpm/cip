<script setup lang="ts">
const items = defineModel<string[]>({ required: true })

withDefaults(defineProps<{
  disabled?: boolean
  placeholder?: string
  addLabel?: string
}>(), {
  placeholder: 'Nouvelle valeur',
  addLabel: 'Ajouter une valeur'
})

function addItem() {
  items.value = [...items.value, '']
}

function removeItem(index: number) {
  items.value = items.value.filter((_, current) => current !== index)
}

function updateItem(index: number, value: string) {
  const next = [...items.value]
  next[index] = value
  items.value = next
}

function moveItem(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= items.value.length) return
  const next = [...items.value]
  const [row] = next.splice(index, 1)
  if (row === undefined) return
  next.splice(target, 0, row)
  items.value = next
}
</script>

<template>
  <div class="settings-list">
    <EmptyState
      v-if="!items.length"
      title="Aucune valeur"
      description="Ajoutez une entrée pour constituer cette liste."
      icon="i-lucide-list"
    />
    <div
      v-for="(item, index) in items"
      :key="index"
      class="settings-list-row"
    >
      <UInput
        class="settings-list-input"
        :model-value="item"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:model-value="updateItem(index, String($event ?? ''))"
      />
      <UButton
        icon="i-lucide-chevron-up"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="disabled || index === 0"
        aria-label="Monter"
        @click="moveItem(index, -1)"
      />
      <UButton
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="disabled || index === items.length - 1"
        aria-label="Descendre"
        @click="moveItem(index, 1)"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="disabled"
        aria-label="Retirer"
        @click="removeItem(index)"
      />
    </div>
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      :disabled="disabled"
      @click="addItem"
    >
      {{ addLabel }}
    </UButton>
  </div>
</template>
