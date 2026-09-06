import { ImportBatch } from '../../models/ImportBatch'

export default defineEventHandler(async () => {
  const batches = await ImportBatch.find()
    .populate('structureId', 'nom cipNom clpe')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  return { batches }
})
