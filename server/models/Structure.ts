import mongoose, { Schema } from 'mongoose'

const structureSchema = new Schema({
  nom: { type: String, required: true },
  cipNom: { type: String, required: true, index: true },
  territoire: { type: String, default: '' },
  clpe: { type: String, default: '' },
  lot: { type: String, default: '' },
  operateur: { type: String, default: '' },
  key: { type: String, required: true, unique: true }
}, { timestamps: true })

export const Structure = mongoose.models.Structure || mongoose.model('Structure', structureSchema)
