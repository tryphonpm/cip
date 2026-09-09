export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const semestre = query.semestre ? String(query.semestre) : undefined
  return await buildBilanSemestrielResponse(semestre)
})
