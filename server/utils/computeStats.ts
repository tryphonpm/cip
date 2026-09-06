interface BeneficiaireLike {
  cipNom?: string
  clpe?: string
  territoire?: string
  cds?: string
  statut?: string
  dateOrientation?: Date | null
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
  dispositifs?: { nom: string, valeur: string }[]
  absences?: { avantCe1?: number, avantCe2?: number, mois?: number[] }
  suspensions?: { demande?: boolean }
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
