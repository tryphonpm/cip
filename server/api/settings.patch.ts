import { Settings } from '../models/Settings'

export default defineEventHandler(async (event) => {
  if (event.context.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Réservé à l\'administration' })
  }

  const patch = pickAppSettingsPatch(await readBody(event))
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, message: 'Aucune modification valide.' })
  }

  let settings = await Settings.findOne({ key: APP_SETTINGS_KEY })
  if (!settings) {
    settings = new Settings({ key: APP_SETTINGS_KEY })
  }

  const delaiChanged = patch.delaiPremierRdvJours !== undefined
    && patch.delaiPremierRdvJours !== settings.delaiPremierRdvJours

  if (patch.delaiPremierRdvJours !== undefined) {
    settings.delaiPremierRdvJours = patch.delaiPremierRdvJours
  }
  for (const key of APP_SETTINGS_STRING_LIST_KEYS) {
    const list = patch[key]
    if (list !== undefined) settings.set(key, list)
  }
  if (patch.mapping_import_beneficiaire !== undefined) {
    settings.set('mapping_import_beneficiaire', patch.mapping_import_beneficiaire)
    settings.markModified('mapping_import_beneficiaire')
  }

  await settings.save()

  if (delaiChanged) {
    await recomputeAlerts()
  }

  return { settings: toAppSettings(settings.toObject()) }
})
