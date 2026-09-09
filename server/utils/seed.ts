import { User } from '../models/User'
import { Settings } from '../models/Settings'
import { SalariesCip } from '../models/SalariesCip'

export async function seedApp() {
  const config = useRuntimeConfig()

  const existing = await User.findOne({ email: config.adminEmail })
  if (!existing) {
    await User.create({
      email: config.adminEmail,
      name: 'Administratrice',
      passwordHash: await hashPassword(config.adminPassword),
      role: 'admin'
    })
  }

  const settings = await Settings.findOne({ key: 'app' })
  if (!settings) {
    await Settings.create({
      key: 'app',
      delaiPremierRdvJours: 15,
      projetsProfessionnels: [
        'Emploi durable',
        'Formation',
        'Création d\'entreprise',
        'Insertion (SIAE)',
        'Levés de freins',
        'À préciser'
      ],
      motifsSortie: [
        'Positive',
        'Réorientation',
        'Déménagement',
        'Fin DD',
        'Décès',
        'Renonciation RSA',
        'Incarcération',
        'Mauvaise orientation',
        'Fin bilan parcours',
        'Radié suite CLI'
      ],
      typesSortiePositive: [
        'CDI >= 24h',
        'CDD +6 mois >= 24h',
        'Créa',
        'Intérim >= 970h / an',
        'Formation certifiante ou qualifiante',
        'SIAE (FT)'
      ],
      motifsReo: [
        'Sociale AAH',
        'Sociale retraite',
        'Sociale maternité',
        'Social freins+',
        'Arrêt mal. longue durée',
        'BGE',
        'MSA',
        'FT acc pro',
        'FT acco glo'
      ],
      dispositifs: [...DEFAULT_DISPOSITIFS],
      cds: [...DEFAULT_CDS],
      mapping_import_beneficiaire: loadMappingImportBeneficiaire()
    })
    return
  }

  let settingsChanged = false

  if (!Array.isArray(settings.cds) || settings.cds.length === 0) {
    settings.cds = [...DEFAULT_CDS]
    settingsChanged = true
  }

  if (!settings.mapping_import_beneficiaire) {
    settings.mapping_import_beneficiaire = loadMappingImportBeneficiaire()
    settingsChanged = true
  }

  if (settingsChanged) {
    await settings.save()
  }

  await importSalariesCipFromFile()
  await syncSalariesCipKeyImports()
}
