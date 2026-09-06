import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email et mot de passe requis' })
  }

  await connectDb()
  const user = await User.findOne({ email })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, message: 'Identifiants incorrects' })
  }

  setSessionCookie(event, String(user._id))
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  }
})
