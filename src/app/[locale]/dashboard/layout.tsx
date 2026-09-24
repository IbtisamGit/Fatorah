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
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  const { locale } = await params

  return (
    <DashboardShell userEmail={data.user.email} locale={locale}>
      {children}
    </DashboardShell>
  )
}
