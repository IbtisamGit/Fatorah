import { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch extended profile for Navbar (name, avatar)
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { locale } = await params

  return (
    <DashboardShell 
      userEmail={user.email} 
      userName={profile?.full_name}
      userAvatar={profile?.avatar_url}
      locale={locale}
    >
      {children}
    </DashboardShell>
  )
}
