'use client'

import { AutoAssignPanel } from '@/components/assign'
import type { MaintenanceRequest } from '@/types/database.types'

interface AutoAssignSectionProps {
  request: MaintenanceRequest
}

export default function AutoAssignSection({ request }: AutoAssignSectionProps) {
  return <AutoAssignPanel request={request} />
}
