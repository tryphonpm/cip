<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

const calendarValue = computed({
  get(): CalendarDate | undefined {
    if (!props.modelValue) return undefined
    try {
      return parseDate(props.modelValue)
    }
    catch {
      return undefined
    }
  },
  set(value: CalendarDate | undefined) {
    if (!value) {
      emit('update:modelValue', '')
      return
    }
    const month = String(value.month).padStart(2, '0')
    const day = String(value.day).padStart(2, '0')
    emit('update:modelValue', `${value.year}-${month}-${day}`)
    open.value = false
  }
})

const label = computed(() =>
  calendarValue.value
    ? df.format(calendarValue.value.toDate(getLocalTimeZone()))
    : 'À renseigner'
)

function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-calendar"
      :disabled="disabled"
      :class="['date-picker-button', { 'select-unassigned': !modelValue }]"
    >
      {{ label }}
    </UButton>

    <template #content>
      <div class="date-picker-panel">
        <UCalendar v-model="calendarValue" class="p-2" />
        <div class="date-picker-actions">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-eraser"
            :disabled="!modelValue"
            @click="clearDate"
          >
            Effacer
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
