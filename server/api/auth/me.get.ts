export default defineEventHandler(async (event) => {
  const user = event.context.user
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  }
})
