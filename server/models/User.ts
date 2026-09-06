import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'coordinatrice', 'cip'], default: 'admin' },
  structureIds: [{ type: Schema.Types.ObjectId, ref: 'Structure' }]
}, { timestamps: true })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
