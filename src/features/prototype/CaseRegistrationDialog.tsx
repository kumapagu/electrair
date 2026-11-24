import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Field } from '../../components/ui/controls'
import type { Registration } from '../../domain/model'
import { registrationErrors } from '../../domain/workflow'

export function CaseRegistrationDialog({ onClose, onSave }: {
  onClose: () => void; onSave: (input: Registration) => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof registrationErrors>>({})
  const [saveError, setSaveError] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (name: keyof Registration) => String(data.get(name) ?? '')
    const input = { client: value('client'), site: value('site'), address: value('address'), note: value('note') }
    const issues = registrationErrors(input)
    setErrors(issues)
    setSaveError('')
    if (issues.client || issues.site) {
      const field = form.elements.namedItem(issues.client ? 'client' : 'site')
      if (field instanceof HTMLElement) field.focus()
      return
    }

    pending.current = true
    setSaving(true)
    try {
      await onSave(input)
    } catch (failure) {
      setSaveError(failure instanceof Error ? failure.message : '案件を保存できませんでした。')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <dialog ref={dialog} className="preview-dialog" aria-labelledby="registration-title"
    onCancel={event => { if (pending.current) event.preventDefault(); else onClose() }}>
    <div className="dialog-heading"><h2 id="registration-title">新規案件を登録</h2></div>
    <form noValidate onSubmit={submit}>
      <fieldset disabled={saving} className="grid min-w-0 gap-3">
        <Field label="元請け（必須）"><input name="client" required aria-invalid={Boolean(errors.client) || undefined}
          aria-describedby={errors.client ? 'registration-client-error' : undefined}
          onChange={() => { if (errors.client) setErrors(current => ({ ...current, client: undefined })) }} /></Field>
        {errors.client && <p id="registration-client-error" role="alert" className="error">{errors.client}</p>}
        <Field label="現場名（必須）"><input name="site" required aria-invalid={Boolean(errors.site) || undefined}
          aria-describedby={errors.site ? 'registration-site-error' : undefined}
          onChange={() => { if (errors.site) setErrors(current => ({ ...current, site: undefined })) }} /></Field>
        {errors.site && <p id="registration-site-error" role="alert" className="error">{errors.site}</p>}
        <Field label="現場住所（任意）"><input name="address" /></Field>
        <Field label="依頼メモ（任意）"><textarea name="note" rows={2} /></Field>
      </fieldset>
      {saveError && <p role="alert" className="error mt-3">{saveError}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving} onClick={onClose}>キャンセル</Button>
        <Button type="submit" disabled={saving}>{saving ? '登録中' : '案件を登録'}</Button>
      </div>
    </form>
  </dialog>
}
