<script setup lang="ts">
const { user, logout } = useAuth()
const route = useRoute()

onMounted(() => {
  // #region agent log
  fetch('http://127.0.0.1:7533/ingest/71991fc5-0344-424f-94ec-bddb6bd94748', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1a4834' },
    body: JSON.stringify({
      sessionId: '1a4834',
      runId: 'pre-fix',
      hypothesisId: 'H3',
      location: 'layouts/default.vue',
      message: 'default layout mounted',
      data: { path: route.path, hasUser: Boolean(user.value) },
      timestamp: Date.now()
    })
  }).catch(() => {})
  // #endregion
})

const links = [
  { label: 'Tableau de bord', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Statistiques', to: '/statistiques', icon: 'i-lucide-chart-column' },
  { label: 'Alertes', to: '/alertes', icon: 'i-lucide-triangle-alert' },
  { label: 'Bénéficiaires', to: '/beneficiaires', icon: 'i-lucide-users' },
  { label: 'Imports', to: '/imports', icon: 'i-lucide-file-up' },
  { label: 'Paramètres', to: '/parametres', icon: 'i-lucide-settings' }
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <div class="flex min-h-screen">
      <aside class="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
        <div class="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <p class="text-xs font-semibold uppercase tracking-widest text-teal-700">ALFA3A</p>
          <h1 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">CIP+</h1>
          <p class="text-xs text-slate-500">Statistiques et alertes</p>
        </div>
        <nav class="flex flex-1 flex-col gap-1 p-3">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            :class="route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to))
              ? 'bg-teal-50 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200'
              : ''"
          >
            <UIcon :name="link.icon" class="size-4" />
            {{ link.label }}
          </NuxtLink>
        </nav>
        <div class="border-t border-slate-200 p-4 dark:border-slate-800">
          <p class="truncate text-sm font-medium">{{ user?.name }}</p>
          <p class="truncate text-xs text-slate-500">{{ user?.email }}</p>
          <UButton class="mt-3" block color="neutral" variant="outline" size="sm" @click="logout">
            Déconnexion
          </UButton>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <span class="font-semibold">CIP+</span>
          <UButton color="neutral" variant="ghost" size="sm" @click="logout">Sortir</UButton>
        </header>
        <nav class="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="whitespace-nowrap rounded-full px-3 py-1 text-xs"
            :class="route.path === link.to ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
        <main class="flex-1 p-4 md:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
