import mongoose, { Schema } from 'mongoose'

const beneficiaireSchema = new Schema({
  structureId: { type: Schema.Types.ObjectId, ref: 'Structure', required: true, index: true },
  cipNom: { type: String, default: '' },
  clpe: { type: String, default: '' },
  territoire: { type: String, default: '' },
  civilite: { type: String, default: '' },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  nomNormalise: { type: String, required: true },
  prenomNormalise: { type: String, required: true },
  age: { type: Number, default: null },
  niveauScolaire: { type: String, default: '' },
  cds: { type: String, default: '' },
  statut: { type: String, enum: ['actif', 'sortie'], default: 'actif', index: true },
  dateOrientation: { type: Date, default: null },
  datePremierRdv: { type: Date, default: null },
  ceSigne6: { type: Date, default: null },
  finCe6: { type: Date, default: null },
  ceSigne12: { type: Date, default: null },
  finCe12: { type: Date, default: null },
  dateSortie: { type: Date, default: null },
  bilanType: { type: String, enum: ['renouvellement', 'reo_ft', 'tripartite', null], default: null },
  bilanDate7: { type: Date, default: null },
  bilanDate14: { type: Date, default: null },
  freins: { type: [String], default: [] },
  offresEmploi: { type: Number, default: null },
  entretiensRecrutement: { type: Number, default: null },
  pmsmp: { type: Boolean, default: false },
  motifSortie: { type: String, default: '' },
  motifReo: { type: String, default: '' },
  typeSortie: { type: String, default: '' },
  fseCode: { type: String, default: '' },
  dispositifs: {
    type: [{
      nom: String,
      valeur: String
    }],
    default: []
  },
  commentaires: { type: String, default: '' },
  projetProfessionnel: { type: String, default: '' },
  absences: {
    avantCe1: { type: Number, default: 0 },
    avantCe2: { type: Number, default: 0 },
    mois: { type: [Number], default: () => Array.from({ length: 12 }, () => 0) }
  },
  suspensions: {
    demande: { type: Boolean, default: false },
    dateDemande: { type: Date, default: null },
    dateCourrierCds: { type: Date, default: null },
    manifeste: { type: Boolean, default: null }
  },
  lastImportBatchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', default: null }
}, { timestamps: true })

beneficiaireSchema.index({ structureId: 1, nomNormalise: 1, prenomNormalise: 1 }, { unique: true })

export const Beneficiaire = mongoose.models.Beneficiaire || mongoose.model('Beneficiaire', beneficiaireSchema)
