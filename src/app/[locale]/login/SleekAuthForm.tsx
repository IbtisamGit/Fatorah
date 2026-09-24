'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Receipt } from 'lucide-react'

export default function SleekAuthForm() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const supabase = createClient()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) setError(signInError.message)
        else router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="w-full bg-white p-2 relative z-20">
      
      {/* Centered Modern Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-900/10 border border-emerald-600/50">
          <Receipt className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          {isLogin ? t('login') : t('signup')}
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          {isLogin ? t('welcome_back') : t('create_account')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}
        
        {/* Inputs Container */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-900">{t('email')}</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com"
              className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-900">{t('password')}</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="h-12 rounded-lg border-slate-200 bg-white text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Buttons Container */}
        <div className="pt-4 space-y-4">
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/10 transition-all hover:-translate-y-0.5" 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('submit')}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full h-12 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('need_account') : t('already_have_account')}
          </Button>
        </div>

      </form>
    </div>
  )
}