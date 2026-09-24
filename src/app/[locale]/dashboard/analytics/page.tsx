import { useTranslations } from 'next-intl';

export default function AnalyticsPage() {
  const t = useTranslations('Sidebar');
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t('analytics')}</h2>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-500">Charts and Analytics will be implemented here.</p>
      </div>
    </div>
  );
}
