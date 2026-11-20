export const staff = ['田中', '佐藤', '鈴木', '高橋'] as const
export type Worker = typeof staff[number]

export type Slot = { date: string; start: string; end: string; worker: Worker }
export const photoCategories = ['施工前', '施工後', 'その他'] as const
export type PhotoCategory = typeof photoCategories[number]
export type Photo = { id: string; category: PhotoCategory; name: string; blob: Blob }
export type Draft = { photos: Photo[]; completed: boolean; model: string; serial: string; memo: string }
export const emptyDraft: Draft = { photos: [], completed: false, model: '', serial: '', memo: '' }
export const reportGroups = ['未報告', '確認待ち', '確認済み'] as const
export type ReportGroup = typeof reportGroups[number]

export type Case = {
  id: string
  site: string
  client: string
  area: string
  address: string
  note: string
  equipment: string
  slot?: Slot
  report?: { draft: Draft; submittedAt?: number; confirmedAt?: number }
}

const jst = 'Asia/Tokyo'
const isoDayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: jst, year: 'numeric', month: '2-digit', day: '2-digit' })
const toDate = (day: string) => new Date(`${day}T00:00:00+09:00`)
const dayFormatter = new Intl.DateTimeFormat('ja-JP', { timeZone: jst, month: 'long', day: 'numeric', weekday: 'short' })
const shortFormatter = new Intl.DateTimeFormat('ja-JP', { timeZone: jst, month: 'numeric', day: 'numeric' })
const weekdayFormatter = new Intl.DateTimeFormat('ja-JP', { timeZone: jst, weekday: 'short' })
export const todayInJst = (now = Date.now()) => isoDayFormatter.format(now)
export const formatDay = (day: string) => dayFormatter.format(toDate(day))
export const shortDay = (day: string) => shortFormatter.format(toDate(day))
export const weekday = (day: string) => weekdayFormatter.format(toDate(day))

export function addDays(day: string, offset: number) {
  const utc = new Date(`${day}T00:00:00Z`)
  utc.setUTCDate(utc.getUTCDate() + offset)
  return utc.toISOString().slice(0, 10)
}

export function revisionId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, '0')).join('')
}
