import { Alert } from '../models/Alert'
import { Beneficiaire } from '../models/Beneficiaire'
import { Settings } from '../models/Settings'

interface AlertDraft {
  type: AlertType
  message: string
  severity: 'warning' | 'danger'
}

function hasCe(b: { ceSigne6?: Date | null, ceSigne12?: Date | null }) {
  return Boolean(b.ceSigne6 || b.ceSigne12)
}

export function alertsForBeneficiaire(
  b: {
    statut: string
    dateOrientation?: Date | null
    datePremierRdv?: Date | null
    ceSigne6?: Date | null
    ceSigne12?: Date | null
    bilanType?: string | null
    bilanDate7?: Date | null
    bilanDate14?: Date | null
    fseCode?: string | null
    nom?: string
    prenom?: string
  },
  delaiJours: number,
  now = new Date()
): AlertDraft[] {
  const drafts: AlertDraft[] = []
  const who = `${b.prenom || ''} ${b.nom || ''}`.trim()

  if (b.dateOrientation) {
    const rdv = b.datePremierRdv
    const delay = rdv ? daysBetween(b.dateOrientation, rdv) : daysBetween(b.dateOrientation, now)
    if (!rdv || delay > delaiJours) {
      drafts.push({
        type: 'delai_premier_rdv',
        severity: 'danger',
        message: rdv
          ? `${who} : 1er RDV ${delay} j après l'orientation (seuil ${delaiJours} j)`
          : `${who} : aucun 1er RDV saisi, ${delay} j depuis l'orientation (seuil ${delaiJours} j)`
      })
    }
  }

  if (b.statut === 'actif' && !hasCe(b)) {
    const afterRdv = Boolean(b.datePremierRdv)
    const afterDelay = b.dateOrientation
      ? daysBetween(b.dateOrientation, now) > delaiJours
      : false
    if (afterRdv || afterDelay) {
      drafts.push({
        type: 'absence_ce',
        severity: 'warning',
        message: `${who} : aucun contrat d'engagement renseigné`
      })
    }
  }

  const ceStart = b.ceSigne6 || b.ceSigne12 || null
  const due7 = ceStart ? addMonths(ceStart, 6) : null
  const due14 = ceStart ? addMonths(ceStart, 13) : null

  if (due7 && due7 < now && !b.bilanType) {
    drafts.push({
      type: 'absence_bilan',
      severity: 'warning',
      message: `${who} : bilan de parcours (7e mois) non renseigné`
    })
  }

  const missingDate7 = Boolean(due7 && due7 < now && !b.bilanDate7)
  const missingDate14 = Boolean(due14 && due14 < now && !b.bilanDate14)
  if (missingDate7 || missingDate14) {
    drafts.push({
      type: 'absence_dates_bilan',
      severity: 'warning',
      message: `${who} : date(s) de bilan manquante(s)${missingDate7 ? ' (7e mois)' : ''}${missingDate14 ? ' (14e mois)' : ''}`
    })
  }

  const needsFse = b.statut === 'actif' || (b.statut === 'sortie' && hasCe(b))
  if (needsFse && !String(b.fseCode || '').trim()) {
    drafts.push({
      type: 'absence_fse',
      severity: 'warning',
      message: `${who} : code FSE non saisi`
    })
  }

  return drafts
}

export async function recomputeAlerts(structureId?: string) {
  const settings = await Settings.findOne({ key: 'app' }).lean()
  const delai = settings?.delaiPremierRdvJours || 15
  const filter = structureId ? { structureId } : {}
  const beneficiaires = await Beneficiaire.find(filter).lean()

  let created = 0
  let autoResolved = 0

  for (const b of beneficiaires) {
    const expected = alertsForBeneficiaire(b, delai)
    const expectedTypes = new Set(expected.map(a => a.type))
    const existing = await Alert.find({ beneficiaireId: b._id })

    for (const draft of expected) {
      const found = existing.find(a => a.type === draft.type)
      if (!found) {
        await Alert.create({
          beneficiaireId: b._id,
          structureId: b.structureId,
          type: draft.type,
          message: draft.message,
          severity: draft.severity,
          status: 'open'
        })
        created += 1
      }
      else if (found.status === 'open') {
        found.message = draft.message
        found.severity = draft.severity
        await found.save()
      }
    }

    for (const alert of existing) {
      if (alert.status === 'open' && !expectedTypes.has(alert.type)) {
        alert.status = 'resolved'
        alert.resolvedAt = new Date()
        await alert.save()
        autoResolved += 1
      }
    }
  }

  return { created, autoResolved, scanned: beneficiaires.length }
}
