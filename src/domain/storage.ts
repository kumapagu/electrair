import { revisionId, type Case } from './model.ts'
import { createSampleCases } from './sample.ts'

export type StoredCase = Case & { revision: string }
const collection = 'cases'

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, 1)
    let blocked = false
    request.onupgradeneeded = () => request.result.createObjectStore(collection, { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      blocked = true
      reject(new Error('別のタブが保存領域を使用しています。閉じてから再試行してください。'))
    }
    request.onsuccess = () => {
      const database = request.result
      if (blocked) database.close()
      else resolve(database)
    }
  })
}

export function createCaseStore(factory: IDBFactory, name = 'electrair', seed = createSampleCases) {
  async function transact(change: (store: IDBObjectStore, cases: StoredCase[]) => StoredCase[]) {
    const database = await openDatabase(factory, name)
    try {
      return await new Promise<StoredCase[]>((resolve, reject) => {
        const transaction = database.transaction(collection, 'readwrite')
        const store = transaction.objectStore(collection)
        const request = store.getAll()
        let result: StoredCase[] = []
        let failure: unknown

        transaction.oncomplete = () => resolve(result)
        transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('保存が中断されました。'))
        request.onsuccess = () => {
          try {
            result = change(store, request.result as StoredCase[])
          } catch (error) {
            failure = error
            transaction.abort()
          }
        }
      })
    } finally {
      database.close()
    }
  }

  function addSampleCases(store: IDBObjectStore) {
    const cases = seed().map(item => ({ ...item, revision: revisionId() }))
    for (const item of cases) store.add(item)
    return cases
  }

  return {
    load: () => transact((store, cases) => cases.length ? cases : addSampleCases(store)),
    reset: () => transact(store => {
      store.clear()
      return addSampleCases(store)
    }),
    update: (expected: StoredCase, change: (item: StoredCase, cases: StoredCase[]) => Case) => transact((store, cases) => {
      const current = cases.find(item => item.id === expected.id)
      if (!current || current.revision !== expected.revision) throw new Error('別の操作で案件が更新されました。最新の案件を読み込んでください。')
      const next = { ...change(current, cases), revision: revisionId() }
      store.put(next)
      return cases.map(item => item.id === next.id ? next : item)
    }),
  }
}
