import { Settings } from '../models/Settings'

export default defineEventHandler(async () => {
  const settings = await Settings.findOne({ key: 'app' }).lean()
  return { settings }
})
