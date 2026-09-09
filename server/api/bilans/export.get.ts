export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const semestre = query.semestre ? String(query.semestre) : undefined
  const bilan = await buildBilanSemestrielResponse(semestre)
  const buffer = await fillBilanTemplate(bilan)
  const filename = bilanExportFilename(bilan.semestre)

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return buffer
})
