import { Settings } from '../models/Settings'

export default defineEventHandler(async () => {
  const settings = await Settings.findOne({ key: APP_SETTINGS_KEY }).lean()
  return { settings: toAppSettings(settings) }
})
