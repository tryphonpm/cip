import JSZip from 'jszip'
import {
  ALL_SEMESTRES,
  CIP_LOT_PERIMETRES,
  CIP_LOTS,
  lotLabel,
  type BilanLotRow,
  type BilanSemestriel,
  type CipLot,
  type SemestreOption
} from '../../shared/types'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatFrNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function formatFrDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('fr-FR', { timeZone: 'UTC' })
}

function p(text: string, style?: string): string {
  const pr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p>${pr}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
}

function lotSection(lot: CipLot): string {
  return [
    p(`Lot ${lot} : ${CIP_LOT_PERIMETRES[lot]}`, 'Heading2'),
    p(`Nombre d’orientations reçues = {{orientations_lot${lot}}}`),
    p(`Dont doublon : {{doublons_lot${lot}}}`),
    p(`Nombre de BRSA sorties du dispositif CIP+ = {{sorties_lot${lot}}}`),
    p(`Nombre de bénéficiaires du RSA en file active = {{file_active_lot${lot}}}`),
    p(`Dont demandes de passage en CLI : {{cli_lot${lot}}}`)
  ].join('')
}

const DOCUMENT_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${p('Bilan d’activité CIP+', 'Title')}
    ${p('{{periode}}', 'Subtitle')}
    ${p('Nom de la structure opératrice : ALFA 3A')}
    ${p('Données arrêtées au {{date_arret}}')}
    ${p('3) Bilan quantitatif global', 'Heading1')}
    ${p('Sur la période sélectionnée, les indicateurs témoignent du flux d’orientations, de la file active, des sorties et du suivi des situations via la CLI.')}
    ${p('{{orientations_total}} orientations reçues (tous lots)')}
    ${p('{{file_active_total}} bénéficiaires en file active (tous lots)')}
    ${p('{{sorties_total}} sorties du dispositif (tous motifs confondus)')}
    ${p('{{cli_total}} demandes de passage en CLI')}
    ${p('Dont doublons d’orientation : {{doublons_total}}')}
    ${p('Répartition par lot', 'Heading1')}
    ${lotSection('1')}
    ${lotSection('2')}
    ${lotSection('3')}
    ${lotSection('4')}
    ${p('Sorties du dispositif par motif (tous lots confondus)', 'Heading1')}
    ${p('{{sorties_par_motif}}')}
    ${p('Point global', 'Heading1')}
    ${p('Total nombre d’orientations : {{orientations_total}}')}
    ${p('Les commentaires qualitatifs (ateliers, partenariats, points de vigilance) restent à compléter dans ce document après export.')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/>
    </w:sectPr>
  </w:body>
</w:document>`

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:after="160"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="40"/>
      <w:color w:val="0F766E"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:after="200"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:i/>
      <w:sz w:val="24"/>
      <w:color w:val="475569"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="0F766E"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="360" w:after="160"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="134E4A"/>
    </w:rPr>
    <w:pPr>
      <w:spacing w:before="280" w:after="120"/>
    </w:pPr>
  </w:style>
</w:styles>`

function lotOrEmpty(rows: BilanLotRow[], lot: CipLot): BilanLotRow {
  return rows.find(row => row.lot === lot) || {
    lot,
    lotLabel: lotLabel(lot),
    perimetre: CIP_LOT_PERIMETRES[lot],
    orientations: 0,
    doublons: 0,
    fileActive: 0,
    sorties: 0,
    demandesCli: 0
  }
}

export function bilanTagValues(bilan: BilanSemestriel): Record<string, string> {
  const tags: Record<string, string> = {
    periode: bilan.semestre.label,
    date_arret: formatFrDate(bilan.semestre.end),
    orientations_total: formatFrNumber(bilan.totaux.orientations),
    file_active_total: formatFrNumber(bilan.totaux.fileActive),
    sorties_total: formatFrNumber(bilan.totaux.sorties),
    cli_total: formatFrNumber(bilan.totaux.demandesCli),
    doublons_total: formatFrNumber(bilan.totaux.doublons),
    sorties_par_motif: bilan.sortiesParMotif.length
      ? bilan.sortiesParMotif.map(item => `${item.key} : ${formatFrNumber(item.count)}`).join('    ')
      : 'Aucune sortie sur la période.'
  }

  for (const lot of CIP_LOTS) {
    const row = lotOrEmpty(bilan.parLot, lot)
    tags[`orientations_lot${lot}`] = formatFrNumber(row.orientations)
    tags[`doublons_lot${lot}`] = formatFrNumber(row.doublons)
    tags[`file_active_lot${lot}`] = formatFrNumber(row.fileActive)
    tags[`sorties_lot${lot}`] = formatFrNumber(row.sorties)
    tags[`cli_lot${lot}`] = formatFrNumber(row.demandesCli)
  }

  return tags
}

export function replaceBilanTags(xml: string, tags: Record<string, string>): string {
  return xml.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_full, name: string) => {
    const value = tags[name]
    return value == null ? '' : escapeXml(value)
  })
}

export function bilanExportFilename(semestre: SemestreOption): string {
  const suffix = semestre.id === ALL_SEMESTRES ? 'tous-semestres' : semestre.id
  return `Bilan-CIP-plus-${suffix}.docx`
}

export async function fillBilanTemplate(bilan: BilanSemestriel): Promise<Buffer> {
  const xml = replaceBilanTags(DOCUMENT_TEMPLATE, bilanTagValues(bilan))
  const zip = new JSZip()
  zip.file('[Content_Types].xml', CONTENT_TYPES)
  zip.folder('_rels')?.file('.rels', RELS)
  const word = zip.folder('word')
  word?.file('document.xml', xml)
  word?.file('styles.xml', STYLES)
  word?.folder('_rels')?.file('document.xml.rels', DOCUMENT_RELS)
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
  return Buffer.from(buffer)
}
