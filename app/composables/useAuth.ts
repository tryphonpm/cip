export function useAuth() {
  const user = useState<{ id: string, email: string, name: string, role: string } | null>('auth-user', () => null)

  async function fetchUser() {
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ user: typeof user.value }>('/api/auth/me')
      user.value = data.user
    }
    catch {
      user.value = null
    }
    return user.value
  }

  async function login(email: string, password: string) {
    const data = await $fetch<{ user: NonNullable<typeof user.value> }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    return data.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, fetchUser, login, logout }
}
