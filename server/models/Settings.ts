import mongoose, { Schema } from 'mongoose'

const settingsSchema = new Schema({
  key: { type: String, required: true, unique: true, default: 'app' },
  delaiPremierRdvJours: { type: Number, default: 15 },
  projetsProfessionnels: { type: [String], default: [] },
  motifsSortie: { type: [String], default: [] },
  typesSortiePositive: { type: [String], default: [] },
  motifsReo: { type: [String], default: [] },
  dispositifs: { type: [String], default: [] },
  cds: { type: [String], default: [] },
  // Mixed justifié : référentiel JSON évolutif (mapping clé à clé orientationimports → beneficiaires).
  mapping_import_beneficiaire: { type: Schema.Types.Mixed, default: null }
}, { timestamps: true })

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema)
