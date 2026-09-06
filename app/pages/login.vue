<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const email = ref('admin@cip.local')
const password = ref('admin')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await login(email.value, password.value)
    await navigateTo('/')
  }
  catch (e: unknown) {
    const err = e as { message?: string, data?: { message?: string } }
    error.value = err.message || err.data?.message || 'Connexion impossible'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <p class="text-xs font-semibold uppercase tracking-widest text-teal-700">ALFA3A</p>
      <h1 class="text-xl font-semibold">Connexion CIP+</h1>
      <p class="text-sm text-slate-500">Statistiques et alertes d'accompagnement RSA</p>
    </template>
    <form class="space-y-4" @submit.prevent="submit">
      <UFormField label="Email">
        <UInput v-model="email" type="email" autocomplete="username" class="w-full" />
      </UFormField>
      <UFormField label="Mot de passe">
        <UInput v-model="password" type="password" autocomplete="current-password" class="w-full" />
      </UFormField>
      <UAlert v-if="error" color="error" :title="error" />
      <UButton type="submit" block :loading="pending">
        Se connecter
      </UButton>
    </form>
  </UCard>
</template>
