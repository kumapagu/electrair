import { ClipboardList, MapPin } from 'lucide-react'
import { Badge, Button, Field, Select } from '../../components/ui/controls'
import { formatDay, staff, type Case, type Worker } from '../../domain/model'
import { reportStatus } from '../../domain/workflow'

export function WorkerJobs({ jobs, day, worker, onWorkerChange, onOpen }: {
  jobs: Case[]; day: string; worker: Worker; onWorkerChange: (worker: Worker) => void; onOpen: (id: string) => void
}) {
  return (
    <>
      <div className="page-heading"><h1>今日の案件</h1><p>{formatDay(day)}の担当案件</p></div>
      <section className="panel grid gap-4" aria-label="担当案件">
        <div className="max-w-64"><Field label="作業員を切り替える"><Select value={worker} onChange={event => onWorkerChange(event.target.value as Worker)}>
          {staff.map(name => <option key={name}>{name}</option>)}
        </Select></Field></div>
        {jobs.length ? <div className="staff-grid">{jobs.map(item => <article key={item.id} className="case-card">
          <div className="section-heading"><p className="meta">{item.slot?.start}–{item.slot?.end} · {item.id}</p><Badge>報告 {reportStatus(item)}</Badge></div>
          <h3>{item.site}</h3><p className="meta flex items-start gap-2"><MapPin size={17} aria-hidden="true" />{item.address}</p>
          <Button variant="outline" className="mt-3" onClick={() => onOpen(item.id)}><ClipboardList size={17} aria-hidden="true" />現場情報・報告を開く</Button>
        </article>)}</div> : <p className="meta">{worker}さんの今日の担当案件はありません。</p>}
      </section>
    </>
  )
}
