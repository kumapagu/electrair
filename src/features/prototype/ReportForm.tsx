import { ArrowLeft, Camera, Check, ClipboardList } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Field } from '../../components/ui/controls'
import { emptyDraft, photoCategories, revisionId, type Draft, type Photo, type PhotoCategory } from '../../domain/model'
import type { StoredCase } from '../../domain/storage'
import { checkPhoto, checkPhotoContents, missingReportItems } from '../../domain/workflow'
import { CaseDetails } from './CaseDetails'
import { decodePhoto, PhotoField } from './PhotoField'

export function ReportForm({ item, busy, reading, onReading, onDirty, onBack, onSave }: {
  item: StoredCase; busy: boolean; reading: boolean; onReading: (reading: boolean) => void; onDirty: (dirty: boolean) => void; onBack: () => void
  onSave: (draft: Draft, submit: boolean) => Promise<void>
}) {
  const [draft, setDraft] = useState(item.report?.draft ?? emptyDraft)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState('')
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoCategory, string>>>({})
  const readingInProgress = useRef(false)
  const readOnly = item.report?.submittedAt !== undefined
  const disabled = busy || reading
  const missing = missingReportItems(draft)

  function change(next: Draft) {
    setDraft(next)
    onDirty(true)
    setError('')
  }

  async function addPhotos(category: PhotoCategory, files: File[]) {
    if (busy || readOnly || readingInProgress.current) return
    readingInProgress.current = true
    onReading(true)
    try {
      const photos = [...draft.photos]
      const rejected = new Set<string>()
      for (const file of files) {
        const issue = checkPhoto(file, photos.length) ?? await checkPhotoContents(file, decodePhoto)
        if (issue) rejected.add(issue)
        else photos.push({ id: revisionId(), category, name: file.name, blob: file })
      }
      setPhotoErrors(current => ({ ...current, [category]: Array.from(rejected).join(' ') }))
      if (photos.length !== draft.photos.length) change({ ...draft, photos })
    } finally {
      readingInProgress.current = false
      onReading(false)
    }
  }

  function removePhoto(photo: Photo) {
    setPhotoErrors({})
    change({ ...draft, photos: draft.photos.filter(current => current.id !== photo.id) })
  }

  async function save(submit: boolean) {
    if (busy || readOnly || readingInProgress.current) return
    setError('')
    if (submit && missing.length) {
      setAttempted(true)
      requestAnimationFrame(() => document.getElementById('report-errors')?.focus())
      return
    }
    try {
      await onSave(draft, submit)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '報告の保存に失敗しました。')
    }
  }

  return (
    <>
      <Button variant="ghost" className="mb-2 px-0" disabled={disabled} onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />今日の案件に戻る</Button>
      <div className="page-heading"><h1>作業・報告</h1><p>現場情報を確認し、施工写真と作業結果をまとめます。</p></div>
      <div className="report-layout">
        <CaseDetails item={item} />
        <div className="report-content">
          <section className="panel" aria-labelledby="photo-heading">
            <div className="section-heading"><h2 id="photo-heading"><Camera size={19} aria-hidden="true" />施工写真</h2></div>
            <p className="meta mb-4">{item.equipment}{!readOnly && ' · JPEG／PNG／WebP、1枚10MBまで'}</p>
            {reading && <p role="status" className="notice mb-3">写真を読み込んでいます。</p>}
            <div className="photo-grid">
              {photoCategories.map(category => <PhotoField key={category} label={category} required={category !== 'その他'}
                photos={draft.photos.filter(photo => photo.category === category)} error={photoErrors[category]}
                missing={attempted && missing.includes(`${category}写真`)} readOnly={readOnly} disabled={disabled}
                onAdd={files => void addPhotos(category, files)} onRemove={removePhoto} />)}
            </div>
          </section>
          <section className="panel" aria-labelledby="details-heading">
            <div className="section-heading"><h2 id="details-heading"><ClipboardList size={19} aria-hidden="true" />作業結果</h2></div>
            <fieldset className="grid gap-4" disabled={readOnly || disabled}>
              <label className="completion"><input type="checkbox" checked={draft.completed} onChange={event => change({ ...draft, completed: event.target.checked })} />工事が完了した</label>
              <Field label="作業メモ（任意）"><textarea rows={3} value={draft.memo} placeholder="作業内容や引継ぎ事項" onChange={event => change({ ...draft, memo: event.target.value })} /></Field>
              <div className="equipment-fields">
                <Field label="型番（任意）"><input value={draft.model} onChange={event => change({ ...draft, model: event.target.value })} /></Field>
                <Field label="製造番号（任意）"><input value={draft.serial} onChange={event => change({ ...draft, serial: event.target.value })} /></Field>
              </div>
            </fieldset>
          </section>
          {attempted && missing.length > 0 && <div id="report-errors" tabIndex={-1} role="alert" className="error">
            <strong>報告を提出するには、次の項目が必要です。</strong>
            <ul>{missing.map(label => <li key={label}>{label.endsWith('写真') ? `${item.equipment}の${label}` : label}</li>)}</ul>
          </div>}
          {error && <p role="alert" className="error">{error}</p>}
          {!readOnly && <div className="report-actions">
            <Button variant="outline" disabled={disabled} onClick={() => void save(false)}>{busy ? '処理中' : '下書き保存'}</Button>
            <Button disabled={disabled} onClick={() => void save(true)}><Check size={17} aria-hidden="true" />報告を提出</Button>
          </div>}
        </div>
      </div>
    </>
  )
}
