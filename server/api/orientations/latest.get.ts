import { OrientationImport } from '../../models/OrientationImport'

export default defineEventHandler(async () => {
  const doc = await OrientationImport.findOne()
    .populate('importedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  if (!doc) return { import: null }

  return { import: toOrientationImportDetail(doc) }
})
