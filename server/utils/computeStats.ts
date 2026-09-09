import {
  CIP_LOT_PERIMETRES,
  CIP_LOTS,
  lotLabel,
  normalizeLotNumber,
  type BilanLotRow,
  type BilanSemestriel,
  type BilanTotaux,
  type CipLot
} from '../../shared/types'
import { normalizeName } from './normalize'

interface BeneficiaireLike {
  cipNom?: string
  clpe?: string
  territoire?: string
  cds?: string
  lot?: string
  nomNormalise?: string
  prenomNormalise?: string
  statut?: string
  dateOrientation?: Date | null
  dateSortie?: Date | null
  ceSigne6?: Date | null
  ceSigne12?: Date | null
  pmsmp?: boolean
  bilanType?: string | null
  fseCode?: string
  nom?: string
  prenom?: string
  projetProfessionnel?: string
  motifSortie?: string
  motifReo?: string
  typeSortie?: string
  commentaires?: string
  dispositifs?: { nom: string, valeur: string }[]
  absences?: { avantCe1?: number, avantCe2?: number, mois?: number[] }
  suspensions?: { demande?: boolean, dateDemande?: Date | string | null }
}

function hasCe(b: BeneficiaireLike) {
  return Boolean(b.ceSigne6 || b.ceSigne12)
}

function isSortieSansCe(b: BeneficiaireLike) {
  return b.statut === 'sortie' && !hasCe(b)
}

function isAccompagnement(b: BeneficiaireLike) {
  return !isSortieSansCe(b)
}

function bump(map: Record<string, number>, key: string, n = 1) {
  const k = key || 'Non renseigné'
  map[k] = (map[k] || 0) + n
}

function groupCount<T>(items: T[], keyFn: (item: T) => string) {
  const map: Record<string, number> = {}
  for (const item of items) bump(map, keyFn(item))
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
}

export function computeStats(rows: BeneficiaireLike[]) {
  const orientations = rows.filter(b => b.dateOrientation)
  const sortiesSansCe = rows.filter(isSortieSansCe)
  const accompagnements = rows.filter(isAccompagnement)
  const ceSignes = rows.filter(hasCe)
  const pmsmp = rows.filter(b => b.pmsmp)
  const fse = rows.filter(b => String(b.fseCode || '').trim())
  const suspensions = rows.filter(b => b.suspensions?.demande)

  const bilans = {
    renouvellement: rows.filter(b => b.bilanType === 'renouvellement').length,
    reo_ft: rows.filter(b => b.bilanType === 'reo_ft').length,
    tripartite: rows.filter(b => b.bilanType === 'tripartite').length,
    total: rows.filter(b => b.bilanType).length
  }

  let totalAbsences = 0
  let slots = 0
  for (const b of rows) {
    const mois = b.absences?.mois || []
    if (mois.some(n => n > 0) || b.absences?.avantCe1 || b.absences?.avantCe2) {
      totalAbsences += (b.absences?.avantCe1 || 0) + (b.absences?.avantCe2 || 0) + mois.reduce((s, n) => s + (n || 0), 0)
      slots += 14
    }
  }
  const tauxAbsenteisme = slots > 0 ? Math.round((totalAbsences / slots) * 1000) / 10 : 0

  const dispositifsMap: Record<string, { cip: Record<string, number>, territoire: Record<string, number>, total: number }> = {}
  for (const b of rows) {
    for (const d of b.dispositifs || []) {
      if (!d.valeur) continue
      if (!dispositifsMap[d.nom]) dispositifsMap[d.nom] = { cip: {}, territoire: {}, total: 0 }
      dispositifsMap[d.nom].total += 1
      bump(dispositifsMap[d.nom].cip, b.cipNom || '')
      bump(dispositifsMap[d.nom].territoire, b.cds || b.territoire || '')
    }
  }

  const projets: Record<string, { key: string, personnes: { nom: string, prenom: string, cipNom: string }[] }> = {}
  for (const b of rows) {
    const key = b.projetProfessionnel || 'Non renseigné'
    if (!projets[key]) projets[key] = { key, personnes: [] }
    projets[key].personnes.push({
      nom: b.nom || '',
      prenom: b.prenom || '',
      cipNom: b.cipNom || ''
    })
  }

  return {
    totaux: {
      dossiers: rows.length,
      orientations: orientations.length,
      actifs: rows.filter(b => b.statut === 'actif').length,
      sorties: rows.filter(b => b.statut === 'sortie').length,
      sortiesSansCe: sortiesSansCe.length,
      accompagnementEffectif: accompagnements.length,
      ceSignes: ceSignes.length,
      pmsmp: pmsmp.length,
      fse: fse.length,
      suspensions: suspensions.length,
      tauxAbsenteisme,
      totalAbsences,
      slotsAbsences: slots
    },
    orientationsParClpeCip: groupCount(orientations, b => `${b.clpe || 'CLPE ?'} · ${b.cipNom || 'CIP ?'}`),
    orientationsParCip: groupCount(orientations, b => b.cipNom || 'CIP ?'),
    accompagnementParCip: groupCount(accompagnements, b => b.cipNom || 'CIP ?'),
    sortiesSansCeParCip: groupCount(sortiesSansCe, b => b.cipNom || 'CIP ?'),
    ceParCip: groupCount(ceSignes, b => b.cipNom || 'CIP ?'),
    pmsmpParCip: groupCount(pmsmp, b => b.cipNom || 'CIP ?'),
    bilans,
    listeFse: fse.map(b => ({
      nom: b.nom,
      prenom: b.prenom,
      fseCode: b.fseCode,
      cipNom: b.cipNom,
      cds: b.cds,
      statut: b.statut
    })).sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr')),
    projetsProfessionnels: Object.values(projets).sort((a, b) => b.personnes.length - a.personnes.length),
    dispositifs: Object.entries(dispositifsMap)
      .map(([nom, data]) => ({
        nom,
        total: data.total,
        parCip: Object.entries(data.cip).map(([key, count]) => ({ key, count })),
        parTerritoire: Object.entries(data.territoire).map(([key, count]) => ({ key, count }))
      }))
      .sort((a, b) => b.total - a.total),
    sortiesParMotif: groupCount(rows.filter(b => b.motifSortie), b => b.motifSortie || ''),
    reoParMotif: groupCount(rows.filter(b => b.motifReo), b => b.motifReo || ''),
    sortiesPositives: groupCount(rows.filter(b => b.typeSortie), b => b.typeSortie || '')
  }
}

export function applyFilters<T extends BeneficiaireLike>(
  rows: T[],
  query: { cip?: string, clpe?: string, territoire?: string, cds?: string, statut?: string }
) {
  return rows.filter((b) => {
    if (query.cip && b.cipNom !== query.cip) return false
    if (query.clpe && b.clpe !== query.clpe) return false
    if (query.territoire && b.territoire !== query.territoire) return false
    if (query.cds && b.cds !== query.cds) return false
    if (query.statut && b.statut !== query.statut) return false
    return true
  })
}

function toUtcDay(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function isOnOrBefore(date: Date, end: Date) {
  return date.getTime() <= end.getTime()
}

function isInRange(date: Date | null, start: Date, end: Date) {
  if (!date) return false
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
}

function personKeyOf(row: BeneficiaireLike) {
  const nom = row.nomNormalise || normalizeName(row.nom)
  const prenom = row.prenomNormalise || normalizeName(row.prenom)
  return `${nom}|${prenom}`
}

function lotKeyOf(row: BeneficiaireLike) {
  return normalizeLotNumber(row.lot)
}

export function isDemandeCli(row: BeneficiaireLike) {
  if (row.suspensions?.demande) return true
  return /\bCLI\b/i.test(row.commentaires || '')
}

function emptyLotRow(lot: string): BilanLotRow {
  const known = CIP_LOTS.includes(lot as CipLot)
  return {
    lot,
    lotLabel: lotLabel(lot),
    perimetre: known ? CIP_LOT_PERIMETRES[lot as CipLot] : '',
    orientations: 0,
    doublons: 0,
    fileActive: 0,
    sorties: 0,
    demandesCli: 0
  }
}

export function computeBilanSemestriel(
  rows: BeneficiaireLike[],
  start: Date,
  end: Date
): Pick<BilanSemestriel, 'totaux' | 'parLot' | 'sortiesParMotif'> {
  const withDates = rows.map(row => ({
    row,
    lot: lotKeyOf(row),
    key: personKeyOf(row),
    dateOrientation: toUtcDay(row.dateOrientation),
    dateSortie: toUtcDay(row.dateSortie),
    dateDemandeCli: toUtcDay(row.suspensions?.dateDemande)
  }))

  const orientations = withDates.filter(item => isInRange(item.dateOrientation, start, end))
  const orientationKeys = orientations.reduce((map, item) => {
    map.set(item.key, (map.get(item.key) || 0) + 1)
    return map
  }, new Map<string, number>())

  const sorties = withDates.filter(item => isInRange(item.dateSortie, start, end))

  const fileActive = withDates.filter((item) => {
    if (!item.dateOrientation || !isOnOrBefore(item.dateOrientation, end)) return false
    if (item.dateSortie && isOnOrBefore(item.dateSortie, end)) return false
    if (!item.dateSortie && item.row.statut === 'sortie') return false
    return true
  })

  const presentDuringPeriod = withDates.filter((item) => {
    if (!item.dateOrientation || item.dateOrientation.getTime() > end.getTime()) return false
    if (item.dateSortie && item.dateSortie.getTime() < start.getTime()) return false
    return true
  })

  const demandesCli = presentDuringPeriod.filter((item) => {
    if (!isDemandeCli(item.row)) return false
    if (item.dateDemandeCli) return isInRange(item.dateDemandeCli, start, end)
    return true
  })

  const lots = new Map<string, BilanLotRow>()
  for (const lot of CIP_LOTS) lots.set(lot, emptyLotRow(lot))

  function ensureLot(lot: string) {
    const key = lot || '__none__'
    const existing = lots.get(key)
    if (existing) return existing
    const created = emptyLotRow(lot)
    lots.set(key, created)
    return created
  }

  for (const item of orientations) {
    ensureLot(item.lot).orientations += 1
  }
  for (const item of orientations) {
    if ((orientationKeys.get(item.key) || 0) > 1) ensureLot(item.lot).doublons += 1
  }
  for (const item of fileActive) {
    ensureLot(item.lot).fileActive += 1
  }
  for (const item of sorties) {
    ensureLot(item.lot).sorties += 1
  }
  for (const item of demandesCli) {
    ensureLot(item.lot).demandesCli += 1
  }

  const parLot = [...lots.values()].sort((a, b) => {
    if (!a.lot) return 1
    if (!b.lot) return -1
    return a.lot.localeCompare(b.lot, 'fr', { numeric: true })
  })

  const totaux: BilanTotaux = {
    orientations: orientations.length,
    doublons: Math.max(0, orientations.length - orientationKeys.size),
    fileActive: fileActive.length,
    sorties: sorties.length,
    demandesCli: demandesCli.length
  }

  return {
    totaux,
    parLot,
    sortiesParMotif: groupCount(sorties.map(item => item.row), b => b.motifSortie || 'Non renseigné')
  }
}
