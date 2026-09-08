import mongoose, { Schema } from 'mongoose'

const identiteSchema = new Schema({
  SA_NOM: { type: String, required: true },
  SA_PRENOM: { type: String, required: true },
  NOM_AFFICHAGE: { type: String, required: true }
}, { _id: false })

const managerSchema = new Schema({
  MANAGER: { type: Number, required: true },
  complements_post: {
    DISPLAY_NAME: { type: String, default: '' }
  }
}, { _id: false })

const structureSchema = new Schema({
  RQCODE: { type: String, default: '' },
  RQTITLE_FR: { type: String, default: '' }
}, { _id: false })

const emploiSchema = new Schema({
  IDPOSTE: { type: String, default: '' },
  FAMILLEEMPLOI: { type: String, default: '' },
  CODESSFAMEMPLOI: { type: String, default: '' },
  CODEFAMEMPLOI: { type: String, default: '' }
}, { _id: false })

const ldapSchema = new Schema({
  MAIL_PRO: { type: String, default: '' }
}, { _id: false })

const salariesCipSchema = new Schema({
  MATRICULE: { type: Number, required: true, unique: true },
  identite: { type: identiteSchema, required: true },
  manager: { type: managerSchema, required: true },
  structure: { type: structureSchema, required: true },
  emploi: { type: emploiSchema, required: true },
  ldap: { type: ldapSchema, default: () => ({}) },
  CDS: { type: String, default: '' }
}, { timestamps: true })

salariesCipSchema.index({ 'identite.NOM_AFFICHAGE': 1 })
salariesCipSchema.index({ CDS: 1 })

export const SalariesCip = mongoose.models.SalariesCip
  || mongoose.model('SalariesCip', salariesCipSchema, 'salaries_cip')
