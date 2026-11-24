import type { Meta, StoryObj } from '@storybook/react-vite'
import { UnassignedCaseCard } from './UnassignedCaseCard'
import { createSampleCases } from '../../domain/sample'

const meta = { title: '共通部品/未割当案件カード', component: UnassignedCaseCard } satisfies Meta<typeof UnassignedCaseCard>
export default meta

export const Unassigned: StoryObj<typeof meta> = { args: { item: createSampleCases()[0], onAssign: () => {} } }
