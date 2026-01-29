import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar profile={profile} />
      <main className="lg:pl-64 transition-all duration-200">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6 min-h-screen">{children}</div>
      </main>
    </div>
  )
}
