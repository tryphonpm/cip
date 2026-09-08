import mongoose, { Schema } from 'mongoose'

const orientationColumnSchema = new Schema({
  nom: { type: String, required: true },
  type: {
    type: String,
    enum: ['string', 'date', 'integer', 'mail'],
    required: true
  }
}, { _id: false })

const orientationImportSchema = new Schema({
  filename: { type: String, required: true },
  importedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  ligne1: { type: String, default: '' },
  ligne2: { type: String, default: '' },
  documentDate: { type: Date, default: null },
  sheetName: { type: String, default: '' },
  columns: { type: [orientationColumnSchema], default: [] },
  keys: { type: [String], default: [] },
  rowCount: { type: Number, default: 0 },
  warnings: { type: [String], default: [] },
  // Mixed justifié : les colonnes suivent le canevas CD Ain (évolutif), une ligne = un objet clé/valeur.
  data: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: true })

orientationImportSchema.index({ createdAt: -1 })
orientationImportSchema.index({ documentDate: -1 })

export const OrientationImport = mongoose.models.OrientationImport
  || mongoose.model('OrientationImport', orientationImportSchema)
