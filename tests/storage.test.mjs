import assert from 'node:assert/strict'
import test from 'node:test'
import { IDBFactory } from 'fake-indexeddb'
import { createCaseStore } from '../src/domain/storage.ts'
import { applyReport, assignCase } from '../src/domain/workflow.ts'

const seed = [{ id: 'EL-1', site: '架空案件', address: '架空市', slot: { date: '2026-11-20', start: '09:00', end: '11:00', worker: '田中' } }]
const draft = { photos: [{ id: 'before', category: '施工前', name: 'before.png', blob: new Blob(['photo'], { type: 'image/png' }) }], completed: false, memo: '保存済みのメモ', model: '', serial: '' }

test('P05 and P14: reopen restores photos and draft, reset removes both', async () => {
  const factory = new IDBFactory()
  const open = () => createCaseStore(factory, 'test', () => seed)
  const [initial] = await open().load()
  await open().update(initial, item => applyReport(item, '田中', draft))
  const [reloaded] = await open().load()
  assert.equal(await reloaded.report.draft.photos[0].blob.text(), 'photo')
  assert.equal(reloaded.report.draft.memo, draft.memo)
  assert.equal(reloaded.report.submittedAt, undefined)
  await open().reset()
  const [reset] = await open().load()
  assert.equal(reset.report, undefined)
  await assert.rejects(open().update(reloaded, item => item), /最新/u)
})

test('P13 and P14: failed reset rolls back changes and rejected writes preserve the data', async () => {
  let brokenSeed = false
  const store = createCaseStore(new IDBFactory(), 'test', () => brokenSeed ? [...seed, ...seed] : seed)
  const [initial] = await store.load()
  await store.update(initial, item => applyReport(item, '田中', draft))
  const [saved] = await store.load()
  brokenSeed = true
  await assert.rejects(store.reset())
  await assert.rejects(store.update(saved, item => ({ ...item, cannotClone: () => {} })))
  const [restored] = await store.load()
  assert.deepEqual(restored, saved)
})

test('P02 and P13: concurrent assignments use committed records and reject a stale write', async () => {
  const first = { id: 'A', site: '青葉', address: '架空市青葉町' }
  const second = { id: 'B', site: '若葉', address: '架空市若葉町' }
  const store = createCaseStore(new IDBFactory(), 'test', () => [first, second])
  const [a, b] = await store.load()
  const slot = seed[0].slot
  const results = await Promise.allSettled([a, b].map(record => store.update(record, (item, cases) => assignCase(cases, item, slot))))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.match(results.find(result => result.status === 'rejected').reason.message, /重複/u)
  const current = (await store.load()).find(item => item.slot)
  const stale = current.id === a.id ? a : b
  await assert.rejects(store.update(stale, item => item), /最新/u)
})
