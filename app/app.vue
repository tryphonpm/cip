<script setup lang="ts">
const route = useRoute()

useHead({
  htmlAttrs: { lang: 'fr' },
  title: 'CIP+ · Statistiques et alertes'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :page-key="route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>
