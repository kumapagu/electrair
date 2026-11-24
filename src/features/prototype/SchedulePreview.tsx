import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge, Button, Field, Select } from '../../components/ui/controls'
import { addDays, formatDay, shortDay, staff, weekday, type Slot, type Worker } from '../../domain/model'
import type { StoredCase } from '../../domain/storage'
import { workStatus } from '../../domain/workflow'
import { CaseStatuses } from './CaseDetails'
import { UnassignedCaseCard } from './UnassignedCaseCard'

function firstDayOfWeek(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return addDays(date, -((weekday + 6) % 7))
}

function ScheduleDialog({ item, date, onClose, onSave }: {
  item: StoredCase; date: string; onClose: () => void; onSave: (slot: Slot) => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [slot, setSlot] = useState<Slot>(item.slot ?? { date, start: '09:00', end: '11:00', worker: staff[0] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitted = workStatus(item) === '完了'
  const timeError = error.startsWith('終了時刻') || error.startsWith('開始時刻')
  useEffect(() => { dialog.current?.showModal() }, [])

  function update<K extends keyof Slot>(key: K, value: Slot[K]) {
    setSlot({ ...slot, [key]: value })
    setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || submitted) return
    setSaving(true)
    setError('')
    try {
      await onSave(slot)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '割当の保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} onCancel={event => { if (saving) event.preventDefault(); else onClose() }} aria-labelledby="slot-title" className="preview-dialog">
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div><p className="meta">{item.id} · {item.client}</p><h2 id="slot-title">{item.site}</h2></div>
          <Button variant="ghost" aria-label="閉じる" onClick={onClose} disabled={saving} className="px-3"><X size={20} aria-hidden="true" /></Button>
        </div>
        <p className="meta flex items-start gap-2"><MapPin size={16} aria-hidden="true" />{item.address}</p>
        <p className="mt-2 text-sm">エアコン入替 · {item.equipment}</p>
        <p className="mt-1 mb-3 text-sm">{item.note}</p>
        <div className="mb-4"><CaseStatuses item={item} /></div>
        <div className="grid gap-3">
          {submitted && <p className="notice">報告を提出済みです。日程・担当は閲覧できます。</p>}
          {item.report && !submitted && <p className="notice">保存済みの下書きがあります。担当を変更すると新しい担当者に引き継がれます。</p>}
          <fieldset className="grid min-w-0 gap-3" disabled={submitted || saving}>
            <Field label="工事日"><input type="date" required value={slot.date} onChange={event => update('date', event.target.value)} /></Field>
            <div className="grid min-w-0 grid-cols-2 gap-3">
              <Field label="開始時刻"><input type="time" required aria-describedby={timeError ? 'slot-time-error' : undefined} value={slot.start} onChange={event => update('start', event.target.value)} /></Field>
              <Field label="終了時刻"><input type="time" required aria-invalid={timeError || undefined} aria-describedby={timeError ? 'slot-time-error' : undefined} value={slot.end} onChange={event => update('end', event.target.value)} /></Field>
            </div>
            {timeError && <p id="slot-time-error" role="alert" className="error">{error}</p>}
            <Field label="担当作業員">
              <Select value={slot.worker} onChange={event => update('worker', event.target.value as Worker)}>
                {staff.map(worker => <option key={worker}>{worker}</option>)}
              </Select>
            </Field>
          </fieldset>
          {error && !timeError && <p role="alert" className="error">{error}</p>}
        </div>
        {!submitted && <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>キャンセル</Button><Button type="submit" disabled={saving}>{saving ? '保存中' : item.slot ? '変更を保存' : '割当を保存'}</Button>
        </div>}
      </form>
    </dialog>
  )
}

export function Schedule({ cases, today, onSave }: { cases: StoredCase[]; today: string; onSave: (item: StoredCase, slot: Slot) => Promise<void> }) {
  const [date, setDate] = useState(today)
  const [editing, setEditing] = useState<StoredCase>()
  const week = Array.from({ length: 7 }, (_, index) => addDays(firstDayOfWeek(date), index))
  const unassigned = cases.filter(item => !item.slot)
  const scheduled = cases.filter(item => item.slot?.date === date)

  return (
    <>
      <div className="page-heading"><h1>予定・割当</h1><p>未割当案件と担当者の予定を見比べて、工事枠を決めます。</p></div>
      <div className="schedule-layout">
        <section className="panel" aria-labelledby="unassigned-heading">
          <div className="section-heading"><h2 id="unassigned-heading">未割当案件</h2><Badge tone="amber">{unassigned.length}件</Badge></div>
          <div className="grid gap-3">
            {unassigned.length === 0 && <p className="meta">未割当の案件はありません。</p>}
            {unassigned.map(item => <UnassignedCaseCard key={item.id} item={item} onAssign={() => setEditing(item)} />)}
          </div>
        </section>
        <section className="panel schedule-board" aria-labelledby="schedule-heading">
          <div className="section-heading">
            <h2 id="schedule-heading"><CalendarDays size={19} aria-hidden="true" />担当別の予定</h2>
            <div className="week-actions">
              <Button variant="outline" aria-label="前の週" className="px-2" onClick={() => setDate(addDays(date, -7))}><ChevronLeft size={19} aria-hidden="true" /></Button>
              <Button variant="outline" className="px-3" onClick={() => setDate(today)}>今日</Button>
              <Button variant="outline" aria-label="次の週" className="px-2" onClick={() => setDate(addDays(date, 7))}><ChevronRight size={19} aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="week-strip" aria-label="表示日">
            {week.map(day => <button type="button" key={day} aria-label={formatDay(day)} aria-pressed={day === date} onClick={() => setDate(day)}>
              <span>{weekday(day)}</span><strong>{shortDay(day)}</strong>
            </button>)}
          </div>
          <div className="board-date"><h3>{formatDay(date)}</h3><span className="meta">{scheduled.length}件の予定</span></div>
          <div className="staff-grid">
            {staff.map(worker => {
              const assigned = scheduled.filter(item => item.slot?.worker === worker)
                .sort((a, b) => a.slot!.start.localeCompare(b.slot!.start))
              return <section key={worker} className="staff-card" aria-label={`${worker}さんの予定`}>
                <h4><span className="avatar" aria-hidden="true">{worker[0]}</span>{worker}さん</h4>
                {assigned.length === 0 && <p className="staff-empty">予定なし</p>}
                {assigned.map(item => <div key={item.id} className="slot-card">
                  <div className="slot-time"><Clock3 size={15} aria-hidden="true" />{item.slot!.start}–{item.slot!.end}</div>
                  <div className="font-bold">{item.site}</div>
                  <div className="slot-actions"><span className="meta">{item.area}</span>
                    <Button variant="ghost" className="px-2" onClick={() => setEditing(item)}>{workStatus(item) === '完了' ? '詳細を見る' : '日程・担当を変更'}</Button></div>
                </div>)}
              </section>
            })}
          </div>
          <p className="schedule-note">重複確認は工事時間のみ。移動・休憩・休日・出勤可否は別途確認してください。</p>
        </section>
      </div>
      {editing && <ScheduleDialog item={editing} date={date} onClose={() => setEditing(undefined)} onSave={async slot => {
        await onSave(editing, slot)
        setDate(slot.date)
        setEditing(undefined)
      }} />}
    </>
  )
}
