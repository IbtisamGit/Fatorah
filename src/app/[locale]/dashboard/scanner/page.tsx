import { useTranslations } from 'next-intl';

export default function ScannerPage() {
  const t = useTranslations('Sidebar');
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t('scanner')}</h2>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-500">AI Receipt Scanner will be implemented here.</p>
      </div>
    </div>
  );
}
