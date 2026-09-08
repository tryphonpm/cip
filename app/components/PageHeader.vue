<script setup lang="ts">
defineProps<{
  title: string
  lead?: string
}>()
</script>

<template>
  <div>
    <h1 class="page-title">{{ title }}</h1>
    <p v-if="lead" class="page-lead">{{ lead }}</p>
  </div>
</template>
