import { afterImage, beforeImage } from './fixture-photos.ts'
import { addDays, emptyDraft, todayInJst, type Case, type PhotoCategory } from './model.ts'

function illustration(category: PhotoCategory, encoded: string) {
  const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
  return { id: category, category, name: `${category}の見本.png`, blob: new Blob([bytes], { type: 'image/png' }) }
}

export function createSampleCases(now = Date.now()): Case[] {
  const day = todayInJst(now)
  const previousDay = addDays(day, -1)
  const earlierDay = addDays(day, -2)
  const equipment = 'リビングの機器'
  const submitted = {
    draft: { ...emptyDraft, completed: true, memo: '入替作業が完了しました。', photos: [illustration('施工前', beforeImage), illustration('施工後', afterImage)] },
    submittedAt: now - 86_400_000,
  }
  return [
    { id: 'EL-104', site: '青葉コーポ 201', area: '青葉町', client: '青空家電', address: '架空市青葉町 2-01', note: '管理室で入館手続き。室外機はベランダ設置。', equipment },
    { id: 'EL-105', site: '楓ハイツ 103', area: '楓町', client: 'みなと電器', address: '架空市楓町 1-03', note: '既設機器の撤去と入替。', equipment },
    { id: 'EL-101', site: '若葉レジデンス 302', area: '若葉町', client: '青空家電', address: '架空市若葉町 3-02', note: '室外機はベランダ設置。到着時はインターホンで呼び出す。', equipment, slot: { date: day, start: '09:00', end: '11:00', worker: '田中' } },
    { id: 'EL-102', site: '港南テラス 105', area: '港南町', client: 'みなと電器', address: '架空市港南町 1-05', note: '室内機の設置場所はリビング。', equipment, slot: { date: previousDay, start: '13:00', end: '15:00', worker: '佐藤' } },
    { id: 'EL-103', site: '桜坂メゾン 203', area: '桜坂町', client: '青空家電', address: '架空市桜坂町 2-03', note: '室内機の設置場所は寝室。', equipment: '寝室の機器', slot: { date: previousDay, start: '10:00', end: '12:00', worker: '鈴木' }, report: submitted },
    { id: 'EL-100', site: '緑丘パーク 102', area: '緑丘町', client: 'みなと電器', address: '架空市緑丘町 1-02', note: '既設機器の撤去と入替。', equipment, slot: { date: earlierDay, start: '09:00', end: '11:00', worker: '高橋' }, report: { ...submitted, submittedAt: now - 172_800_000, confirmedAt: now - 43_200_000 } },
  ]
}
