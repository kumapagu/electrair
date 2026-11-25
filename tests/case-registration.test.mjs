import assert from 'node:assert/strict'
import test from 'node:test'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { createCaseStore } from '../src/domain/storage.ts'
import * as workflow from '../src/domain/workflow.ts'

const input = { client: '試験家電', site: '試験ハイツ', address: '', note: '' }
const slot = { date: '2026-11-24', start: '09:00', end: '11:00', worker: '田中' }
const existing = { ...input, id: 'EL-101', address: '架空市青葉町', area: '青葉町', equipment: 'リビングの機器', slot }

function openStore(seed = [existing]) {
  const factory = new IDBFactory()
  return () => createCaseStore(factory, 'case-registration', () => seed)
}

test('P16: registration reports each missing or whitespace-only required field', () => {
  assert.match(workflow.registrationErrors({ ...input, client: ' \t　' }).client, /元請け/u)
  assert.match(workflow.registrationErrors({ ...input, site: '' }).site, /現場名/u)
  const both = workflow.registrationErrors({ ...input, client: '', site: '  ' })
  assert.match(both.client, /元請け/u)
  assert.match(both.site, /現場名/u)
  assert.deepEqual(workflow.registrationErrors(input), {})
})

test('P15: a minimal registration is returned as unassigned and survives reopening', async () => {
  const open = openStore()
  const [original] = await open().load()
  const records = await open().registerCase({ ...input, client: ` ${input.client} `, site: ` ${input.site} ` })
  assert.equal(records.length, 2)
  assert.deepEqual(records.find(item => item.id === original.id), original)
  const created = records.find(item => item.id !== original.id)
  assert.ok(created.id)
  assert.equal(created.client, input.client)
  assert.equal(created.site, input.site)
  assert.equal(created.address, '')
  assert.equal(created.note, '')
  assert.ok(Number.isFinite(created.createdAt))
  assert.equal(workflow.workStatus(created), '未手配')
  assert.equal(workflow.reportStatus(created), '未提出')
  assert.deepEqual((await open().load()).find(item => item.id === created.id), created)
})

test('P14 and P15: same-name requests remain distinct until sample reset', async () => {
  const open = openStore()
  const address = '架空市試験町1'
  const note = '室外機はベランダ'
  await open().registerCase({ ...input, address: ` ${address} `, note: ` ${note} ` })
  await open().registerCase(input)
  const all = await open().load()
  assert.equal(all.length, 3)
  assert.equal(new Set(all.map(item => item.id)).size, 3)
  const withDetails = all.find(item => item.id !== existing.id && item.address)
  assert.equal(withDetails.address, address)
  assert.equal(withDetails.note, note)
  await open().reset()
  assert.deepEqual((await open().load()).map(item => item.id), [existing.id])
})

test('P16: rejected registration leaves storage intact and retry creates one record', async t => {
  const open = openStore()
  const original = await open().load()
  await assert.rejects(() => open().registerCase({ ...input, client: ' ' }), /元請け/u)
  assert.deepEqual(await open().load(), original)

  const add = IDBObjectStore.prototype.add
  const failure = t.mock.method(IDBObjectStore.prototype, 'add', function (...args) {
    const request = add.apply(this, args)
    request.addEventListener('success', () => this.transaction.abort(), { once: true })
    return request
  })
  try {
    await assert.rejects(() => open().registerCase(input))
    assert.equal(failure.mock.callCount(), 1)
    assert.deepEqual(await open().load(), original)
  } finally {
    failure.mock.restore()
  }

  await open().registerCase(input)
  const reloaded = await open().load()
  assert.equal(reloaded.length, 2)
  assert.deepEqual(reloaded.find(item => item.id === existing.id), original[0])
  assert.equal(reloaded.filter(item => item.id !== existing.id && item.site === input.site).length, 1)
})

test('P01, P02 and P04: address and assignment commit together only on a valid slot', async () => {
  const unassigned = { ...input, id: 'EL-102', area: '', equipment: '1台' }
  const open = openStore([existing, unassigned])
  const initial = await open().load()
  const pending = initial.find(item => item.id === unassigned.id)
  const address = '架空市試験町1'
  const nextSlot = { ...slot, start: '11:00', end: '13:00' }
  const assign = (next, supplement) => open().update(pending, (item, cases) => workflow.assignCase(cases, item, next, supplement))

  await assert.rejects(() => assign(nextSlot, '　 '), /住所/u)
  await assert.rejects(() => assign(slot, address), /重複/u)
  assert.deepEqual(await open().load(), initial)

  await assign(nextSlot, ` ${address} `)
  const saved = await open().load()
  const assigned = saved.find(item => item.id === pending.id)
  assert.equal(assigned.address, address)
  assert.deepEqual(assigned.slot, nextSlot)
  assert.equal(workflow.workStatus(assigned), '予定済み')
  assert.ok(workflow.workerCases(saved, nextSlot.worker, nextSlot.date).some(item => item.id === assigned.id))
  assert.ok(!workflow.workerCases(saved, '佐藤', nextSlot.date).some(item => item.id === assigned.id))
})
