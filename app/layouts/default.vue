<script setup lang="ts">
const { user, logout } = useAuth()
const route = useRoute()

interface NavLink {
  label: string
  to: string
  icon: string
  children?: { label: string, to: string }[]
}

const links: NavLink[] = [
  { label: 'Tableau de bord', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Statistiques', to: '/statistiques', icon: 'i-lucide-chart-column' },
  { label: 'Alertes', to: '/alertes', icon: 'i-lucide-triangle-alert' },
  { label: 'Bénéficiaires', to: '/beneficiaires', icon: 'i-lucide-users' },
  {
    label: 'Orientations',
    to: '/orientations',
    icon: 'i-lucide-user-plus',
    children: [
      { label: 'Import quotidien', to: '/orientations' },
      { label: 'Attribution CDS', to: '/orientations/attribution_cds' }
    ]
  },
  { label: 'Imports', to: '/imports', icon: 'i-lucide-file-up' },
  { label: 'Paramètres', to: '/parametres', icon: 'i-lucide-settings' }
]

function isActiveLink(to: string, exact = false): boolean {
  if (exact) return route.path === to
  return route.path === to || (to !== '/' && route.path.startsWith(`${to}/`))
}

function isSectionActive(link: NavLink): boolean {
  if (isActiveLink(link.to)) return true
  return link.children?.some(child => isActiveLink(child.to)) ?? false
}
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
          <template v-for="link in links" :key="link.to">
            <NuxtLink
              v-if="!link.children?.length"
              :to="link.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              :class="isActiveLink(link.to)
                ? 'bg-teal-50 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                : ''"
            >
              <UIcon :name="link.icon" class="size-4" />
              {{ link.label }}
            </NuxtLink>
            <div v-else class="space-y-1">
              <p
                class="flex items-center gap-3 px-3 py-2 text-sm font-medium"
                :class="isSectionActive(link)
                  ? 'text-teal-800 dark:text-teal-200'
                  : 'text-slate-700 dark:text-slate-300'"
              >
                <UIcon :name="link.icon" class="size-4" />
                {{ link.label }}
              </p>
              <NuxtLink
                v-for="child in link.children"
                :key="child.to"
                :to="child.to"
                class="ml-7 flex items-center rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                :class="isActiveLink(child.to, true)
                  ? 'bg-teal-50 font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                  : ''"
              >
                {{ child.label }}
              </NuxtLink>
            </div>
          </template>
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
          <template v-for="link in links" :key="link.to">
            <NuxtLink
              v-if="!link.children?.length"
              :to="link.to"
              class="whitespace-nowrap rounded-full px-3 py-1 text-xs"
              :class="isActiveLink(link.to) ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'"
            >
              {{ link.label }}
            </NuxtLink>
            <template v-else>
              <NuxtLink
                v-for="child in link.children"
                :key="child.to"
                :to="child.to"
                class="whitespace-nowrap rounded-full px-3 py-1 text-xs"
                :class="isActiveLink(child.to, true) ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'"
              >
                {{ child.label }}
              </NuxtLink>
            </template>
          </template>
        </nav>
        <main class="flex-1 p-4 md:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
