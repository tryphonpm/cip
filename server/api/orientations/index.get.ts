import { OrientationImport } from '../../models/OrientationImport'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requested = Number(query.limit)
  const limit = Number.isFinite(requested)
    ? Math.min(100, Math.max(1, Math.trunc(requested)))
    : 100

  const docs = await OrientationImport.find()
    .select('-data')
    .populate('importedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return {
    imports: docs.map((doc: OrientationImportSource) => toOrientationImportSummary(doc))
  }
})
