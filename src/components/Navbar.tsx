'use client'

import { createClient } from '@/utils/supabase/client';
import { useRouter } from '@/i18n/routing';
import { Button } from './ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Navbar({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('Sidebar');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:inline-block">
          {userEmail}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <LogOut className="w-4 h-4 me-2" />
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
