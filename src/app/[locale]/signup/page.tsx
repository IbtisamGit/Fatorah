"use client";

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Receipt, PieChart, ScanLine, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from '@/utils/supabase/client';

// Translates Supabase error codes/messages into user-friendly Arabic messages
function getAuthErrorMessage(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();

  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('user_already_exists')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً. هل تريد تسجيل الدخول؟';
  }
  if (msg.includes('invalid email')) {
    return 'البريد الإلكتروني غير صحيح. الرجاء إدخال بريد إلكتروني صالح.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
  }
  return `حدث خطأ: ${errorMessage}`;
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const clearErrors = () => {
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setEmailError('الرجاء إدخال بريد إلكتروني صحيح (مثال: name@example.com)');
      hasError = true;
    }

    if (!password || password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      hasError = true;
    }

    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError.message));
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase returns a user with no identities when the email is already registered
        setError('هذا البريد الإلكتروني مسجل مسبقاً. هل تريد تسجيل الدخول؟');
      } else if (data.session) {
        // Email confirmation is disabled — immediately redirect to dashboard
        router.push('/dashboard');
      } else {
        // Email confirmation is enabled — show success message
        setSuccessMessage('تم إرسال رابط التأكيد إلى بريدك الإلكتروني. تحقق من صندوق الوارد وأكد حسابك للمتابعة.');
      }
    } catch {
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white selection:bg-emerald-200">
      
      {/* 1. الجانب الأيسر (القسم التسويقي والبصري - 55٪) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-center items-center bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 overflow-hidden">
        
        {/* المنحنى العضوي (Organic Curve) الفاصل بين القسمين */}
        <div className="absolute top-0 -right-[2px] h-full w-[12vw] max-w-[150px] text-white pointer-events-none z-30">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" fill="currentColor">
            <path d="M100,0 C-30,40 -30,60 100,100 Z" />
          </svg>
        </div>

        {/* --- العناصر البصرية 3D (Floating UI Cards) --- */}
        <div className="relative z-10 w-full h-[500px] flex items-center justify-center transform -translate-x-10 pointer-events-none">
          
          {/* البطاقة الخلفية: رسم بياني للمصروفات */}
          <div className="absolute w-64 h-48 bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl shadow-emerald-900/10 border border-white transform rotate-[12deg] translate-x-28 -translate-y-16 animate-float-delayed">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="w-16 h-2 bg-slate-200 rounded-full mb-1.5"></div>
                <div className="w-24 h-3 bg-slate-300 rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between items-end h-16 gap-2 mt-6">
              <div className="w-full bg-slate-200 rounded-t-md h-[40%]"></div>
              <div className="w-full bg-emerald-400 rounded-t-md h-[90%] shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
              <div className="w-full bg-slate-200 rounded-t-md h-[60%]"></div>
              <div className="w-full bg-sky-300 rounded-t-md h-[75%]"></div>
            </div>
          </div>

          {/* البطاقة الأمامية: الفاتورة قيد المسح */}
          <div className="absolute w-72 h-[340px] bg-white/95 backdrop-blur-3xl rounded-[2rem] p-8 shadow-[0_40px_80px_-20px_rgba(4,120,87,0.2)] border border-white transform -rotate-[6deg] -translate-x-10 translate-y-10 animate-float overflow-hidden">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100/50">
              <ScanLine className="w-6 h-6 text-emerald-600" />
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="w-3/4 h-3 bg-slate-700/80 rounded-full"></div>
              <div className="w-1/2 h-2.5 bg-slate-300 rounded-full"></div>
            </div>
            <div className="w-full h-px border-t-2 border-dashed border-slate-200 my-4"></div>
            <div className="space-y-4">
              <div className="flex justify-between"><div className="w-20 h-2 bg-slate-200 rounded-full"></div><div className="w-10 h-2 bg-slate-200 rounded-full"></div></div>
              <div className="flex justify-between"><div className="w-24 h-2 bg-slate-200 rounded-full"></div><div className="w-12 h-2 bg-slate-200 rounded-full"></div></div>
              <div className="flex justify-between"><div className="w-16 h-2 bg-slate-200 rounded-full"></div><div className="w-14 h-2 bg-slate-200 rounded-full"></div></div>
            </div>
            
            {/* خط ليزر الذكاء الاصطناعي */}
            <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.6)] animate-scan z-30"></div>
            <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent to-emerald-500/20 animate-scan -translate-y-full z-20 pointer-events-none"></div>
          </div>
        </div>

        {/* النص الترويجي */}
        <div className="relative z-20 mt-16 px-16 w-full text-center">
          <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight" dir="rtl">
            تتبع مصاريفك بذكاء..
          </h2>
          <p className="text-xl text-slate-600 font-medium" dir="rtl">
            صور الفاتورة، واترك الباقي علينا.
          </p>
        </div>

        {/* تأثيرات إضاءة خفيفة في الخلفية */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* 2. الجانب الأيمن (القسم العملي للنموذج - 45٪) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-10 sm:px-16 xl:px-24 bg-white relative z-40" dir="rtl">
        
        <div className="w-full max-w-[400px] mx-auto">
          {/* العنوان والنُبذة */}
          <div className="mb-10">
            <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/10 border border-emerald-600/50">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">إنشاء حساب جديد</h1>
            <p className="text-slate-500 text-sm font-medium">ابدأ رحلتك نحو إدارة مالية أسهل وأكثر ذكاءً.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* رسالة النجاح */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* رسالة الخطأ العامة */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <span>{error}</span>
                  {/* زر تسجيل الدخول عند وجود بريد مسجل مسبقاً */}
                  {(error.includes('مسجل مسبقاً') || error.includes('already registered')) && (
                    <Link
                      href="/login"
                      className="text-emerald-600 hover:text-emerald-700 font-extrabold underline decoration-2 underline-offset-4 w-fit"
                    >
                      تسجيل الدخول الآن
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* حقول الإدخال */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label
                  htmlFor="email"
                  className={`text-sm font-semibold ${emailError ? 'text-red-500' : 'text-slate-900'}`}
                >
                  البريد الإلكتروني
                </Label>
                {emailError && (
                  <span className="text-xs font-bold text-red-500">{emailError}</span>
                )}
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); setError(null); }}
                placeholder="name@example.com"
                className={`h-12 rounded-xl bg-white text-slate-900 focus:bg-white transition-all shadow-sm text-left font-sans ${emailError ? 'border-red-400 focus:ring-red-400 focus:border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600'}`}
                dir="ltr"
                autoComplete="email"
                disabled={loading || !!successMessage}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label
                  htmlFor="password"
                  className={`text-sm font-semibold ${passwordError ? 'text-red-500' : 'text-slate-900'}`}
                >
                  كلمة المرور
                </Label>
                {passwordError ? (
                  <span className="text-xs font-bold text-red-500">{passwordError}</span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">6 أحرف على الأقل</span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); setError(null); }}
                placeholder="••••••••"
                className={`h-12 rounded-xl bg-white text-slate-900 focus:bg-white transition-all shadow-sm text-left font-sans ${passwordError ? 'border-red-400 focus:ring-red-400 focus:border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600'}`}
                dir="ltr"
                autoComplete="new-password"
                disabled={loading || !!successMessage}
              />
            </div>

            {/* زر إنشاء الحساب */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xl shadow-emerald-900/10 transition-all hover:-translate-y-0.5 text-base"
                disabled={loading || !!successMessage}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب'}
              </Button>
            </div>
          </form>

          {/* الخط الفاصل */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-400 font-medium">أو</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* زر التسجيل بـ جوجل */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold shadow-sm transition-all"
          >
            <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            التسجيل باستخدام Google
          </Button>

          {/* الرابط السفلي */}
          <p className="text-center mt-8 text-sm text-slate-600 font-medium">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors">
              تسجيل الدخول
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}
