import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
  if (event.context.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Réservé à l\'administration' })
  }
  const users = await User.find().select('-passwordHash').sort({ createdAt: 1 }).lean()
  return { users }
})
