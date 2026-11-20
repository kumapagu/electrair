import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyReport, assignCase, checkPhoto, checkPhotoContents, confirmReport, reportGroup, workerCases,
} from '../src/domain/workflow.ts'
import { beforeImage } from '../src/domain/fixture-photos.ts'

const day = '2026-11-20'
const slot = { date: day, start: '09:00', end: '11:00', worker: '田中' }
const unassigned = { id: 'A', site: '青葉', address: '架空市青葉町' }
const scheduled = { id: 'B', site: '若葉', address: '架空市若葉町', slot }
const draft = { photos: [], completed: false, memo: '', model: '', serial: '' }
const image = new Blob(['fixture'], { type: 'image/png' })
const photos = [
  { id: 'before', category: '施工前', name: 'before.png', blob: image },
  { id: 'after', category: '施工後', name: 'after.png', blob: image },
]
const now = Date.parse('2026-11-20T11:00:00+09:00')

test('P01–P03: valid assignment, overlap boundaries, invalid time and missing location', () => {
  assert.throws(() => assignCase([scheduled], unassigned, slot), /若葉/u)
  assert.throws(() => assignCase([], unassigned, { ...slot, end: slot.start }), /終了時刻/u)
  assert.throws(() => assignCase([], unassigned, { ...slot, date: '2026-02-30' }), /工事日/u)
  assert.throws(() => assignCase([], { ...unassigned, address: '' }, slot), /住所/u)
  const touching = { ...slot, start: '11:00', end: '13:00' }
  assert.deepEqual(assignCase([scheduled], unassigned, touching).slot, touching)
  assert.equal(assignCase([scheduled], scheduled, slot).id, scheduled.id)
  assert.equal(assignCase([scheduled], unassigned, { ...slot, worker: '佐藤' }).slot.worker, '佐藤')
})

test('P03–P05: reassignment preserves the draft and updates the worker’s current jobs', () => {
  const saved = applyReport(scheduled, '田中', { ...draft, photos: [photos[0]], memo: '引継ぎ' })
  const reassigned = assignCase([saved], saved, { ...slot, worker: '佐藤' })
  assert.deepEqual(reassigned.report.draft, saved.report.draft)
  assert.deepEqual(workerCases([reassigned], '田中', day), [])
  assert.deepEqual(workerCases([reassigned], '佐藤', day), [reassigned])
  assert.deepEqual(workerCases([reassigned], '佐藤', '2026-11-21'), [])
  assert.throws(() => applyReport(reassigned, '田中', draft), /担当/u)
})

test('P06, P07, P09: submission prerequisites, state lock and confirmation', () => {
  assert.throws(() => applyReport(scheduled, '田中', draft, now), /施工前.*施工後.*完了/u)
  assert.throws(() => applyReport(scheduled, '田中', { ...draft, completed: true, photos: [photos[0]] }, now), /施工後/u)
  assert.throws(() => confirmReport(scheduled, now), /確認待ち/u)
  const submitted = applyReport(scheduled, '田中', { ...draft, completed: true, photos }, now)
  assert.equal(reportGroup(submitted, now), '確認待ち')
  assert.throws(() => assignCase([], submitted, { ...slot, worker: '佐藤' }), /提出済み/u)
  assert.throws(() => applyReport(submitted, '田中', draft), /提出済み/u)
  const confirmed = confirmReport(submitted, now + 1)
  assert.equal(reportGroup(confirmed, now), '確認済み')
  assert.throws(() => confirmReport(confirmed, now + 2), /確認待ち/u)
})

test('P11: overdue uses JST and excludes the exact end boundary', () => {
  const saved = applyReport(scheduled, '田中', draft)
  assert.equal(reportGroup(saved, now), undefined)
  assert.equal(reportGroup(saved, now + 1), '未報告')
  assert.equal(reportGroup(unassigned, now + 1), undefined)
})

test('P13: formats, byte limit and per-equipment photo count', () => {
  assert.equal(checkPhoto({ type: 'image/webp', size: 10_000_000 }, 9), undefined)
  assert.match(checkPhoto({ type: 'image/heic', size: 10 }, 0), /形式/u)
  assert.match(checkPhoto({ type: 'image/jpeg', size: 10_000_001 }, 0), /10MB/u)
  assert.match(checkPhoto({ type: 'image/png', size: 10 }, 10), /10枚/u)
})

test('P06, P07 and P13: disguised or unreadable images do not count as photos', async () => {
  const valid = new Blob([Buffer.from(beforeImage, 'base64')], { type: 'image/png' })
  const disguised = new Blob(['plain text payload'], { type: 'image/jpeg' })
  assert.match(await checkPhotoContents(disguised, async () => {}), /形式/u)
  assert.match(await checkPhotoContents(valid, async () => { throw new Error('decode failed') }), /読み取れません/u)
  assert.equal(await checkPhotoContents(valid, async () => {}), undefined)
})
