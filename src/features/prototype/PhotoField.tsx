import { Camera, ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Badge, Button } from '../../components/ui/controls'
import type { Photo, PhotoCategory } from '../../domain/model'

export async function decodePhoto(photo: Blob) {
  const url = URL.createObjectURL(photo)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function PhotoThumbnail({ photo }: { photo: Photo }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(photo.blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [photo.blob])
  if (!url) return null
  return <a href={url} target="_blank" rel="noreferrer" className="photo-thumbnail" aria-label={`${photo.name}を開く`}>
    <img src={url} alt={`${photo.category}の写真`} />
  </a>
}

export function PhotoField({ label, required, photos, error, missing, disabled, readOnly, onAdd, onRemove }: {
  label: PhotoCategory; required?: boolean; photos: Photo[]; error?: string; missing?: boolean; disabled?: boolean; readOnly?: boolean
  onAdd?: (files: File[]) => void; onRemove?: (photo: Photo) => void
}) {
  const picker = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)

  function receive(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (files.length) onAdd?.(files)
  }

  return (
    <div className={`photo-field${error || missing ? ' photo-error' : ''}`}>
      <div className="flex flex-wrap items-center gap-2"><h3>{label}</h3>{!readOnly && <Badge tone={required ? 'blue' : 'gray'}>{required ? '必須' : '任意'}</Badge>}</div>
      {photos.length ? <ul className="grid gap-2">
        {photos.map(photo => <li key={photo.id} className="photo-file">
          <PhotoThumbnail photo={photo} /><span className="min-w-0 flex-1">{photo.name}</span>
          {!readOnly && <Button variant="ghost" className="px-2" aria-label={`${photo.name}を削除`} disabled={disabled} onClick={() => onRemove?.(photo)}><X size={19} aria-hidden="true" /></Button>}
        </li>)}
      </ul> : <p className="meta">{required && !readOnly ? '1枚以上' : '写真なし'}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {!readOnly && <>
        <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} className="hidden" aria-label={`${label}の写真ファイル`} onChange={receive} />
        <input ref={camera} type="file" accept="image/*" capture="environment" disabled={disabled} className="hidden" aria-label={`${label}の撮影ファイル`} onChange={receive} />
        <div className="photo-actions">
          <Button variant="outline" className="px-2 text-[var(--primary)]" disabled={disabled} onClick={() => picker.current?.click()}><ImagePlus size={16} aria-hidden="true" />写真を選ぶ<span className="sr-only">（{label}）</span></Button>
          <Button variant="outline" className="px-2 text-[var(--primary)]" disabled={disabled} onClick={() => camera.current?.click()}><Camera size={16} aria-hidden="true" />撮影<span className="sr-only">（{label}）</span></Button>
        </div>
      </>}
    </div>
  )
}
