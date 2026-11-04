import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useNotificationText } from '@/hooks/notifications';
import { NOTIFICATION_STYLE } from '@/lib/notificationTypes';

const TONES = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
};

export default function NotificationItem({ notification, onOpen, compact = false, className }) {
  const { t, i18n } = useTranslation();
  const { title, body } = useNotificationText(notification);
  const style = NOTIFICATION_STYLE[notification.type] ?? { icon: Bell, tone: 'blue' };
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(notification)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50',
        !notification.is_read && 'bg-brand-50/60',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          TONES[style.tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900">{title}</span>
        {body && !compact && <span className="block text-sm text-gray-600">{body}</span>}
        <span className="block text-xs text-gray-500">
          {formatDateTime(notification.created_at, i18n.language)}
        </span>
      </span>
      {!notification.is_read && (
        <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-600">
          <span className="sr-only">{t('notifications.unread')}</span>
        </span>
      )}
    </button>
  );
}
