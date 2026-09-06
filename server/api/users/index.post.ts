import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
  if (event.context.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Réservé à l\'administration' })
  }
  const body = await readBody<{ email?: string, name?: string, password?: string, role?: UserRole }>(event)
  const email = String(body.email || '').trim().toLowerCase()
  const name = String(body.name || '').trim()
  const password = String(body.password || '')
  const role = (body.role || 'cip') as UserRole

  if (!email || !name || password.length < 4) {
    throw createError({ statusCode: 400, message: 'Nom, email et mot de passe (4 caractères min.) requis' })
  }

  const user = await User.create({
    email,
    name,
    passwordHash: await hashPassword(password),
    role
  })

  return {
    user: { id: user._id, email: user.email, name: user.name, role: user.role }
  }
})
