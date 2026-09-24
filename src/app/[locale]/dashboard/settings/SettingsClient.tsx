'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { applyFontSize, type FontSizeOption } from '@/components/ThemeProvider'
import {
  User, Wallet, Lock, Palette, Globe, LogOut,
  Trash2, Camera, Check, Sun, Moon, Type,
  BellRing, DollarSign, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// ─── Helper: Section Card ──────────────────────────────────────────────────────
function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

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
        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
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
      // Re-authenticate first
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPw })
      if (signInError) throw new Error('Current password is incorrect')
      // Update password
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
  // Always start with 'md' on SSR — read real value from localStorage after mount
  const [fontSize, setFontSizeState] = useState<FontSizeOption>('md')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // This runs only on the client, after hydration — safe to read localStorage
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
      // Delete user data, then sign out (actual user deletion requires admin/server)
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

  // ── Render ────────────────────────────────────────────────────────────────────
  const initials = (fullName || email).charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl space-y-6">

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

      {/* ── 1. Profile ── */}
      <Section icon={User} title="Profile" description="Your public display name and avatar">
        <form onSubmit={saveProfile} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{initials}</span>
                }
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Profile Photo</p>
              <p className="text-xs text-slate-400">JPG, PNG or WebP · Max 2MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-1"
              >
                Upload photo
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <Field label="Display Name">
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </Field>

          <Field label="Email Address">
            <Input value={email} disabled className="opacity-60 cursor-not-allowed" />
          </Field>

          <SaveButton loading={profileSaving} saved={profileSaved} />
        </form>
      </Section>

      {/* ── 2. Finance ── */}
      <Section icon={Wallet} title="Finance" description="Budget and currency settings">
        <form onSubmit={saveFinance} className="space-y-5">
          <Field label="Monthly Budget" hint="Set to 0 to disable budget tracking">
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                           text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2
                           focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
              >
                <option value="SAR">SAR ريال</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="AED">AED درهم</option>
                <option value="KWD">KWD دينار</option>
                <option value="BHD">BHD دينار</option>
                <option value="QAR">QAR ريال</option>
                <option value="OMR">OMR ريال</option>
              </select>
              <Input
                type="number"
                min={0}
                step={100}
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="5000"
              />
            </div>
          </Field>

          <Field label={`Budget Alert at ${alertPercent}%`} hint="Get warned when spending reaches this percentage">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={alertPercent}
                onChange={e => setAlertPercent(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className={clsx(
                'text-sm font-bold w-12 text-center px-2 py-0.5 rounded-lg',
                alertPercent >= 90 ? 'bg-red-100 text-red-600' :
                alertPercent >= 75 ? 'bg-amber-100 text-amber-600' :
                'bg-emerald-100 text-emerald-600'
              )}>
                {alertPercent}%
              </span>
            </div>
          </Field>

          <SaveButton loading={financeSaving} saved={financeSaved} />
        </form>
      </Section>

      {/* ── 3. Security ── */}
      <Section icon={Lock} title="Security" description="Change your account password">
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current Password">
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          <Field label="New Password" hint="At least 6 characters">
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <Field label="Confirm New Password">
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <SaveButton loading={pwSaving} saved={false} />
        </form>
      </Section>

      {/* ── 4. Appearance ── */}
      <Section icon={Palette} title="Appearance" description="Theme, language, and font size">
        <div className="space-y-5">

          {/* Theme */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</p>
            <div className="flex gap-3">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    // Only apply active styles after mount — avoids SSR/client mismatch
                    mounted && theme === t
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  {t === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {t === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</p>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                         hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 text-left">
                {locale === 'ar' ? '🇸🇦 العربية  →  Switch to English' : '🇺🇸 English  →  التبديل للعربية'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size</p>
            <div className="flex gap-2">
              {(['sm', 'md', 'lg', 'xl'] as FontSizeOption[]).map((size, i) => (
                <button
                  key={size}
                  onClick={() => handleFontSize(size)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                    // Only apply active styles after mount — avoids SSR/client mismatch
                    mounted && fontSize === size
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                  )}
                  style={{ fontSize: `${12 + i * 2}px` }}
                >
                  {['S', 'M', 'L', 'XL'][i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. Account Actions ── */}
      <Section icon={LogOut} title="Account">
        <div className="space-y-3">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                       hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 text-left">Sign Out</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>

          {/* Delete Account */}
          <div className="rounded-xl border border-red-100 dark:border-red-900/50 overflow-hidden">
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <p className="text-sm font-semibold text-red-600">Danger Zone — Delete Account</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This action is permanent. All your expenses and data will be deleted. Type{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-red-600">DELETE</code>{' '}
                to confirm.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE here"
                  className="flex-1 h-9 px-3 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900
                             text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
                />
                <button
                  onClick={deleteAccount}
                  disabled={isDeleting || deleteConfirm !== 'DELETE'}
                  className="px-4 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold
                             transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

    </div>
  )
}
