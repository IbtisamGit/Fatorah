import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  // Fetch extended profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url, monthly_budget_limit, currency, budget_alert_percent')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      userId={user.id}
      email={user.email ?? ''}
      initialFullName={profile?.full_name ?? ''}
      initialAvatarUrl={profile?.avatar_url ?? null}
      initialBudget={profile?.monthly_budget_limit ?? null}
      initialCurrency={profile?.currency ?? 'SAR'}
      initialAlertPercent={profile?.budget_alert_percent ?? 80}
    />
  )
}
