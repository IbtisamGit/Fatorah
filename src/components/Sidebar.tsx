'use client'

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Receipt, ScanLine, PieChart, FolderHeart, Settings } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: t('overview'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/expenses', label: t('expenses'), icon: Receipt },
    { href: '/dashboard/scanner', label: t('scanner'), icon: ScanLine },
    { href: '/dashboard/analytics', label: t('analytics'), icon: PieChart },
    { href: '/dashboard/categories', label: t('categories'), icon: FolderHeart },
    { href: '/dashboard/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-e h-full hidden md:flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">Fatorah</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = link.exact 
            ? pathname === link.href 
            : pathname.startsWith(link.href);

          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
