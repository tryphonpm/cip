import mongoose, { Schema } from 'mongoose'

const alertSchema = new Schema({
  beneficiaireId: { type: Schema.Types.ObjectId, ref: 'Beneficiaire', required: true, index: true },
  structureId: { type: Schema.Types.ObjectId, ref: 'Structure', required: true },
  type: {
    type: String,
    enum: ['delai_premier_rdv', 'absence_ce', 'absence_dates_bilan', 'absence_fse', 'absence_bilan'],
    required: true
  },
  message: { type: String, required: true },
  severity: { type: String, enum: ['warning', 'danger'], default: 'warning' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true })

alertSchema.index({ beneficiaireId: 1, type: 1 }, { unique: true })

export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema)
