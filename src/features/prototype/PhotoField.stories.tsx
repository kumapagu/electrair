import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoField } from './PhotoField'
import { createSampleCases } from '../../domain/sample'

const meta = { title: '共通部品/写真追加欄', component: PhotoField, args: { label: '施工前', required: true, photos: [] } } satisfies Meta<typeof PhotoField>
export default meta

export const Empty: StoryObj<typeof meta> = {}
export const Added: StoryObj<typeof meta> = { args: { photos: createSampleCases().flatMap(item => item.report?.draft.photos ?? []).slice(0, 1) } }
export const Missing: StoryObj<typeof meta> = { args: { missing: true, error: '施工前の写真を追加してください。' } }
