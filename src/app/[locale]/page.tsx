'use client';

import {useTranslations, useLocale} from 'next-intl';
import {Button} from '@/components/ui/button';
import {Link, usePathname, useRouter} from '@/i18n/routing';
import { ArrowRight, Receipt, ScanLine, BrainCircuit, ShieldCheck, Sparkles, Globe } from 'lucide-react';
import { MagicParticles } from '@/components/MagicParticles';

export default function HomePage() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar for Landing Page */}
      <nav className="absolute top-0 w-full z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-green-500/20">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight drop-shadow-md">Fatorah</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              onClick={toggleLanguage}
              className="text-white hover:text-green-400 hover:bg-white/10 font-bold px-3 gap-2"
            >
              <Globe className="w-5 h-5" />
              <span className="uppercase">{locale === 'ar' ? 'EN' : 'عربي'}</span>
            </Button>
            
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex text-white hover:text-green-400 hover:bg-white/10 font-medium">
                {t('cta_login')}
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-green-900 hover:bg-green-50 font-bold px-6 shadow-xl shadow-white/10 transition-all hover:scale-105">
                {t('cta_start')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Dark & Vibrant Hero Section with Magic Particles */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-[#022c22] group">
        
        {/* Magic Interactive Particles Canvas */}
        <MagicParticles />

        {/* Static Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/30 blur-[120px] mix-blend-screen pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/20 blur-[120px] mix-blend-screen pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-sm font-semibold mb-8 backdrop-blur-sm shadow-2xl">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {t('hero_badge')}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 max-w-5xl mx-auto leading-[1.1] drop-shadow-2xl pointer-events-none">
            {t('hero_title').split(' ').map((word, i) => (
              i > 1 && i < 5 ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500"> {word} </span> : <span key={i}> {word} </span>
            ))}
          </h1>
          
          <p className="text-xl md:text-2xl text-emerald-100/80 mb-12 max-w-3xl mx-auto leading-relaxed font-medium pointer-events-none">
            {t('hero_subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-20">
            <Link href="/login">
              <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-[0_0_40px_-10px_rgba(16,185,129,0.7)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.9)] hover:-translate-y-1 transition-all duration-300 border border-green-400/50">
                {t('cta_start')}
                <ArrowRight className="ms-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50 [clip-path:polygon(0_100%,100%_100%,100%_0,50%_100%,0_0)] z-10 pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 -mt-10 relative z-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{t('features_title')}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-green-400 to-emerald-600 mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="group relative bg-white p-10 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-green-900/5 border border-gray-100 hover:border-green-300 hover:-translate-y-3 transition-all duration-500 overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border border-green-100">
                  <ScanLine className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">{t('feature_1_title')}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{t('feature_1_desc')}</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white p-10 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-green-900/5 border border-gray-100 hover:border-green-300 hover:-translate-y-3 transition-all duration-500 overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 border border-green-100">
                  <BrainCircuit className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">{t('feature_2_title')}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{t('feature_2_desc')}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white p-10 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-green-900/5 border border-gray-100 hover:border-green-300 hover:-translate-y-3 transition-all duration-500 overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border border-green-100">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">{t('feature_3_title')}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{t('feature_3_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4 opacity-50 grayscale">
            <Receipt className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">Fatorah</span>
          </div>
          <p className="text-gray-400">© {new Date().getFullYear()} Fatorah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
