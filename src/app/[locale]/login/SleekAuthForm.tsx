"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"

// Translates Supabase error codes/messages into user-friendly messages
function getAuthErrorMessage(errorMessage: string, isAr: boolean): string {
  const msg = errorMessage.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return isAr
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من بياناتك وحاول مرة أخرى.'
      : 'Invalid email or password. Please check your credentials and try again.'
  }
  if (msg.includes('email not confirmed')) {
    return isAr
      ? 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد الخاص بك.'
      : 'Please confirm your email address first. Check your inbox.'
  }
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('user_already_exists')) {
    return isAr
      ? 'هذا البريد الإلكتروني مسجل مسبقاً. هل تريد تسجيل الدخول؟'
      : 'This email is already registered. Would you like to sign in instead?'
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return isAr
      ? 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.'
      : 'Too many attempts. Please wait a moment and try again.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return isAr
      ? 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.'
      : 'Connection error. Please check your internet connection and try again.'
  }
  // Fallback: return the raw message
  return isAr
    ? `حدث خطأ: ${errorMessage}`
    : `An error occurred: ${errorMessage}`
}

export default function SleekAuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Validation States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()

  const clearErrors = () => {
    setError(null)
    setSuccessMessage(null)
    setEmailError(null)
    setPasswordError(null)
  }

  const validateForm = (): boolean => {
    let hasError = false

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setEmailError(
        isAr
          ? 'الرجاء إدخال بريد إلكتروني صحيح (مثال: name@example.com)'
          : 'Please enter a valid email address (e.g. name@example.com)'
      )
      hasError = true
    }

    // Password Validation
    if (!password || password.length < 6) {
      setPasswordError(
        isAr
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
          : 'Password must be at least 6 characters long'
      )
      hasError = true
    }

    return !hasError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(getAuthErrorMessage(signInError.message, isAr))
        } else {
          router.push('/dashboard')
        }
      } else {
        // --- SIGN UP ---
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (signUpError) {
          setError(getAuthErrorMessage(signUpError.message, isAr))
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Supabase returns a user with no identities when email is already registered
          setError(
            isAr
              ? 'هذا البريد الإلكتروني مسجل مسبقاً. هل تريد تسجيل الدخول؟'
              : 'This email is already registered. Would you like to sign in instead?'
          )
        } else if (data.session) {
          // Email confirmation is disabled — user is immediately logged in
          router.push('/dashboard')
        } else {
          // Email confirmation is enabled — prompt the user to check inbox
          setSuccessMessage(
            isAr
              ? 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني. تحقق من صندوق الوارد وأكد حسابك.'
              : 'A confirmation link has been sent to your email. Please check your inbox to activate your account.'
          )
        }
      }
    } catch {
      setError(
        isAr
          ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Dynamic Texts based on Locale
  const greetingText = isLogin
    ? (isAr ? "مرحباً بك! سجل دخولك للبدء في إدارة فواتيرك." : "Hello there! Sign in and start managing your receipts.")
    : (isAr ? "أهلاً بك! أنشئ حسابك الآن لتبدأ رحلتك." : "Welcome! Create an account to start tracking.")

  const noAccountText = isAr ? "ليس لديك حساب؟" : "Don't have an account?"
  const hasAccountText = isAr ? "لديك حساب بالفعل؟" : "Already have an account?"
  const forgotPasswordText = isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"

  return (
    <div className="w-full bg-transparent relative z-20 flex flex-col items-start text-start" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Minimalist Header */}
      <div className="mb-10 w-full">
        <h1 className="text-4xl font-black text-emerald-600 mb-2 uppercase tracking-wider transition-all">
          {isLogin ? (isAr ? 'تسجيل الدخول' : 'LOGIN') : (isAr ? 'إنشاء حساب' : 'SIGN UP')}
        </h1>
        <p className="text-base text-slate-600 font-medium transition-all">
          {greetingText}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 w-full" noValidate>
        
        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold w-full flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* General Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold w-full text-start flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5">
              <span>{error}</span>
              {/* If "already registered" error on signup, suggest switching to login */}
              {!isLogin && (error.includes('already registered') || error.includes('مسجل مسبقاً')) && (
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); clearErrors(); }}
                  className="text-emerald-600 hover:text-emerald-700 font-extrabold underline decoration-2 underline-offset-4 text-start w-fit"
                >
                  {isAr ? 'تسجيل الدخول الآن' : 'Sign in instead'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* High-Contrast Minimalist Inputs */}
        <div className="space-y-8">
          
          {/* Email Field */}
          <div className="space-y-2 relative group w-full">
            <div className="flex justify-between items-end w-full mb-1">
              <Label
                htmlFor="email"
                className={`text-sm font-extrabold transition-colors ${emailError ? 'text-red-500' : 'text-slate-700 group-focus-within:text-emerald-600'}`}
              >
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              {emailError && (
                <span className="text-xs font-bold text-red-500 animate-in fade-in">{emailError}</span>
              )}
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); setError(null); }}
              placeholder="name@example.com"
              className={`h-10 rounded-none border-0 border-b-[3px] bg-transparent px-0 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-0 transition-colors shadow-none placeholder:text-slate-400 text-lg font-bold ${emailError ? 'border-red-400 focus-visible:border-red-500' : 'border-slate-300 focus-visible:border-emerald-600'}`}
              dir="ltr"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          
          {/* Password Field */}
          <div className="space-y-2 relative group w-full">
            <div className="flex justify-between items-end w-full mb-1">
              <Label
                htmlFor="password"
                className={`text-sm font-extrabold transition-colors ${passwordError ? 'text-red-500' : 'text-slate-700 group-focus-within:text-emerald-600'}`}
              >
                {isAr ? 'كلمة المرور' : 'Password'}
              </Label>
              {passwordError ? (
                <span className="text-xs font-bold text-red-500 animate-in fade-in">{passwordError}</span>
              ) : isLogin ? (
                <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                  {forgotPasswordText}
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                </span>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(null); setError(null); }}
              placeholder="••••••••"
              className={`h-10 rounded-none border-0 border-b-[3px] bg-transparent px-0 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-0 transition-colors shadow-none placeholder:text-slate-400 text-lg font-bold tracking-widest ${passwordError ? 'border-red-400 focus-visible:border-red-500' : 'border-slate-300 focus-visible:border-emerald-600'}`}
              dir="ltr"
              autoComplete={isLogin ? "current-password" : "new-password"}
              disabled={loading}
            />
          </div>
        </div>

        {/* Action Buttons & Links */}
        <div className="pt-2 space-y-4 w-full">
          
          {/* Primary Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 flex items-center justify-between px-6"
            disabled={loading || !!successMessage}
          >
            <span className="uppercase tracking-widest text-[15px]">
              {loading
                ? (isAr ? 'جارٍ التحميل...' : 'Loading...')
                : isLogin
                  ? (isAr ? "تسجيل الدخول" : "SIGN IN NOW")
                  : (isAr ? "إنشاء حساب" : "REGISTER")}
            </span>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />
            )}
          </Button>

          {/* Links Bottom */}
          <div className="flex items-center justify-center text-[15px] font-semibold text-slate-600 pt-6 mt-4 border-t border-slate-100 w-full">
            <p>
              {isLogin ? noAccountText : hasAccountText}{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); clearErrors(); setEmail(''); setPassword(''); }}
                className="text-emerald-600 hover:text-emerald-700 font-extrabold mx-1 transition-colors underline decoration-2 underline-offset-4"
              >
                {isLogin ? (isAr ? "إنشاء حساب مجاني" : "Register") : (isAr ? "تسجيل الدخول" : "Sign In")}
              </button>
            </p>
          </div>
          
        </div>

      </form>
    </div>
  )
}