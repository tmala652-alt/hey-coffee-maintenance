import { redirect } from 'next/navigation'

export default function DisbursementDetailPage() {
  // Redirect to main page since this feature is under development
  redirect('/admin/disbursements')
}
