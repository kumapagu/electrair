import { MapPin, Plus } from 'lucide-react'
import { Button } from '../../components/ui/controls'
import type { Case } from '../../domain/model'

export function UnassignedCaseCard({ item, onAssign }: { item: Case; onAssign: () => void }) {
  return (
    <article className="case-card">
      <p className="meta">{item.id} · {item.client}</p>
      <h3>{item.site}</h3>
      <p className="meta flex items-center gap-1"><MapPin size={15} className="shrink-0" aria-hidden="true" />{item.area || item.address || '住所未入力'}</p>
      <Button variant="outline" className="mt-3 w-full text-[var(--primary)]" onClick={onAssign}>
        <Plus size={17} aria-hidden="true" />日時・担当を設定
      </Button>
    </article>
  )
}
