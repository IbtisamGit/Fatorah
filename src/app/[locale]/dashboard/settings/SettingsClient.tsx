'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { applyFontSize, type FontSizeOption } from '@/components/ThemeProvider'
import {
  User, Wallet, Lock, Palette, Globe, LogOut,
  Trash2, Camera, Check, Sun, Moon,
  ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// ─── Helper: Field ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Helper: Input ─────────────────────────────────────────────────────────────
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
        'text-sm placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
}

// ─── Helper: Save Button ───────────────────────────────────────────────────────
function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={clsx(
        'flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto',
        saved
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:-translate-y-0.5',
        loading && 'opacity-70 cursor-not-allowed'
      )}
    >
      {saved ? <Check className="w-4 h-4" /> : null}
      {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
    </button>
  )
}

// ─── Toast state helper ────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const show = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }
  return { msg, show }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  userId: string
  email: string
  initialFullName: string
  initialAvatarUrl: string | null
  initialBudget: number | null
  initialCurrency: string
  initialAlertPercent: number
}

// Define available tabs
type TabType = 'profile' | 'finance' | 'security' | 'appearance' | 'account'

export function SettingsClient({
  userId, email,
  initialFullName, initialAvatarUrl,
  initialBudget, initialCurrency, initialAlertPercent,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const { theme, setTheme } = useTheme()
  const { msg: toast, show: showToast } = useToast()

  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // ── Profile ──────────────────────────────────────────────────────────────────
  const [fullName, setFullName]     = useState(initialFullName)
  const [avatarUrl, setAvatarUrl]   = useState(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      let newAvatarUrl = avatarUrl

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${userId}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(path, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('profile-pictures').getPublicUrl(path)
        newAvatarUrl = urlData.publicUrl
        setAvatarUrl(newAvatarUrl)
      }

      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, avatar_url: newAvatarUrl })
        .eq('id', userId)
      if (error) throw error

      setProfileSaved(true)
      showToast('Profile updated successfully')
      
      // IMPORTANT: Refresh the page to update the Navbar data
      router.refresh()

      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err: any) {
      showToast(err.message ?? 'Failed to save profile', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Finance ───────────────────────────────────────────────────────────────────
  const [budget, setBudget]           = useState(initialBudget?.toString() ?? '')
  const [currency, setCurrency]       = useState(initialCurrency)
  const [alertPercent, setAlertPercent] = useState(initialAlertPercent)
  const [financeSaving, setFinanceSaving] = useState(false)
  const [financeSaved, setFinanceSaved]   = useState(false)

  const saveFinance = async (e: React.FormEvent) => {
    e.preventDefault()
    setFinanceSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          monthly_budget_limit: budget ? parseFloat(budget) : null,
          currency,
          budget_alert_percent: alertPercent,
        })
        .eq('id', userId)
      if (error) throw error
      setFinanceSaved(true)
      showToast('Finance settings saved')
      setTimeout(() => setFinanceSaved(false), 2500)
    } catch (err: any) {
      showToast(err.message ?? 'Failed to save', 'error')
    } finally {
      setFinanceSaving(false)
    }
  }

  // ── Security ──────────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) return showToast('Passwords do not match', 'error')
    if (newPw.length < 6) return showToast('Password must be at least 6 characters', 'error')
    setPwSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPw })
      if (signInError) throw new Error('Current password is incorrect')
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showToast('Password changed successfully')
    } catch (err: any) {
      showToast(err.message ?? 'Failed to change password', 'error')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Appearance ────────────────────────────────────────────────────────────────
  const [fontSize, setFontSizeState] = useState<FontSizeOption>('md')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('fatorah-font-size') as FontSizeOption) ?? 'md'
    setFontSizeState(saved)
    setMounted(true)
  }, [])

  const handleFontSize = (size: FontSizeOption) => {
    setFontSizeState(size)
    applyFontSize(size)
  }

  const toggleLanguage = () => {
    const next = locale === 'ar' ? 'en' : 'ar'
    router.replace(pathname, { locale: next })
  }

  // ── Delete Account ────────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, startDeleting] = useTransition()

  const deleteAccount = () => {
    if (deleteConfirm !== 'DELETE') return showToast('Type DELETE to confirm', 'error')
    startDeleting(async () => {
      await supabase.from('users').delete().eq('id', userId)
      await supabase.auth.signOut()
      router.push('/')
    })
  }

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (fullName || email).charAt(0).toUpperCase()

  // Tabs Configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: LogOut },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl',
          'animate-in slide-in-from-top-2 fade-in duration-200',
          toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'
        )}>
          {toast.text}
        </div>
      )}

      {/* Main Container: Top Tabs + Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* Navigation Tabs (Horizontal) */}
        <div className="flex flex-row gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-100 dark:border-slate-800">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-emerald-500" : "text-slate-400")} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* ── 1. Profile Content ── */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Public Profile</h3>
                 <p className="text-sm text-slate-500 mt-1">Update your photo and personal details.</p>
               </div>
               <form onSubmit={saveProfile} className="p-6 space-y-6">
                 {/* Avatar */}
                 <div className="flex items-center gap-5">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                       {avatarPreview
                         ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                         : <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{initials}</span>
                       }
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
                       <Camera className="w-4 h-4" />
                     </div>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Profile Photo</p>
                     <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or WebP · Max 2MB</p>
                   </div>
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                 </div>
                 
                 <div className="grid gap-6 sm:grid-cols-2">
                   <Field label="Display Name">
                     <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                   </Field>
                   <Field label="Email Address">
                     <Input value={email} disabled className="opacity-60 cursor-not-allowed bg-slate-50" />
                   </Field>
                 </div>
                 
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <SaveButton loading={profileSaving} saved={profileSaved} />
                 </div>
               </form>
            </div>
          )}

          {/* ── 2. Finance Content ── */}
          {activeTab === 'finance' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Financial Preferences</h3>
                 <p className="text-sm text-slate-500 mt-1">Set your monthly budget and currency.</p>
               </div>
              <form onSubmit={saveFinance} className="p-6 space-y-6">
                <Field label="Monthly Budget" hint="Set to 0 to disable budget tracking">
                  <div className="flex gap-2 max-w-md">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                                 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2
                                 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                    >
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="AED">AED</option>
                    </select>
                    <Input type="number" min={0} step={100} value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" />
                  </div>
                </Field>

                <Field label={`Budget Alert Threshold`} hint="Get warned when spending reaches this percentage">
                  <div className="flex items-center gap-4 max-w-md bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <input
                      type="range" min={50} max={100} step={5}
                      value={alertPercent} onChange={e => setAlertPercent(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className={clsx(
                      'text-sm font-bold w-14 text-center px-2 py-1 rounded-lg',
                      alertPercent >= 90 ? 'bg-red-100 text-red-600' :
                      alertPercent >= 75 ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    )}>
                      {alertPercent}%
                    </span>
                  </div>
                </Field>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <SaveButton loading={financeSaving} saved={financeSaved} />
                </div>
              </form>
            </div>
          )}

          {/* ── 3. Security Content ── */}
          {activeTab === 'security' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Security</h3>
                  <p className="text-sm text-slate-500 mt-1">Change your password to keep your account secure.</p>
                </div>
               <form onSubmit={changePassword} className="p-6 space-y-5 max-w-md">
                 <Field label="Current Password">
                   <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                 </Field>
                 <Field label="New Password" hint="Must be at least 6 characters">
                   <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
                 </Field>
                 <Field label="Confirm New Password">
                   <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                 </Field>
                 
                 <div className="pt-4">
                    <SaveButton loading={pwSaving} saved={false} />
                 </div>
               </form>
             </div>
          )}

          {/* ── 4. Appearance Content ── */}
          {activeTab === 'appearance' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Appearance & Language</h3>
                  <p className="text-sm text-slate-500 mt-1">Customize how Fatorah looks on this device.</p>
                </div>
               <div className="p-6 space-y-8 max-w-xl">
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Color Theme</label>
                   <div className="grid grid-cols-2 gap-3">
                     {(['light', 'dark'] as const).map(t => (
                       <button
                         key={t} onClick={() => setTheme(t)}
                         className={clsx(
                           'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
                           mounted && theme === t
                             ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                             : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                         )}
                       >
                         {t === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                         <span className="font-semibold">{t === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <hr className="border-slate-100 dark:border-slate-800" />

                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Language</label>
                   <button
                     onClick={toggleLanguage}
                     className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all bg-slate-50 dark:bg-slate-800/50 group"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                         <Globe className="w-5 h-5 text-emerald-500" />
                       </div>
                       <div className="text-left">
                         <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                           {locale === 'ar' ? 'العربية' : 'English'}
                         </p>
                         <p className="text-xs text-slate-500">Click to switch</p>
                       </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                   </button>
                 </div>

                 <hr className="border-slate-100 dark:border-slate-800" />

                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Interface Scale</label>
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                     {(['sm', 'md', 'lg', 'xl'] as FontSizeOption[]).map((size, i) => (
                       <button
                         key={size} onClick={() => handleFontSize(size)}
                         className={clsx(
                           'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                           mounted && fontSize === size
                             ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                             : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                         )}
                       >
                         {['Small', 'Normal', 'Large', 'Extra'][i]}
                       </button>
                     ))}
                   </div>
                 </div>

               </div>
             </div>
          )}

          {/* ── 5. Account Content ── */}
          {activeTab === 'account' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Account Management</h3>
                  <p className="text-sm text-slate-500 mt-1">Sign out or permanently delete your account.</p>
                </div>
               <div className="p-6 space-y-6 max-w-xl">
                 
                 <button
                   onClick={handleLogout}
                   className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                 >
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>

                 <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-5 space-y-4">
                   <div className="flex gap-3">
                     <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                       <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                     </div>
                     <div>
                       <h4 className="text-sm font-bold text-red-900 dark:text-red-400">Danger Zone</h4>
                       <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 leading-relaxed">
                         This action cannot be undone. All your expenses, receipts, and settings will be permanently deleted.
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex gap-2 pt-2">
                     <input
                       type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                       placeholder="Type DELETE to confirm"
                       className="flex-1 h-10 px-3 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                     />
                     <button
                       onClick={deleteAccount} disabled={isDeleting || deleteConfirm !== 'DELETE'}
                       className="px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                     >
                       {isDeleting ? 'Deleting…' : 'Delete Account'}
                     </button>
                   </div>
                 </div>

               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  )
}