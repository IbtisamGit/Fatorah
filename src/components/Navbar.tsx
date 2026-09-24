'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from '@/i18n/routing'
import { Button } from './ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

// Map route segments → bilingual page labels
const PAGE_LABELS: Record<string, { ar: string; en: string }> = {
  dashboard:  { ar: 'نظرة عامة',     en: 'Overview' },
  expenses:   { ar: 'سجل المصروفات', en: 'Expenses' },
  scanner:    { ar: 'الماسح الضوئي', en: 'Scanner' },
  analytics:  { ar: 'التقارير',      en: 'Analytics' },
  categories: { ar: 'التصنيفات',     en: 'Categories' },
  settings:   { ar: 'الإعدادات',     en: 'Settings' },
}

interface NavbarProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  onMobileMenuOpen: () => void
}

export function Navbar({ userEmail, userName, userAvatar, onMobileMenuOpen }: NavbarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const t        = useTranslations('Sidebar')
  const locale   = useLocale()
  const isAr     = locale === 'ar'

  // Derive page title from the last route segment
  const segments  = pathname.split('/').filter(Boolean)
  const lastSeg   = segments[segments.length - 1] ?? 'dashboard'
  const pageLabel = PAGE_LABELS[lastSeg]?.[isAr ? 'ar' : 'en'] ?? lastSeg

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Avatar initials from name or email
  const displayString = userName || userEmail || '?'
  const initials = displayString.charAt(0).toUpperCase()

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold text-slate-700 dark:text-slate-100">{pageLabel}</h1>
      </div>

      {/* Right: User avatar + info + logout */}
      <div className="flex items-center gap-3">
        
        {/* User Info & Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Email / Name — hidden on small screens */}
          <div className="hidden sm:flex flex-col items-end justify-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[150px] truncate leading-tight">
              {userName || userEmail}
            </span>
            {userName && (
              <span className="text-xs text-slate-400 max-w-[150px] truncate leading-tight">
                {userEmail}
              </span>
            )}
          </div>

          {/* Avatar circle */}
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 dark:border-emerald-700/50">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{initials}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5 h-9 px-3 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{t('logout')}</span>
        </Button>
      </div>
    </header>
  )
}
