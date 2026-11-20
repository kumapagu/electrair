import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, Button, Field, Select } from './controls'

const meta = { title: '共通部品/操作と状態' } satisfies Meta
export default meta

export const Controls: StoryObj<typeof meta> = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <div className="flex flex-wrap gap-2">
        <Button>割当を保存</Button><Button variant="outline">下書き保存</Button><Button disabled>保存中</Button>
      </div>
      <Field label="工事日"><input type="date" defaultValue="2026-11-20" /></Field>
      <Field label="終了時刻"><input type="time" aria-invalid="true" defaultValue="09:00" /></Field>
      <Field label="担当作業員"><Select><option>田中</option><option>佐藤</option></Select></Field>
      <div className="flex flex-wrap gap-2">
        <Badge tone="amber">未報告</Badge><Badge tone="blue">確認待ち</Badge><Badge tone="green">確認済み</Badge>
      </div>
    </div>
  ),
}
