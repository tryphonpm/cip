import { computeBilanSemestriel } from './computeStats'
import { Beneficiaire } from '../models/Beneficiaire'
import { Structure } from '../models/Structure'
import {
  ALL_SEMESTRES,
  buildSemestreOptions,
  formatIsoDateUtc,
  type BilanSemestriel,
  type SemestreOption
} from '../../shared/types'

const CIP_PLUS_LAUNCH = new Date(Date.UTC(2025, 6, 1))

function asDate(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export async function buildBilanSemestrielResponse(semestreQuery?: string): Promise<BilanSemestriel> {
  const [rawRows, structures] = await Promise.all([
    Beneficiaire.find().lean(),
    Structure.find().lean()
  ])

  const lotByStructure = new Map(
    structures.map((structure: { _id?: unknown, lot?: string }) => [String(structure._id), String(structure.lot || '')])
  )

  const rows = rawRows.map((row: { structureId?: unknown, dateOrientation?: Date | null, dateSortie?: Date | null }) => ({
    ...row,
    lot: lotByStructure.get(String(row.structureId || '')) || ''
  }))

  const dates: Date[] = []
  for (const row of rows) {
    const orientation = asDate(row.dateOrientation)
    const sortie = asDate(row.dateSortie)
    if (orientation) dates.push(orientation)
    if (sortie) dates.push(sortie)
  }

  const minDate = dates.reduce<Date | null>((current, date) => {
    if (date.getUTCFullYear() < 2020) return current
    if (!current || date < current) return date
    return current
  }, null)

  const from = minDate && minDate < CIP_PLUS_LAUNCH ? minDate : CIP_PLUS_LAUNCH
  const semestres = buildSemestreOptions(from, new Date()).slice(0, 16)
  const allOption: SemestreOption = {
    id: ALL_SEMESTRES,
    label: 'Tous les semestres',
    start: semestres.at(-1)?.start || formatIsoDateUtc(CIP_PLUS_LAUNCH),
    end: semestres[0]?.end || formatIsoDateUtc(new Date())
  }
  const options = [allOption, ...semestres]

  const requested = semestreQuery && options.some(option => option.id === semestreQuery)
    ? semestreQuery
    : (semestres[0]?.id || ALL_SEMESTRES)

  const selected = options.find(option => option.id === requested) || allOption
  const start = new Date(`${selected.start}T00:00:00.000Z`)
  const end = new Date(`${selected.end}T00:00:00.000Z`)
  const computed = computeBilanSemestriel(rows, start, end)

  return {
    semestre: selected,
    semestres: options,
    totaux: computed.totaux,
    parLot: computed.parLot,
    sortiesParMotif: computed.sortiesParMotif
  }
}
