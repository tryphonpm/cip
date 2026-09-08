import { readFileSync } from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import { SalariesCip } from '../models/SalariesCip'

interface ExtendedJsonObjectId {
  $oid: string
}

interface SalariesCipJsonItem {
  _id?: ExtendedJsonObjectId
  MATRICULE: number
  identite: SalariesCip['identite']
  manager: SalariesCip['manager']
  structure: SalariesCip['structure']
  emploi: SalariesCip['emploi']
  ldap?: SalariesCip['ldap']
  CDS?: string
}

function salariesCipFilePath() {
  return path.resolve(process.cwd(), 'CDC/GDSI.salariesCorinne.json')
}

function toDocumentId(value: ExtendedJsonObjectId | undefined) {
  if (!value?.$oid || !mongoose.Types.ObjectId.isValid(value.$oid)) return undefined
  return new mongoose.Types.ObjectId(value.$oid)
}

function toDocument(item: SalariesCipJsonItem) {
  const doc: Record<string, unknown> = {
    MATRICULE: item.MATRICULE,
    identite: item.identite,
    manager: item.manager,
    structure: item.structure,
    emploi: item.emploi,
    ldap: item.ldap || { MAIL_PRO: '' },
    CDS: item.CDS || ''
  }
  const id = toDocumentId(item._id)
  if (id) doc._id = id
  return doc
}

export async function importSalariesCipFromFile(options: { force?: boolean } = {}) {
  const filePath = salariesCipFilePath()
  const raw = readFileSync(filePath, 'utf8')
  const items = JSON.parse(raw) as SalariesCipJsonItem[]

  if (!Array.isArray(items) || !items.length) {
    throw new Error('Le fichier GDSI.salariesCorinne.json ne contient aucun salarié.')
  }

  const existing = await SalariesCip.countDocuments()
  if (existing > 0 && !options.force) {
    return { imported: 0, total: existing, skipped: true }
  }

  if (options.force) {
    await SalariesCip.deleteMany({})
  }

  const docs = items.map(toDocument)
  await SalariesCip.insertMany(docs, { ordered: true })

  return {
    imported: docs.length,
    total: docs.length,
    skipped: false
  }
}
