import mongoose, { Schema } from 'mongoose'

const importBatchSchema = new Schema({
  filename: { type: String, required: true },
  structureId: { type: Schema.Types.ObjectId, ref: 'Structure', required: true },
  importedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  counts: {
    actifs: { type: Number, default: 0 },
    sorties: { type: Number, default: 0 },
    absences: { type: Number, default: 0 },
    bilans: { type: Number, default: 0 },
    upserted: { type: Number, default: 0 }
  },
  warnings: { type: [String], default: [] },
  unknownColumns: { type: [String], default: [] }
}, { timestamps: true })

export const ImportBatch = mongoose.models.ImportBatch || mongoose.model('ImportBatch', importBatchSchema)
