import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, Button, Field, Select } from '../../../../src/components/ui/controls'
import { formatDay, revisionId, staff, todayInJst, type Worker } from '../../../../src/domain/model'
import { createSampleCases } from '../../../../src/domain/sample'
import type { StoredCase } from '../../../../src/domain/storage'
import { applyReport, assignCase, workerCases } from '../../../../src/domain/workflow'
import { CaseStatuses } from '../../../../src/features/prototype/CaseDetails'
import { ReportForm } from '../../../../src/features/prototype/ReportForm'
import { UnassignedCaseCard } from '../../../../src/features/prototype/UnassignedCaseCard'
import { WorkerJobs } from '../../../../src/features/prototype/WorkerJobs'
import '../../../../src/styles/index.css'

type Page = 'cases' | 'schedule' | 'worker'
type Edit = 'register' | StoredCase
const today = todayInJst()

function CaseDialog({ edit, cases, onClose, onSave }: {
  edit: Edit; cases: StoredCase[]; onClose: () => void; onSave: (item: StoredCase) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const registering = edit === 'register'
  const needsAddress = !registering && !edit.address
  useEffect(() => { dialog.current?.showModal() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '').trim()
    if (registering) {
      const missing = [!value('client') && '元請け', !value('site') && '現場名'].filter(Boolean)
      if (missing.length) {
        setError(`${missing.join('・')}を入力してください。`)
        return
      }
      const id = revisionId()
      onSave({ id: `EL-${id.slice(0, 8)}`, revision: id, client: value('client'),
        site: value('site'), address: value('address'), note: value('note'), area: '', equipment: '1台' })
      return
    }
    try {
      const item = { ...edit, address: needsAddress ? value('address') : edit.address }
      const scheduled = assignCase(cases, item, {
        date: value('date'), start: value('start'), end: value('end'), worker: value('worker') as Worker,
      })
      onSave({ ...scheduled, revision: edit.revision })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '割当を保存できませんでした。')
    }
  }

  return <dialog ref={dialog} className="preview-dialog" aria-labelledby="edit-title" onCancel={onClose}>
    <form onSubmit={submit} className="grid gap-3">
      <div className="dialog-heading"><h2 id="edit-title">{registering ? '新規案件を登録' : '日時・担当を設定'}</h2></div>
      {registering ? <>
        <Field label="元請け（必須）"><input name="client" required /></Field>
        <Field label="現場名（必須）"><input name="site" required /></Field>
        <Field label="現場住所（任意）"><input name="address" /></Field>
        <Field label="依頼メモ（任意）"><textarea name="note" rows={2} /></Field>
      </> : <>
        <p className="font-bold">{edit.site}</p>
        {needsAddress
          ? <Field label="現場住所（必須）"><input name="address" required /></Field>
          : <p className="meta">{edit.address}</p>}
        <Field label="工事日"><input name="date" type="date" required defaultValue={today} /></Field>
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <Field label="開始時刻"><input name="start" type="time" required defaultValue="09:00" /></Field>
          <Field label="終了時刻"><input name="end" type="time" required defaultValue="11:00" /></Field>
        </div>
        <Field label="担当作業員"><Select name="worker">{staff.map(worker => <option key={worker}>{worker}</option>)}</Select></Field>
      </>}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>キャンセル</Button>
        <Button type="submit">{registering ? '案件を登録' : '割当を保存'}</Button>
      </div>
    </form>
  </dialog>
}

function Preview() {
  const [cases, setCases] = useState(() => createSampleCases().map(item => ({ ...item, revision: item.id })))
  const [page, setPage] = useState<Page>('cases')
  const [edit, setEdit] = useState<Edit>()
  const [worker, setWorker] = useState<Worker>(staff[0])
  const [jobId, setJobId] = useState<string>()
  const [reading, setReading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const job = cases.find(item => item.id === jobId)

  function navigate(next: Page) {
    if (reading || (dirty && !window.confirm('未保存の入力を破棄しますか？'))) return
    setDirty(false)
    setJobId(undefined)
    setNotice('')
    setPage(next)
  }

  function save(item: StoredCase) {
    setCases(current => current.some(record => record.id === item.id)
      ? current.map(record => record.id === item.id ? item : record)
      : [item, ...current])
    setNotice(edit === 'register' ? `「${item.site}」を登録しました。` : `「${item.site}」の割当を保存しました。`)
    setEdit(undefined)
  }

  return <div className="app-shell">
    <header className="app-header"><div className="brand">electrair</div></header>
    <aside className="sidebar">
      <nav className="preview-nav" aria-label="設計見本のメニュー">
        <button aria-current={page === 'cases' ? 'page' : undefined} onClick={() => navigate('cases')}>案件一覧</button>
        <button aria-current={page === 'schedule' ? 'page' : undefined} onClick={() => navigate('schedule')}>予定・割当</button>
        <button aria-current={page === 'worker' ? 'page' : undefined} onClick={() => navigate('worker')}>今日の案件</button>
      </nav>
    </aside>
    <main className="workspace"><div className="workspace-inner">
      <p className="preview-note mb-4">設計確認用の見本です。架空データを使用し、再読み込みすると初期状態に戻ります。</p>
      {notice && <p role="status" className="notice mb-4">{notice}</p>}
      {page === 'cases' && <>
        <div className="page-heading flex flex-wrap items-center justify-between gap-3">
          <h1>案件一覧</h1><Button onClick={() => setEdit('register')}>新規案件を登録</Button>
        </div>
        <section className="panel grid gap-3 sm:grid-cols-2" aria-label="登録済みの案件">
          {cases.map(item => <article className="case-card wrap-anywhere" key={item.id}>
            <p className="meta">{item.client}</p><h3>{item.site}</h3>
            <p className="meta mb-2">{item.slot
              ? `${formatDay(item.slot.date)} ${item.slot.start}–${item.slot.end} · ${item.slot.worker}さん`
              : item.address || '住所未入力'}</p>
            <CaseStatuses item={item} />
            {!item.slot && <Button variant="outline" className="mt-3" onClick={() => setEdit(item)}>日時・担当を設定</Button>}
          </article>)}
        </section>
      </>}
      {page === 'schedule' && <>
        <div className="page-heading"><h1>予定・割当</h1></div>
        <div className="schedule-layout">
          <section className="panel" aria-label="未割当案件">
            <div className="section-heading"><h2>未割当案件</h2><Badge tone="amber">{cases.filter(item => !item.slot).length}件</Badge></div>
            <div className="grid gap-3">{cases.filter(item => !item.slot).map(item =>
              <UnassignedCaseCard key={item.id} item={{ ...item, area: item.area || item.address || '住所未入力' }} onAssign={() => setEdit(item)} />)}</div>
          </section>
          <section className="panel" aria-label="担当別の予定">
            <div className="section-heading"><h2>担当別の予定</h2><span className="meta">{formatDay(today)}</span></div>
            <div className="staff-grid">{staff.map(name => <section className="staff-card" key={name}>
              <h4>{name}さん</h4>
              {workerCases(cases, name, today).map(item => <p key={item.id} className="slot-card">{item.slot?.start}–{item.slot?.end} {item.site}</p>)}
            </section>)}</div>
          </section>
        </div>
      </>}
      {page === 'worker' && (job ? <ReportForm item={job} busy={false} reading={reading} onReading={setReading}
        onDirty={setDirty} onBack={() => navigate('worker')} onSave={async (draft, submit) => {
          const item = applyReport(job, worker, draft, submit ? Date.now() : undefined)
          setCases(current => current.map(record => record.id === job.id ? { ...item, revision: job.revision } : record))
          setDirty(false)
          setJobId(undefined)
          setNotice(submit ? '報告を提出しました。' : '下書きを保存しました。')
        }} /> : <WorkerJobs jobs={workerCases(cases, worker, today)} day={today} worker={worker}
          onWorkerChange={setWorker} onOpen={setJobId} />)}
    </div></main>
    {edit && <CaseDialog edit={edit} cases={cases} onClose={() => setEdit(undefined)} onSave={save} />}
  </div>
}

createRoot(document.getElementById('root')!).render(<Preview />)
