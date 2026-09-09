<script setup lang="ts">
const mappingDoc = defineModel<MappingImportBeneficiaire>({ required: true })

defineProps<{
  disabled?: boolean
}>()

const titre = computed(() => mappingImportMetaText(mappingDoc.value.meta, 'titre'))
const objet = computed(() => mappingImportMetaText(mappingDoc.value.meta, 'objet'))

function fieldValue(item: MappingImportBeneficiaireItem, key: keyof MappingImportBeneficiaireItem): string {
  const value = item[key]
  return typeof value === 'string' ? value : ''
}

function updateField(index: number, key: keyof MappingImportBeneficiaireItem, value: string) {
  const next = mappingDoc.value.mapping.map((item, current) => (
    current === index ? { ...item, [key]: value } : item
  ))
  mappingDoc.value = { ...mappingDoc.value, mapping: next }
}

function addRow() {
  mappingDoc.value = {
    ...mappingDoc.value,
    mapping: [
      ...mappingDoc.value.mapping,
      {
        cleBeneficiaire: '',
        cleOrientation: '',
        formatBeneficiaire: '',
        formatOrientation: '',
        Descriptif: ''
      }
    ]
  }
}

function removeRow(index: number) {
  mappingDoc.value = {
    ...mappingDoc.value,
    mapping: mappingDoc.value.mapping.filter((_, current) => current !== index)
  }
}
</script>

<template>
  <div class="settings-mapping">
    <p v-if="titre" class="section-title">{{ titre }}</p>
    <p v-if="objet" class="page-lead">{{ objet }}</p>
    <EmptyState
      v-if="!mappingDoc.mapping.length"
      title="Aucune correspondance"
      description="Ajoutez une ligne pour relier une clé bénéficiaire à une clé d'orientation."
      icon="i-lucide-arrow-left-right"
    />
    <div v-else class="table-scroll">
      <table class="settings-mapping-table">
        <thead>
          <tr>
            <th class="settings-mapping-head">Clé bénéficiaire</th>
            <th class="settings-mapping-head">Clé orientation</th>
            <th class="settings-mapping-head">Format bénéficiaire</th>
            <th class="settings-mapping-head">Format orientation</th>
            <th class="settings-mapping-head">Descriptif</th>
            <th class="settings-mapping-head settings-mapping-actions">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in mappingDoc.mapping"
            :key="index"
          >
            <td class="settings-mapping-cell">
              <UInput
                class="settings-mapping-key"
                :model-value="fieldValue(item, 'cleBeneficiaire')"
                :disabled="disabled"
                @update:model-value="updateField(index, 'cleBeneficiaire', String($event ?? ''))"
              />
            </td>
            <td class="settings-mapping-cell">
              <UInput
                class="settings-mapping-key"
                :model-value="fieldValue(item, 'cleOrientation')"
                :disabled="disabled"
                @update:model-value="updateField(index, 'cleOrientation', String($event ?? ''))"
              />
            </td>
            <td class="settings-mapping-cell">
              <UInput
                class="settings-mapping-format"
                :model-value="fieldValue(item, 'formatBeneficiaire')"
                :disabled="disabled"
                @update:model-value="updateField(index, 'formatBeneficiaire', String($event ?? ''))"
              />
            </td>
            <td class="settings-mapping-cell">
              <UInput
                class="settings-mapping-format"
                :model-value="fieldValue(item, 'formatOrientation')"
                :disabled="disabled"
                @update:model-value="updateField(index, 'formatOrientation', String($event ?? ''))"
              />
            </td>
            <td class="settings-mapping-cell">
              <UTextarea
                class="settings-mapping-desc"
                :model-value="fieldValue(item, 'Descriptif')"
                :rows="2"
                :disabled="disabled"
                @update:model-value="updateField(index, 'Descriptif', String($event ?? ''))"
              />
            </td>
            <td class="settings-mapping-cell">
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="disabled"
                aria-label="Retirer la correspondance"
                @click="removeRow(index)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      :disabled="disabled"
      @click="addRow"
    >
      Ajouter une correspondance
    </UButton>
  </div>
</template>
