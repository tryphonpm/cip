import { User } from '../models/User'
import { Structure } from '../models/Structure'
import { Beneficiaire } from '../models/Beneficiaire'
import { ImportBatch } from '../models/ImportBatch'
import { Alert } from '../models/Alert'
import { Settings } from '../models/Settings'
import { OrientationImport } from '../models/OrientationImport'
import { SalariesCip } from '../models/SalariesCip'

export default defineNitroPlugin(async () => {
  try {
    await connectDb()
    void User
    void Structure
    void Beneficiaire
    void ImportBatch
    void Alert
    void Settings
    void OrientationImport
    void SalariesCip
    await seedApp()
    console.info('[cip] MongoDB connecté, données initiales prêtes')
  }
  catch (error) {
    console.error('[cip] Connexion MongoDB impossible', error)
  }
})
