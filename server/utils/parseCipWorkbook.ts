import ExcelJS from 'exceljs'

export interface ParsedPerson {
  civilite: string
  nom: string
  prenom: string
  nomNormalise: string
  prenomNormalise: string
  age: number | null
  niveauScolaire: string
  cds: string
  statut: BeneficiaireStatut
  dateOrientation: Date | null
  datePremierRdv: Date | null
  ceSigne6: Date | null
  finCe6: Date | null
  ceSigne12: Date | null
  finCe12: Date | null
  dateSortie: Date | null
  bilanType: BilanType | null
  bilanDate7: Date | null
  bilanDate14: Date | null
  freins: string[]
  offresEmploi: number | null
  entretiensRecrutement: number | null
  pmsmp: boolean
  motifSortie: string
  motifReo: string
  typeSortie: string
  fseCode: string
  dispositifs: DispositifSaisi[]
  commentaires: string
  absences: AbsencesMensuelles
  suspensions: SuspensionInfo
}

export interface ParsedWorkbook {
  meta: {
    cipNom: string
    territoire: string
    clpe: string
    lot: string
    operateur: string
    nom: string
    key: string
  }
  personnes: ParsedPerson[]
  warnings: string[]
  unknownColumns: string[]
  counts: {
    actifs: number
    sorties: number
    absences: number
    bilans: number
  }
  referentiels: {
    motifsSortie: string[]
    typesSortiePositive: string[]
    motifsReo: string[]
  }
}

type SheetKind = 'suivi' | 'absences' | 'bilans' | 'referentiels' | 'autre'

const DISPOSITIF_ALIASES: Record<string, string> = {
  fle: 'FLE',
  'declic emploi hba': 'Declic Emploi HBA',
  'mife 01': 'MIFE 01',
  'mife': 'MIFE 01',
  'aide financiere': 'Aide financière',
  'conseillers numeriques': 'Conseillers numériques',
  'go on': 'GO ON',
  mobilite: 'Mobilité',
  ariane: 'Ariane',
  'agent de sante': 'Agent de santé',
  adapt: 'ADAPT',
  orsac: 'ORSAC',
  'repit parental': 'Répit parental',
  'clauses sociales': 'Clauses sociales',
  autres: 'Autres',
  'autres preciser': 'Autres'
}

function cellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim()
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (v.richText && Array.isArray(v.richText)) {
      return v.richText.map((p: { text?: string }) => p.text || '').join('').trim()
    }
    if (v.text) return String(v.text).trim()
    if (v.result != null) return cellText(v.result)
    if (v.error) return ''
  }
  return String(value).trim()
}

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return null
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial * 86_400_000)
  return new Date(utc)
}

function cellDate(value: unknown): Date | null {
  try {
    if (value == null || value === '') return null
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null
      return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
    }
    if (typeof value === 'number') return excelSerialToDate(value)
    if (typeof value === 'object') {
      const v = value as Record<string, unknown>
      if (v.result != null) return cellDate(v.result)
    }
    const text = cellText(value)
    if (!text || text.includes('#') || text.includes('VALUE')) return null
    const asNum = Number(text.replace(',', '.'))
    if (Number.isFinite(asNum) && asNum > 20000) return excelSerialToDate(asNum)
    const fr = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
    if (fr) {
      const d = Number(fr[1])
      const m = Number(fr[2]) - 1
      let y = Number(fr[3])
      if (y < 100) y += 2000
      return new Date(Date.UTC(y, m, d))
    }
    const iso = Date.parse(text)
    if (!Number.isNaN(iso)) return new Date(iso)
    return null
  }
  catch {
    return null
  }
}

function cellNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = cellText(value).replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

function rowValues(row: ExcelJS.Row, maxCol = 45): unknown[] {
  const values: unknown[] = Array.from({ length: maxCol + 1 }, () => null)
  for (let c = 1; c <= maxCol; c++) {
    values[c] = row.getCell(c).value
  }
  return values
}

function detectKind(name: string, headers: string[]): SheetKind {
  const n = normalizeHeader(name)
  const h = headers.map(normalizeHeader).join(' | ')
  if (n.includes('liste deroul') || h.includes('motifs sorties')) return 'referentiels'
  if (n.includes('codification') || n.includes('tableau croise') || n.includes('feuil')) return 'autre'
  if (n.includes('sanction') || n.includes('absence') || (h.includes('dde etude') && h.includes('1er mois'))) {
    return 'absences'
  }
  if (n.includes('bilan') || (h.includes('renouvellement') && h.includes('demande') && h.includes('nom'))) {
    return 'bilans'
  }
  if (h.includes('nom') && h.includes('prenom') && (h.includes('date orientation') || h.includes('c e signe') || h.includes('saisie fse'))) {
    return 'suivi'
  }
  return 'autre'
}

function firstSegment(value: string): string {
  return value.split('|')[0].trim()
}

function parseMetaFromRows(rows: string[]): ParsedWorkbook['meta'] {
  const blob = rows.join('\n')
  const cip = firstSegment(blob.match(/CIP\s*:\s*([^\n]+)/i)?.[1] || '') || 'CIP inconnu'
  const operateur = firstSegment(blob.match(/OPERATEUR\s*:\s*([^\n]+)/i)?.[1] || '')
  const lot = blob.match(/LOT\s*(\d+)/i)?.[1] || ''
  const clpe = firstSegment(blob.match(/CLPE\s+([^/\n]+)/i)?.[1] || '')
  const territoire = firstSegment(blob.match(/Territoire\s*:\s*([^/\n]+)/i)?.[1] || '')
    .replace(/-\s*LOT.*$/i, '')
    .trim()
  const nom = [cip, territoire || clpe].filter(Boolean).join(' · ')
  const key = [normalizeName(cip), normalizeName(territoire || clpe), lot].filter(Boolean).join('|')
  return { cipNom: cip, territoire, clpe, lot, operateur, nom, key }
}

interface ColMap {
  civilite?: number
  nom?: number
  prenom?: number
  age?: number
  niveauScolaire?: number
  cds?: number
  dateOrientation?: number
  datePremierRdv?: number
  ceSigne: number[]
  finCe6?: number
  finCe12?: number
  bilanType?: number
  offresEmploi?: number
  entretiens?: number
  pmsmp?: number
  motifSortie?: number
  motifReo?: number
  typeSortie?: number
  dateSortie?: number
  fseCode?: number
  commentaires?: number
  freins: number[]
  dispositifs: { col: number, nom: string }[]
}

function mapSuiviColumns(headers: string[]): { map: ColMap, unknown: string[] } {
  const map: ColMap = { ceSigne: [], freins: [], dispositifs: [] }
  const unknown: string[] = []

  headers.forEach((header, idx) => {
    if (idx === 0) return
    const h = normalizeHeader(header)
    if (!h) return
    if (h === 'h f' || h === 'civilite') map.civilite = idx
    else if (h === 'nom') map.nom = idx
    else if (h === 'prenom') map.prenom = idx
    else if (h === 'age') map.age = idx
    else if (h.includes('niveau scolaire')) map.niveauScolaire = idx
    else if (h === 'cds') map.cds = idx
    else if (h.includes('date orientation')) map.dateOrientation = idx
    else if (h.includes('1er rdv') || h.includes('premier rdv')) map.datePremierRdv = idx
    else if (h.includes('c e signe') || h === 'ce signe') map.ceSigne.push(idx)
    else if (h.includes('fin ce 6')) map.finCe6 = idx
    else if (h.includes('fin ce 12')) map.finCe12 = idx
    else if (h.includes('bilan parcours')) map.bilanType = idx
    else if (h.includes('offres d emploi') || h.includes('nombre d offres')) map.offresEmploi = idx
    else if (h.includes('entretiens')) map.entretiens = idx
    else if (h.includes('pmsmp')) map.pmsmp = idx
    else if (h.includes('motif de sortie')) map.motifSortie = idx
    else if (h.includes('motif de la reo')) map.motifReo = idx
    else if (h === 'types' || h.includes('type sortie')) map.typeSortie = idx
    else if (h.includes('date sortie')) map.dateSortie = idx
    else if (h.includes('saisie fse') || h === 'fse') map.fseCode = idx
    else if (h.includes('commentaire')) map.commentaires = idx
    else if (h === '1' || h === '2' || h === 'autre') map.freins.push(idx)
    else if (DISPOSITIF_ALIASES[h] || DISPOSITIF_ALIASES[h.split(' ')[0]]) {
      const nom = DISPOSITIF_ALIASES[h] || titleCase(header)
      map.dispositifs.push({ col: idx, nom })
    }
    else if (h === 'situation' || h.startsWith('chiffres')) {
      /* sous-en-tête */
    }
    else {
      unknown.push(header)
    }
  })

  if (map.ceSigne.length >= 2) {
    map.ceSigne = [map.ceSigne[0], map.ceSigne[1]]
  }

  return { map, unknown }
}

function emptyPerson(): ParsedPerson {
  return {
    civilite: '',
    nom: '',
    prenom: '',
    nomNormalise: '',
    prenomNormalise: '',
    age: null,
    niveauScolaire: '',
    cds: '',
    statut: 'actif',
    dateOrientation: null,
    datePremierRdv: null,
    ceSigne6: null,
    finCe6: null,
    ceSigne12: null,
    finCe12: null,
    dateSortie: null,
    bilanType: null,
    bilanDate7: null,
    bilanDate14: null,
    freins: [],
    offresEmploi: null,
    entretiensRecrutement: null,
    pmsmp: false,
    motifSortie: '',
    motifReo: '',
    typeSortie: '',
    fseCode: '',
    dispositifs: [],
    commentaires: '',
    absences: { avantCe1: 0, avantCe2: 0, mois: Array.from({ length: 12 }, () => 0) },
    suspensions: { demande: false, dateDemande: null, dateCourrierCds: null, manifeste: null }
  }
}

function personKey(nom: string, prenom: string) {
  return `${normalizeName(nom)}|${normalizeName(prenom)}`
}

function mergePerson(target: ParsedPerson, incoming: Partial<ParsedPerson>) {
  for (const [key, value] of Object.entries(incoming) as [keyof ParsedPerson, ParsedPerson[keyof ParsedPerson]][]) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue
    if (key === 'absences' || key === 'suspensions' || key === 'dispositifs' || key === 'freins') continue
    if (key === 'statut' && target.statut === 'sortie') continue
    ;(target as Record<string, unknown>)[key] = value
  }
  if (incoming.dispositifs?.length) {
    const seen = new Set(target.dispositifs.map(d => d.nom))
    for (const d of incoming.dispositifs) {
      if (!seen.has(d.nom)) {
        target.dispositifs.push(d)
        seen.add(d.nom)
      }
    }
  }
  if (incoming.freins?.length) {
    target.freins = [...new Set([...target.freins, ...incoming.freins])]
  }
  if (incoming.absences) {
    target.absences.avantCe1 = incoming.absences.avantCe1 || target.absences.avantCe1
    target.absences.avantCe2 = incoming.absences.avantCe2 || target.absences.avantCe2
    target.absences.mois = incoming.absences.mois.map((n, i) => n || target.absences.mois[i] || 0)
  }
  if (incoming.suspensions?.demande) {
    target.suspensions = { ...target.suspensions, ...incoming.suspensions }
  }
}

export async function parseCipWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as unknown as ArrayBuffer)

  const warnings: string[] = []
  const unknownColumns = new Set<string>()
  const personnes = new Map<string, ParsedPerson>()
  const referentiels = {
    motifsSortie: [] as string[],
    typesSortiePositive: [] as string[],
    motifsReo: [] as string[]
  }
  const counts = { actifs: 0, sorties: 0, absences: 0, bilans: 0 }
  let meta: ParsedWorkbook['meta'] | null = null

  const getOrCreate = (nom: string, prenom: string) => {
    const key = personKey(nom, prenom)
    let person = personnes.get(key)
    if (!person) {
      person = emptyPerson()
      person.nom = nom
      person.prenom = prenom
      person.nomNormalise = normalizeName(nom)
      person.prenomNormalise = normalizeName(prenom)
      personnes.set(key, person)
    }
    return person
  }

  for (const sheet of wb.worksheets) {
    const headerProbe: string[][] = []
    const metaLines: string[] = []
    let headerRowIdx = 0
    let headers: string[] = []

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 12 || headerRowIdx) return
      const vals = rowValues(row, 40).map(cellText)
      headerProbe.push(vals)
      metaLines.push(String(vals[1] || vals.find(Boolean) || ''))
      const joined = vals.map(normalizeHeader).join(' ')
      if (joined.includes('nom') && joined.includes('prenom') && (joined.includes('cds') || joined.includes('1er mois') || joined.includes('orientation'))) {
        headerRowIdx = rowNumber
        headers = vals
      }
    })

    if (!meta && metaLines.some(l => /CIP\s*:/i.test(l) || /Territoire/i.test(l))) {
      meta = parseMetaFromRows(metaLines)
    }

    const kind = detectKind(sheet.name, headers)
    if (kind === 'autre') continue

    if (kind === 'referentiels') {
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const motif = cellText(row.getCell(8).value)
        const type = cellText(row.getCell(10).value)
        const reo = cellText(row.getCell(6).value)
        if (motif && normalizeHeader(motif) !== 'motifs sorties') referentiels.motifsSortie.push(motif)
        if (type && normalizeHeader(type) !== 'sorties') referentiels.typesSortiePositive.push(type)
        if (reo && !['reorientation', 'emploi'].includes(normalizeHeader(reo))) referentiels.motifsReo.push(reo)
      })
      continue
    }

    if (!headerRowIdx) {
      warnings.push(`Onglet « ${sheet.name} » : en-tête non reconnu`)
      continue
    }

    if (kind === 'suivi') {
      const { map, unknown } = mapSuiviColumns(headers)
      unknown.forEach(c => unknownColumns.add(c))
      if (!map.nom || !map.prenom) {
        warnings.push(`Onglet « ${sheet.name} » : colonnes Nom/Prénom introuvables`)
        continue
      }
      const isSorties = normalizeHeader(sheet.name).includes('sortie')
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRowIdx) return
        const vals = rowValues(row, 42)
        const nom = cellText(vals[map.nom!])
        const prenom = cellText(vals[map.prenom!])
        if (!nom || !prenom) return
        if (/^nom$/i.test(nom)) return

        const motifSortie = map.motifSortie ? cellText(vals[map.motifSortie]) : ''
        const statut: BeneficiaireStatut = isSorties || motifSortie ? 'sortie' : 'actif'
        const freins = map.freins.map(c => cellText(vals[c])).filter(Boolean)
        const dispositifs = map.dispositifs
          .map(({ col, nom: dNom }) => ({ nom: dNom, valeur: cellText(vals[col]) }))
          .filter(d => d.valeur)

        const incoming: Partial<ParsedPerson> = {
          civilite: map.civilite ? cellText(vals[map.civilite]) : '',
          age: map.age ? cellNumber(vals[map.age]) : null,
          niveauScolaire: map.niveauScolaire ? cellText(vals[map.niveauScolaire]) : '',
          cds: normalizeCds(map.cds ? cellText(vals[map.cds]) : ''),
          statut,
          dateOrientation: map.dateOrientation ? cellDate(vals[map.dateOrientation]) : null,
          datePremierRdv: map.datePremierRdv ? cellDate(vals[map.datePremierRdv]) : null,
          ceSigne6: map.ceSigne[0] ? cellDate(vals[map.ceSigne[0]]) : null,
          ceSigne12: map.ceSigne[1] ? cellDate(vals[map.ceSigne[1]]) : null,
          finCe6: map.finCe6 ? cellDate(vals[map.finCe6]) : null,
          finCe12: map.finCe12 ? cellDate(vals[map.finCe12]) : null,
          dateSortie: map.dateSortie ? cellDate(vals[map.dateSortie]) : null,
          bilanType: map.bilanType ? parseBilanType(cellText(vals[map.bilanType])) : null,
          offresEmploi: map.offresEmploi ? cellNumber(vals[map.offresEmploi]) : null,
          entretiensRecrutement: map.entretiens ? cellNumber(vals[map.entretiens]) : null,
          pmsmp: map.pmsmp ? isTruthyFlag(vals[map.pmsmp]) : false,
          motifSortie,
          motifReo: map.motifReo ? cellText(vals[map.motifReo]) : '',
          typeSortie: map.typeSortie ? cellText(vals[map.typeSortie]) : '',
          fseCode: map.fseCode ? cellText(vals[map.fseCode]) : '',
          commentaires: map.commentaires ? cellText(vals[map.commentaires]) : '',
          freins,
          dispositifs
        }

        const person = getOrCreate(nom, prenom)
        if (personnes.has(personKey(nom, prenom)) && person.civilite && incoming.civilite && person.statut === incoming.statut) {
          warnings.push(`Homonyme possible : ${nom} ${prenom} (onglet ${sheet.name})`)
        }
        mergePerson(person, incoming)
        if (statut === 'sortie') counts.sorties += 1
        else counts.actifs += 1
      })
    }

    if (kind === 'absences') {
      const h = headers.map(v => normalizeHeader(v || ''))
      const has = (i: number, frag: string) => (h[i] || '').includes(frag)
      const nomCol = h.findIndex(v => v === 'nom')
      const prenomCol = h.findIndex(v => (v || '').includes('prenom'))
      const rdv1 = h.findIndex(v => (v || '').includes('1er rdv'))
      const rdv2 = h.findIndex(v => v === '2eme' || (v || '').includes('2eme'))
      const monthCols = Array.from({ length: 12 }, (_, i) => {
        const labels = [`${i + 1}e mois`, `${i + 1}er mois`, `${i + 1} mois`]
        return h.findIndex(v => labels.some(l => (v || '').includes(l) || v === l))
      }).map((idx, i) => {
        if (idx > 0) return idx
        return 5 + i
      })
      const ddeCol = h.findIndex((_, i) => has(i, 'dde') || has(i, 'etude de situation'))
      const dateDde = h.findIndex((_, i) => has(i, 'date de la demande'))
      const courrier = h.findIndex((_, i) => has(i, 'date courrier'))
      const manifeste = h.findIndex((_, i) => has(i, 'manifest'))

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRowIdx) return
        const vals = rowValues(row, 40)
        const nom = cellText(vals[nomCol > 0 ? nomCol : 1])
        const prenom = cellText(vals[prenomCol > 0 ? prenomCol : 2])
        if (!nom || !prenom || /^nom$/i.test(nom)) return
        const mois = monthCols.map(c => cellNumber(vals[c]) || 0)
        const incoming: Partial<ParsedPerson> = {
          absences: {
            avantCe1: rdv1 > 0 ? cellNumber(vals[rdv1]) || 0 : 0,
            avantCe2: rdv2 > 0 ? cellNumber(vals[rdv2]) || 0 : 0,
            mois
          },
          suspensions: {
            demande: ddeCol > 0 ? isTruthyFlag(vals[ddeCol]) : false,
            dateDemande: dateDde > 0 ? cellDate(vals[dateDde])?.toISOString() || null : null,
            dateCourrierCds: courrier > 0 ? cellDate(vals[courrier])?.toISOString() || null : null,
            manifeste: manifeste > 0 ? (cellText(vals[manifeste]) === '' ? null : isTruthyFlag(vals[manifeste])) : null
          }
        }
        mergePerson(getOrCreate(nom, prenom), incoming)
        counts.absences += 1
      })
    }

    if (kind === 'bilans') {
      const h = headers.map(v => normalizeHeader(v || ''))
      const nomCol = h.findIndex(v => v === 'nom')
      const prenomCol = h.findIndex(v => (v || '').includes('prenom'))
      const dateCols = h
        .map((v, i) => ({ v: v || '', i }))
        .filter(x => x.v === 'date' || x.v.startsWith('date '))
        .map(x => x.i)
      const renouvelCol = h.findIndex(v => (v || '').includes('renouvellement'))
      const reoCol = h.findIndex(v => (v || '').includes('preco') || (v || '').includes('reo'))

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRowIdx) return
        const vals = rowValues(row, 25)
        const nom = cellText(vals[nomCol > 0 ? nomCol : 1])
        const prenom = cellText(vals[prenomCol > 0 ? prenomCol : 2])
        if (!nom || !prenom || /^nom$/i.test(nom)) return
        const date7 = dateCols[0] ? cellDate(vals[dateCols[0]]) : null
        const date14 = dateCols[1] ? cellDate(vals[dateCols[1]]) : null
        let bilanType: BilanType | null = null
        if (renouvelCol > 0 && isTruthyFlag(vals[renouvelCol])) bilanType = 'renouvellement'
        if (reoCol > 0 && cellText(vals[reoCol])) bilanType = parseBilanType(cellText(vals[reoCol])) || 'reo_ft'
        mergePerson(getOrCreate(nom, prenom), { bilanDate7: date7, bilanDate14: date14, bilanType })
        counts.bilans += 1
      })
    }
  }

  if (!meta) {
    meta = parseMetaFromRows(['CIP : Inconnu', 'Territoire: Non renseigné'])
    warnings.push('Métadonnées CIP / territoire introuvables dans le fichier')
  }

  return {
    meta,
    personnes: [...personnes.values()],
    warnings: [...new Set(warnings)].slice(0, 80),
    unknownColumns: [...unknownColumns],
    counts,
    referentiels
  }
}
