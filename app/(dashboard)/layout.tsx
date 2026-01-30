import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'

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
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-50 relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 decoration-dots opacity-30 pointer-events-none" />

      {/* Decorative gradient orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-honey-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-coffee-200/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <Sidebar profile={profile} />
      <Header profile={profile} />
      <main className="lg:pl-64 transition-all duration-300 relative">
        <div className="p-4 lg:p-8 pt-20 lg:pt-24 min-h-screen animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
