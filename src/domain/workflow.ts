import { photoCategories, staff, type Case, type Draft, type Registration, type ReportGroup, type Slot, type Worker } from './model.ts'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export function registrationErrors(input: Registration) {
  const errors: Partial<Record<'client' | 'site', string>> = {}
  if (!input.client.trim()) errors.client = '元請けを入力してください。'
  if (!input.site.trim()) errors.site = '現場名を入力してください。'
  return errors
}

export function assignCase(cases: Case[], item: Case, slot: Slot, supplement?: string): Case {
  if (item.report?.submittedAt !== undefined) throw new Error('提出済みの案件は日程・担当を変更できません。')
  const address = item.address.trim() ? item.address : supplement?.trim()
  if (!address) throw new Error('予定を確定するには現場住所が必要です。')
  const day = new Date(`${slot.date}T00:00:00Z`)
  if (!datePattern.test(slot.date) || Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== slot.date) {
    throw new Error('工事日を入力してください。')
  }
  if (!timePattern.test(slot.start) || !timePattern.test(slot.end)) throw new Error('開始時刻と終了時刻を入力してください。')
  if (slot.end <= slot.start) throw new Error('終了時刻は開始時刻より後にしてください。')
  if (!staff.includes(slot.worker)) throw new Error('担当作業員を選択してください。')

  for (const other of cases) {
    const existing = other.slot
    if (item.id !== other.id && existing?.date === slot.date && existing.worker === slot.worker
      && slot.start < existing.end && existing.start < slot.end) {
      throw new Error(`${slot.worker}さんの「${other.site}」（${existing.start}–${existing.end}）と重複しています。`)
    }
  }
  return { ...item, address, slot }
}

export function workerCases(cases: Case[], worker: Worker, day: string): Case[] {
  return cases.filter(item => item.slot?.worker === worker && item.slot.date === day)
    .sort((a, b) => (a.slot?.start ?? '').localeCompare(b.slot?.start ?? ''))
}

export function missingReportItems(draft: Draft) {
  const missing = photoCategories.slice(0, 2).filter(category => !draft.photos.some(photo => photo.category === category))
  return [...missing.map(category => `${category}写真`), ...(!draft.completed ? ['作業結果「完了」'] : [])]
}

export function applyReport(item: Case, worker: Worker, draft: Draft, submitAt?: number): Case {
  if (item.slot?.worker !== worker) throw new Error('この案件の担当が変更されています。案件一覧から開き直してください。')
  if (item.report?.submittedAt !== undefined) throw new Error('提出済みの報告は編集できません。')

  draft.photos.forEach((photo, index) => {
    const error = checkPhoto(photo.blob, index)
    if (error) throw new Error(error)
  })
  if (submitAt !== undefined) {
    const missing = missingReportItems(draft)
    if (missing.length) throw new Error(`提出するには ${missing.join('、')} が必要です。`)
  }
  return { ...item, report: { draft, submittedAt: submitAt } }
}

export function confirmReport(item: Case, timestamp: number): Case {
  if (item.report?.submittedAt === undefined || item.report.confirmedAt !== undefined) {
    throw new Error('確認待ちの報告を選んでください。')
  }
  return { ...item, report: { ...item.report, confirmedAt: timestamp } }
}

export function reportGroup(item: Case, now: number): ReportGroup | undefined {
  if (item.report?.submittedAt !== undefined) {
    return item.report.confirmedAt === undefined ? '確認待ち' : '確認済み'
  }
  if (item.slot && Date.parse(`${item.slot.date}T${item.slot.end}:00+09:00`) < now) return '未報告'
}

export const workStatus = (item: Case) => item.report?.submittedAt !== undefined ? '完了' : item.slot ? '予定済み' : '未手配'
export const reportStatus = (item: Case) => item.report?.submittedAt === undefined ? '未提出' : item.report.confirmedAt === undefined ? '確認待ち' : '確認済み'

export function checkPhoto(photo: Pick<Blob, 'type' | 'size'>, count: number) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) return '対応形式はJPEG、PNG、WebPです。'
  if (photo.size === 0 || photo.size > 10_000_000) return '写真は1枚10MB以内の画像を選んでください。'
  if (count >= 10) return '写真は1台につき合計10枚まで追加できます。'
}

const imageHeaders: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': bytes => startsWith(bytes, [0xff, 0xd8, 0xff]),
  'image/png': bytes => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': bytes => startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50]),
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte)
}

export async function checkPhotoContents(photo: Blob, decode: (photo: Blob) => Promise<void>) {
  try {
    const bytes = new Uint8Array(await photo.slice(0, 12).arrayBuffer())
    if (!imageHeaders[photo.type]?.(bytes)) return '画像の形式を確認できません。JPEG、PNG、WebPの画像を選んでください。'
    await decode(photo)
  } catch {
    return '写真を読み取れません。別の写真を選んでください。'
  }
}
