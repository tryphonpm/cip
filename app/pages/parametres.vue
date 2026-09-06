<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user } = useAuth()
const { data, refresh } = useFetch('/api/settings', { lazy: true })
const { data: users, refresh: refreshUsers } = useFetch('/api/users', {
  immediate: user.value?.role === 'admin',
  lazy: true
})

const delai = ref(15)
const projetsText = ref('')
const saved = ref(false)

watch(() => data.value?.settings, (s) => {
  if (!s) return
  delai.value = s.delaiPremierRdvJours
  projetsText.value = (s.projetsProfessionnels || []).join('\n')
}, { immediate: true })

async function saveSettings() {
  saved.value = false
  await $fetch('/api/settings', {
    method: 'PATCH',
    body: {
      delaiPremierRdvJours: delai.value,
      projetsProfessionnels: projetsText.value.split('\n').map(s => s.trim()).filter(Boolean)
    }
  })
  await refresh()
  saved.value = true
}

const newUser = reactive({ name: '', email: '', password: '', role: 'cip' as UserRole })
async function createUser() {
  await $fetch('/api/users', { method: 'POST', body: newUser })
  newUser.name = ''
  newUser.email = ''
  newUser.password = ''
  await refreshUsers()
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Paramètres</h1>
      <p class="text-slate-500">Règles d'alerte et comptes utilisateurs.</p>
    </div>

    <UCard>
      <template #header><h2 class="font-semibold">Délai du 1er rendez-vous</h2></template>
      <p class="mb-3 text-sm text-slate-500">
        Une alerte est créée si le 1er RDV n'est pas saisi, ou s'il a lieu plus de N jours après la date d'orientation.
      </p>
      <UFormField label="Seuil (jours calendaires)">
        <UInput v-model.number="delai" type="number" min="1" max="180" class="max-w-32" />
      </UFormField>
      <UFormField class="mt-4" label="Projets professionnels (un par ligne)">
        <UTextarea v-model="projetsText" :rows="6" class="w-full" />
      </UFormField>
      <div class="mt-4 flex items-center gap-3">
        <UButton :disabled="user?.role !== 'admin'" @click="saveSettings">Enregistrer</UButton>
        <span v-if="saved" class="text-sm text-teal-700">Enregistré. Les alertes ont été recalculées.</span>
      </div>
    </UCard>

    <UCard v-if="user?.role === 'admin'">
      <template #header><h2 class="font-semibold">Utilisateurs</h2></template>
      <UTable
        :data="users?.users || []"
        :columns="[
          { accessorKey: 'name', header: 'Nom' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'role', header: 'Rôle' }
        ]"
      />
      <form class="mt-6 grid gap-3 md:grid-cols-4" @submit.prevent="createUser">
        <UInput v-model="newUser.name" placeholder="Nom" />
        <UInput v-model="newUser.email" type="email" placeholder="Email" />
        <UInput v-model="newUser.password" type="password" placeholder="Mot de passe" />
        <USelect
          v-model="newUser.role"
          :items="[
            { label: 'Admin', value: 'admin' },
            { label: 'Coordinatrice', value: 'coordinatrice' },
            { label: 'CIP', value: 'cip' }
          ]"
          value-key="value"
          label-key="label"
        />
        <UButton type="submit" class="md:col-span-4">Ajouter un compte</UButton>
      </form>
    </UCard>
  </div>
</template>
