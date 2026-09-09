<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { user } = useAuth()
const { data: users, refresh: refreshUsers } = useFetch('/api/users', {
  immediate: user.value?.role === 'admin',
  lazy: true
})

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
  <div class="page-stack">
    <PageHeader
      title="Comptes"
      lead="Gestion des accès à l'application."
    />

    <UCard v-if="user?.role === 'admin'">
      <template #header>
        <h2 class="section-title">Utilisateurs</h2>
      </template>
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
    <UAlert
      v-else
      color="warning"
      title="Accès restreint"
      description="La gestion des comptes est réservée à l'administration."
    />
  </div>
</template>
