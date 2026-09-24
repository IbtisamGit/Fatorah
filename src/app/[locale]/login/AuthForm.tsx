'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthForm() {
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
    <div className="w-full font-sans">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">
          {isLogin ? t('login') : t('signup')}
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          {isLogin ? t('welcome_back') : t('create_account')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-900 font-bold">{t('email')}</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base px-4 text-gray-900"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-900 font-bold">{t('password')}</Label>
          <Input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base px-4 text-gray-900"
          />
        </div>

        <div className="pt-2 space-y-4">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all" 
            disabled={loading}
          >
            {loading ? '...' : t('submit')}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full h-12 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('need_account') : t('already_have_account')}
          </Button>
        </div>
      </form>
    </div>
  )
}
