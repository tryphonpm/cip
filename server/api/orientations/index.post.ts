import { OrientationImport } from '../../models/OrientationImport'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, message: 'Veuillez sélectionner un fichier Excel.' })
  }

  const filename = file.filename || 'orientations.xlsx'
  if (!/\.xlsx$/i.test(filename)) {
    throw createError({ statusCode: 400, message: 'Seuls les fichiers .xlsx sont acceptés.' })
  }

  const maxBytes = 12 * 1024 * 1024
  if (file.data.length > maxBytes) {
    throw createError({ statusCode: 413, message: 'Le fichier dépasse la taille maximale autorisée (12 Mo).' })
  }

  const parsed = await parseOrientationWorkbook(file.data, filename)
  if (!parsed.data.length) {
    throw createError({
      statusCode: 422,
      message: 'Aucune orientation BRSA n\'a été reconnue dans ce fichier.'
    })
  }

  const { columns, keys } = appendOrientationStatutColumn(parsed.columns, parsed.keys)
  const data = withOrientationRowStatut(parsed.data)

  const created = await OrientationImport.create({
    filename,
    importedBy: event.context.user?._id ?? null,
    ligne1: parsed.ligne1,
    ligne2: parsed.ligne2,
    documentDate: parsed.documentDate,
    sheetName: parsed.sheetName,
    columns,
    keys,
    rowCount: data.length,
    warnings: parsed.warnings,
    data
  })

  const populated = await OrientationImport.findById(created._id)
    .populate('importedBy', 'name email')
    .lean()

  return {
    import: toOrientationImportDetail(populated || created.toObject())
  }
})
