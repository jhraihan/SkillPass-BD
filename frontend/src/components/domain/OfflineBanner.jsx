import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '@/hooks/assistance';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-gray-900 px-4 py-2 text-base font-semibold text-white"
    >
      <WifiOff className="size-5" aria-hidden="true" />
      {t('offline.banner')}
    </div>
  );
}
