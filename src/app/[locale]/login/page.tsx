import { useLocale } from 'next-intl';
import SleekAuthForm from './SleekAuthForm';
import { Receipt, ScanLine, PieChart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function LoginPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div 
      className="flex h-screen w-full bg-white overflow-hidden"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      
      {/* 
        Left Side Content (Visuals & Marketing) - 55% of screen 
        Contains the gorgeous gradient background and 3D elements.
        (In Arabic RTL, this automatically shifts to the right side of the screen)
      */}
      <div className="hidden lg:flex relative z-0 w-[55%] flex-col justify-center items-center h-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 overflow-hidden">
        
        {/* Decorative background glows */}
        <div className={`absolute bottom-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none ${isAr ? 'right-[10%]' : 'left-[10%]'}`}></div>
        <div className={`absolute top-[10%] w-40 h-40 bg-white/15 rounded-full blur-2xl animate-float-delayed pointer-events-none ${isAr ? 'left-[20%]' : 'right-[20%]'}`}></div>

        {/* --- 3D Visual Composition --- */}
        <div className={`relative z-20 w-full max-w-[500px] h-[360px] flex items-center justify-center pointer-events-none mb-10 transform ${isAr ? 'translate-x-6' : '-translate-x-6'}`}>
          
          {/* Background Card: Pie Chart / Dashboard */}
          <div className="absolute w-[260px] h-[340px] bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-2xl p-6 transform -rotate-6 -translate-x-14 -translate-y-6 animate-float-delayed">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="w-16 h-2 bg-white/40 rounded-full mb-2"></div>
                <div className="w-24 h-3 bg-white/60 rounded-full"></div>
              </div>
            </div>
            {/* Minimalist bars */}
            <div className="flex justify-between items-end h-24 gap-2 mt-4">
              <div className="w-full bg-white/40 rounded-t-md h-[40%]"></div>
              <div className="w-full bg-white/80 rounded-t-md h-[90%] shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
              <div className="w-full bg-white/40 rounded-t-md h-[60%]"></div>
              <div className="w-full bg-white/50 rounded-t-md h-[75%]"></div>
            </div>
          </div>

          {/* Foreground Card: Smart Receipt Scanner */}
          <div className="absolute w-[250px] h-[320px] bg-white/95 backdrop-blur-3xl rounded-[1.5rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-6 transform rotate-3 translate-x-12 translate-y-8 animate-float overflow-hidden">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <ScanLine className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-4 mb-6">
              <div className="w-3/4 h-2.5 bg-slate-700/80 rounded-full"></div>
              <div className="w-1/2 h-2 bg-slate-300 rounded-full"></div>
            </div>
            <div className="w-full h-px border-t-2 border-dashed border-slate-200 my-4"></div>
            <div className="space-y-4">
              <div className="flex justify-between"><div className="w-20 h-2 bg-slate-200 rounded-full"></div><div className="w-10 h-2 bg-slate-200 rounded-full"></div></div>
              <div className="flex justify-between"><div className="w-24 h-2 bg-slate-200 rounded-full"></div><div className="w-12 h-2 bg-slate-200 rounded-full"></div></div>
              <div className="flex justify-between"><div className="w-16 h-2 bg-slate-200 rounded-full"></div><div className="w-14 h-2 bg-slate-200 rounded-full"></div></div>
            </div>
            {/* AI Laser */}
            <div className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.7)] animate-scan z-30"></div>
            <div className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent to-emerald-500/20 animate-scan -translate-y-full z-20 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Text Content */}
        <div className={`relative z-20 text-center transform ${isAr ? 'translate-x-6' : '-translate-x-6'}`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-white drop-shadow-sm" dir={isAr ? "rtl" : "ltr"}>
            {isAr ? "تتبع مصاريفك بذكاء!" : "Track Expenses Smartly!"}
          </h2>
          <p className="text-emerald-50 text-xl font-medium max-w-md mx-auto leading-relaxed drop-shadow-sm" dir={isAr ? "rtl" : "ltr"}>
            {isAr 
              ? "صور الفاتورة، واترك الباقي علينا لإدارة مالية أسهل وأسرع." 
              : "Snap the receipt, and leave the rest to us for easier and faster financial management."}
          </p>
        </div>
      </div>

      {/* 
        Right Side Content (Form) - 45% of screen 
        Contains the organic white wave overlapping the left side.
        (In Arabic RTL, this automatically shifts to the left side of the screen)
      */}
      <div className={`relative z-10 w-full lg:w-[45%] flex flex-col justify-center px-12 sm:px-24 lg:px-16 xl:px-24 bg-white h-full ${isAr ? 'shadow-[20px_0_40px_rgba(0,0,0,0.05)]' : 'shadow-[-20px_0_40px_rgba(0,0,0,0.05)]'}`}>
        
        {/* Back to Home Button */}
        <div className={`absolute top-8 ${isAr ? 'right-8 lg:right-12' : 'left-8 lg:left-12'} z-30`}>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>

        {/* Organic SVG Wave (White curve eating into the green background) */}
        <div className={`hidden lg:block absolute top-0 h-full w-[11.1vw] text-white pointer-events-none z-10 ${isAr ? 'right-[-11vw] -scale-x-100' : 'left-[-11vw]'}`}>
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full" fill="currentColor">
             <path d="M100,0 C-20,300 -20,700 100,1000 L100,1000 L100,0 Z" />
          </svg>
        </div>

        <div className="relative z-20 w-full max-w-[440px] mx-auto">
          <SleekAuthForm />
        </div>
      </div>
      
    </div>
  );
}