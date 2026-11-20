import { ArrowLeft, Check, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button } from '../../components/ui/controls'
import { formatDay, photoCategories, reportGroups, type ReportGroup } from '../../domain/model'
import type { StoredCase } from '../../domain/storage'
import { reportGroup } from '../../domain/workflow'
import { CaseDetails } from './CaseDetails'
import { PhotoField } from './PhotoField'

export function AdminReports({ cases, now, busy, onConfirm }: {
  cases: StoredCase[]; now: number; busy: boolean; onConfirm: (item: StoredCase) => Promise<void>
}) {
  const [group, setGroup] = useState<ReportGroup>('確認待ち')
  const [selected, setSelected] = useState<string>()
  const [error, setError] = useState('')
  const groups = reportGroups.map(name => ({ name, items: cases.filter(item => reportGroup(item, now) === name) }))
  const item = cases.find(current => current.id === selected)
  const draft = item?.report?.draft

  async function confirm(current: StoredCase) {
    if (busy) return
    setError('')
    try {
      await onConfirm(current)
      setGroup('確認済み')
      setSelected(undefined)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '報告の確認に失敗しました。')
    }
  }

  return (
    <>
      {item && <Button variant="ghost" className="mb-2 px-0" disabled={busy} onClick={() => { setSelected(undefined); setError('') }}><ArrowLeft size={17} aria-hidden="true" />報告一覧に戻る</Button>}
      <div className="page-heading"><h1>{item ? '報告の詳細' : '報告確認'}</h1><p>{item ? '現場情報と報告の内容' : '未報告の案件と、提出された報告を確認します。'}</p></div>
      {item ? <div className="report-layout">
        <CaseDetails item={item} />
        <div className="report-content">
          <section className="panel" aria-labelledby="admin-report-heading">
            <div className="section-heading"><h2 id="admin-report-heading"><ClipboardList size={19} aria-hidden="true" />提出内容</h2></div>
            {item.report?.submittedAt !== undefined && draft ? <div className="grid gap-4">
              <div className="photo-grid">{photoCategories.map(category => <PhotoField key={category} label={category} photos={draft.photos.filter(photo => photo.category === category)} readOnly />)}</div>
              <dl className="admin-draft">
                <dt>作業結果</dt><dd>完了</dd>
                <dt>作業メモ</dt><dd>{draft.memo || '記入なし'}</dd>
                <dt>型番</dt><dd>{draft.model || '記入なし'}</dd>
                <dt>製造番号</dt><dd>{draft.serial || '記入なし'}</dd>
              </dl>
            </div> : <p className="meta">作業員からの報告はまだ提出されていません。</p>}
          </section>
          {error && <p role="alert" className="error">{error}</p>}
          {reportGroup(item, now) === '確認待ち' && <Button className="justify-self-end" disabled={busy} onClick={() => void confirm(item)}>
            <Check size={17} aria-hidden="true" />{busy ? '保存中' : '確認済みにする'}
          </Button>}
        </div>
      </div> : <section className="panel grid gap-4" aria-label="報告一覧">
        <div className="report-groups" aria-label="報告の状態">
          {groups.map(({ name, items }) => <Button key={name} variant={group === name ? 'primary' : 'outline'} className="px-2" aria-pressed={group === name} onClick={() => setGroup(name)}>{name} {items.length}件</Button>)}
        </div>
        {groups.filter(entry => entry.name === group).map(({ items }) => items.length ? <div key={group} className="staff-grid">
          {items.map(current => <article className="case-card" key={current.id}>
            <div className="section-heading"><p className="meta">{current.id} · {current.client}</p><Badge tone={group === '未報告' ? 'amber' : group === '確認待ち' ? 'blue' : 'green'}>{group}</Badge></div>
            <h3>{current.site}</h3>
            {current.slot && <p className="meta">{formatDay(current.slot.date)} {current.slot.end}終了 · {current.slot.worker}さん</p>}
            <Button variant="outline" className="mt-3" onClick={() => setSelected(current.id)}>{group === '未報告' ? '案件の詳細を見る' : '報告を見る'}</Button>
          </article>)}
        </div> : <p key={group} className="meta">{group}の案件はありません。</p>)}
      </section>}
    </>
  )
}
