import { ClipboardList, Clock3, MapPin, StickyNote } from 'lucide-react'
import { Badge } from '../../components/ui/controls'
import { formatDay, type Case } from '../../domain/model'
import { reportStatus, workStatus } from '../../domain/workflow'

export function CaseStatuses({ item }: { item: Case }) {
  const work = workStatus(item)
  const report = reportStatus(item)
  return <div className="flex flex-wrap gap-1.5">
    <Badge tone={work === '完了' ? 'green' : 'gray'}>工事 {work}</Badge>
    <Badge tone={report === '確認済み' ? 'green' : report === '確認待ち' ? 'blue' : 'gray'}>報告 {report}</Badge>
  </div>
}

export function CaseDetails({ item }: { item: Case }) {
  return (
    <section className="panel site-panel" aria-labelledby="site-heading">
      <div className="section-heading">
        <h2 id="site-heading"><ClipboardList size={19} aria-hidden="true" />現場情報</h2>
        <CaseStatuses item={item} />
      </div>
      <p className="meta">{item.id} · {item.client}</p><h3 className="site-title">{item.site}</h3>
      {item.slot && <p className="site-detail"><Clock3 size={18} aria-hidden="true" /><span>{formatDay(item.slot.date)} {item.slot.start}–{item.slot.end}<br /><span className="meta">担当 {item.slot.worker}さん</span></span></p>}
      <p className="site-detail"><MapPin size={18} aria-hidden="true" />{item.address}</p>
      <p className="meta">エアコン入替 · {item.equipment}</p>
      <div className="site-note"><h4><StickyNote size={16} aria-hidden="true" />注意事項</h4><p>{item.note}</p></div>
    </section>
  )
}
