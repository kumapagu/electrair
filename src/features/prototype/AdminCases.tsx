import { useState } from 'react'
import { Button } from '../../components/ui/controls'
import { formatDay, type Registration, type Slot } from '../../domain/model'
import type { StoredCase } from '../../domain/storage'
import { CaseStatuses } from './CaseDetails'
import { CaseRegistrationDialog } from './CaseRegistrationDialog'
import { ScheduleDialog } from './SchedulePreview'

export function AdminCases({ cases, today, busy, onRegister, onAssign }: {
  cases: StoredCase[]
  today: string
  busy: boolean
  onRegister: (input: Registration) => Promise<void>
  onAssign: (item: StoredCase, slot: Slot, address?: string) => Promise<void>
}) {
  const [registering, setRegistering] = useState(false)
  const [editing, setEditing] = useState<StoredCase>()
  const ordered = [...cases].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.id.localeCompare(b.id))

  return <>
    <div className="page-heading flex flex-wrap items-center justify-between gap-3">
      <h1>案件一覧</h1><Button disabled={busy} onClick={() => setRegistering(true)}>新規案件を登録</Button>
    </div>
    <section className="panel grid gap-3 sm:grid-cols-2" aria-label="登録済みの案件">
      {!ordered.length && <p className="meta">登録された案件はありません。</p>}
      {ordered.map(item => <article key={item.id} className="case-card">
        <p className="meta">{item.client}</p>
        <h3>{item.site}</h3>
        <p className="meta mb-2">{item.slot
          ? `${formatDay(item.slot.date)} ${item.slot.start}–${item.slot.end} · ${item.slot.worker}さん`
          : item.address || '住所未入力'}</p>
        <CaseStatuses item={item} />
        {!item.slot && <Button variant="outline" className="mt-3" disabled={busy} onClick={() => setEditing(item)}>日時・担当を設定</Button>}
      </article>)}
    </section>
    {registering && <CaseRegistrationDialog onClose={() => setRegistering(false)} onSave={async input => {
      await onRegister(input)
      setRegistering(false)
    }} />}
    {editing && <ScheduleDialog item={editing} date={today} onClose={() => setEditing(undefined)} onSave={async (slot, address) => {
      await onAssign(editing, slot, address)
      setEditing(undefined)
    }} />}
  </>
}
