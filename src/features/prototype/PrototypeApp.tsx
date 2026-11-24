import { CalendarDays, Check, ClipboardList, RotateCcw, Wind } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/controls'
import { staff, todayInJst, type Worker } from '../../domain/model'
import { createCaseStore, type StoredCase } from '../../domain/storage'
import { applyReport, assignCase, confirmReport, workerCases } from '../../domain/workflow'
import { AdminReports } from './AdminReports'
import { ReportForm } from './ReportForm'
import { Schedule } from './SchedulePreview'
import { WorkerJobs } from './WorkerJobs'

const database = createCaseStore(window.indexedDB)

function storageError(error: unknown) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'ブラウザの保存容量が不足しています。空き容量を確認してください。'
  if (error instanceof DOMException || !(error instanceof Error)) return 'ブラウザの保存領域を利用できませんでした。もう一度お試しください。'
  return error.message
}

function ResetDialog({ busy, error, onClose, onReset }: { busy: boolean; error: string; onClose: () => void; onReset: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="preview-dialog" aria-labelledby="reset-title" onCancel={event => { if (busy) event.preventDefault(); else onClose() }}>
    <div className="dialog-heading"><h2 id="reset-title">初期サンプルに戻しますか？</h2></div>
    <p className="text-sm">このブラウザに保存された割当の変更、報告、下書き、追加写真を消去し、架空のサンプルを作り直します。</p>
    {error && <p role="alert" className="error mt-3">{error}</p>}
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <Button variant="outline" disabled={busy} onClick={onClose}>キャンセル</Button><Button disabled={busy} onClick={onReset}>{busy ? '初期化中' : '初期サンプルに戻す'}</Button>
    </div>
  </dialog>
}

export function PrototypeApp() {
  const [cases, setCases] = useState<StoredCase[]>()
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [role, setRole] = useState<'admin' | 'worker'>('admin')
  const [adminPage, setAdminPage] = useState<'schedule' | 'reports'>('schedule')
  const [worker, setWorker] = useState<Worker>(staff[0])
  const [jobId, setJobId] = useState<string>()
  const [dirty, setDirty] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetError, setResetError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [workspaceKey, setWorkspaceKey] = useState(0)
  const writeInProgress = useRef(false)
  const [now, setNow] = useState(Date.now)
  const today = todayInJst(now)
  const job = cases?.find(item => item.id === jobId && item.slot?.worker === worker)

  useEffect(() => {
    let active = true
    void database.load().then(records => { if (active) setCases(records) }, failure => { if (active) setLoadError(storageError(failure)) })
    return () => { active = false }
  }, [loadAttempt])

  useEffect(() => {
    const updateTime = () => setNow(Date.now())
    const timer = window.setInterval(updateTime, 15_000)
    window.addEventListener('focus', updateTime)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', updateTime)
    }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    if (!notice) return
    window.scrollTo(0, 0)
    const timer = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function write(action: () => Promise<StoredCase[]>, message: string) {
    if (writeInProgress.current) throw new Error('保存中です。処理が終わってからもう一度お試しください。')
    writeInProgress.current = true
    setBusy(true)
    setNotice('')
    try {
      setCases(await action())
      setNotice(message)
      setNow(Date.now())
    } catch (failure) {
      throw new Error(storageError(failure))
    } finally {
      writeInProgress.current = false
      setBusy(false)
    }
  }

  function leaveJob() {
    if (reading || writeInProgress.current || (dirty && !window.confirm('未保存の変更があります。保存せずに移動しますか？'))) return false
    setDirty(false)
    setJobId(undefined)
    return true
  }

  function selectRole(next: typeof role) {
    if (next !== role && leaveJob()) {
      setRole(next)
      setNotice('')
    }
  }

  async function reset() {
    if (writeInProgress.current) return
    setResetError('')
    try {
      await write(database.reset, '初期サンプルに戻しました。')
      setWorkspaceKey(value => value + 1)
      setResetOpen(false)
    } catch (failure) {
      setResetError(storageError(failure))
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark"><Wind size={22} aria-hidden="true" /></span>electrair</div>
        <div className="role-actions" aria-label="操作する役割">
          <Button variant={role === 'admin' ? 'primary' : 'outline'} className="px-2 sm:px-4" aria-pressed={role === 'admin'} disabled={busy || reading} onClick={() => selectRole('admin')}>管理者</Button>
          <Button variant={role === 'worker' ? 'primary' : 'outline'} className="px-2 sm:px-4" aria-pressed={role === 'worker'} disabled={busy || reading} onClick={() => selectRole('worker')}>作業員</Button>
        </div>
      </header>
      <aside className="sidebar">
        <nav aria-label="メニュー" className="preview-nav">
          {role === 'admin' ? <>
            <button type="button" aria-current={adminPage === 'schedule' ? 'page' : undefined} disabled={busy} onClick={() => setAdminPage('schedule')}><CalendarDays size={20} aria-hidden="true" />予定・割当</button>
            <button type="button" aria-current={adminPage === 'reports' ? 'page' : undefined} disabled={busy} onClick={() => setAdminPage('reports')}><ClipboardList size={20} aria-hidden="true" />報告確認</button>
          </> : <button type="button" aria-current={!job ? 'page' : undefined} disabled={busy || reading} onClick={leaveJob}><ClipboardList size={20} aria-hidden="true" />今日の案件</button>}
        </nav>
      </aside>
      <main className="workspace" id="main-content">
        <div className="workspace-inner">
          <div className="workspace-tools">
            <p className="preview-note">架空データを使用しています。データはこのブラウザに保存されます。</p>
            {role === 'admin' && cases && <Button variant="ghost" className="px-1.5" disabled={busy} onClick={() => { setNotice(''); setResetOpen(true) }}><RotateCcw size={16} aria-hidden="true" />サンプルを初期化</Button>}
          </div>
          {!cases ? (loadError ? <div className="panel grid gap-3">
            <p role="alert" className="error">案件データを読み込めませんでした。{loadError}</p>
            <Button className="justify-self-start" onClick={() => { setLoadError(''); setLoadAttempt(value => value + 1) }}>再試行</Button>
          </div> : <p role="status" className="panel">案件を読み込んでいます。</p>) : role === 'admin' ? (
            adminPage === 'schedule'
              ? <Schedule key={workspaceKey} cases={cases} today={today} onSave={(item, slot) => write(() => database.update(item, (current, all) => assignCase(all, current, slot)), `「${item.site}」の割当を保存しました。`)} />
              : <AdminReports key={workspaceKey} cases={cases} now={now} busy={busy} onConfirm={item => write(() => database.update(item, current => confirmReport(current, Date.now())), '報告を確認済みにしました。')} />
          ) : job ? <ReportForm key={job.id} item={job} busy={busy} reading={reading} onReading={setReading} onDirty={setDirty} onBack={leaveJob}
            onSave={async (draft, submit) => {
              await write(() => database.update(job, current => applyReport(current, worker, draft, submit ? Date.now() : undefined)),
                submit ? '報告を提出しました。管理者の確認待ちです。' : '下書きを保存しました。')
              setDirty(false)
              setJobId(undefined)
            }} />
            : <WorkerJobs jobs={workerCases(cases, worker, today)} day={today} worker={worker} onWorkerChange={setWorker} onOpen={setJobId} />}
        </div>
      </main>
      <div role="status" className="success-toast-region">
        {notice && <div className="success-toast"><Check size={18} aria-hidden="true" /><span>{notice}</span></div>}
      </div>
      {resetOpen && <ResetDialog busy={busy} error={resetError} onClose={() => { setResetOpen(false); setResetError('') }} onReset={() => void reset()} />}
    </div>
  )
}
