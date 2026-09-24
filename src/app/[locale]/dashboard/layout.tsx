import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children, params }: { children: ReactNode, params: Promise<{locale: string}> }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/login');
  }

  const { locale } = await params;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar locale={locale} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar userEmail={data.user.email} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
