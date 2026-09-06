import { Structure } from '../../models/Structure'
import { Beneficiaire } from '../../models/Beneficiaire'
import { ImportBatch } from '../../models/ImportBatch'
import { Settings } from '../../models/Settings'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, message: 'Fichier Excel manquant' })
  }

  const filename = file.filename || 'reporting.xlsx'
  if (!/\.xlsx$/i.test(filename)) {
    throw createError({ statusCode: 400, message: 'Seuls les fichiers .xlsx sont acceptés' })
  }

  const parsed = await parseCipWorkbook(file.data)
  if (!parsed.personnes.length) {
    throw createError({ statusCode: 422, message: 'Aucune fiche bénéficiaire reconnue dans ce fichier' })
  }

  const structure = await Structure.findOneAndUpdate(
    { key: parsed.meta.key },
    {
      nom: parsed.meta.nom,
      cipNom: parsed.meta.cipNom,
      territoire: parsed.meta.territoire,
      clpe: parsed.meta.clpe,
      lot: parsed.meta.lot,
      operateur: parsed.meta.operateur,
      key: parsed.meta.key
    },
    { upsert: true, new: true }
  )

  const batch = await ImportBatch.create({
    filename,
    structureId: structure._id,
    importedBy: event.context.user?._id,
    counts: parsed.counts,
    warnings: parsed.warnings,
    unknownColumns: parsed.unknownColumns
  })

  let upserted = 0
  for (const person of parsed.personnes) {
    const existing = await Beneficiaire.findOne({
      structureId: structure._id,
      nomNormalise: person.nomNormalise,
      prenomNormalise: person.prenomNormalise
    })

    const payload = {
      structureId: structure._id,
      cipNom: parsed.meta.cipNom,
      clpe: parsed.meta.clpe,
      territoire: parsed.meta.territoire,
      civilite: person.civilite,
      nom: person.nom,
      prenom: person.prenom,
      nomNormalise: person.nomNormalise,
      prenomNormalise: person.prenomNormalise,
      age: person.age,
      niveauScolaire: person.niveauScolaire,
      cds: person.cds,
      statut: person.statut,
      dateOrientation: person.dateOrientation,
      datePremierRdv: person.datePremierRdv,
      ceSigne6: person.ceSigne6,
      finCe6: person.finCe6,
      ceSigne12: person.ceSigne12,
      finCe12: person.finCe12,
      dateSortie: person.dateSortie,
      bilanType: person.bilanType,
      bilanDate7: person.bilanDate7,
      bilanDate14: person.bilanDate14,
      freins: person.freins,
      offresEmploi: person.offresEmploi,
      entretiensRecrutement: person.entretiensRecrutement,
      pmsmp: person.pmsmp,
      motifSortie: person.motifSortie,
      motifReo: person.motifReo,
      typeSortie: person.typeSortie,
      fseCode: person.fseCode,
      dispositifs: person.dispositifs,
      commentaires: person.commentaires,
      absences: person.absences,
      suspensions: {
        demande: person.suspensions.demande,
        dateDemande: person.suspensions.dateDemande,
        dateCourrierCds: person.suspensions.dateCourrierCds,
        manifeste: person.suspensions.manifeste
      },
      lastImportBatchId: batch._id,
      projetProfessionnel: existing?.projetProfessionnel || ''
    }

    await Beneficiaire.findOneAndUpdate(
      {
        structureId: structure._id,
        nomNormalise: person.nomNormalise,
        prenomNormalise: person.prenomNormalise
      },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    upserted += 1
  }

  batch.counts.upserted = upserted
  await batch.save()

  const settings = await Settings.findOne({ key: 'app' })
  if (settings) {
    const mergeUniq = (current: string[], extra: string[]) => [...new Set([...current, ...extra.filter(Boolean)])]
    settings.motifsSortie = mergeUniq(settings.motifsSortie, parsed.referentiels.motifsSortie)
    settings.typesSortiePositive = mergeUniq(settings.typesSortiePositive, parsed.referentiels.typesSortiePositive)
    settings.motifsReo = mergeUniq(settings.motifsReo, parsed.referentiels.motifsReo)
    await settings.save()
  }

  const alerts = await recomputeAlerts(String(structure._id))

  return {
    batch: {
      id: batch._id,
      filename,
      structure: {
        id: structure._id,
        nom: structure.nom,
        cipNom: structure.cipNom,
        clpe: structure.clpe
      },
      counts: { ...parsed.counts, upserted },
      warnings: parsed.warnings,
      unknownColumns: parsed.unknownColumns,
      alerts
    }
  }
})
