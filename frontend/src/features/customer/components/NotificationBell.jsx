import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useUnreadCount } from '@/hooks/notifications';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

export default function NotificationBell({ className }) {
  const { t, i18n } = useTranslation('customer');
  const { data: count = 0 } = useUnreadCount();
  const label = count
    ? t('notifications.bellUnread', { count, value: formatNumber(count, i18n.language) })
    : t('notifications.bell');

  return (
    <Link
      to="/notifications"
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-11 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100',
        className,
      )}
    >
      <Bell className="size-6" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-5 text-white">
          {count > 9 ? '9+' : formatNumber(count, i18n.language)}
        </span>
      )}
    </Link>
  );
}
