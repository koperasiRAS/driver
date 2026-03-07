import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return (
    <DashboardShell
      userName={profile.full_name}
      role={profile.role}
    >
      {children}
    </DashboardShell>
  )
}
