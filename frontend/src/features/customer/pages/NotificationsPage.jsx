import { BellOff, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { NotificationItem } from '@/components/domain';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/notifications';
import { cn } from '@/lib/cn';
import { notificationLink } from '@/lib/notificationTypes';

const TABS = ['all', 'unread'];

export default function NotificationsPage() {
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useNotifications({
    unread: tab === 'unread',
    page,
  });
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const open = (notification) => {
    if (!notification.is_read) markRead.mutate(notification.id);
    const link = notificationLink(notification, user?.role);
    if (link) navigate(link);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('notifications.title')}
        actions={
          unread > 0 && (
            <Button
              variant="outline"
              icon={CheckCheck}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {t('notifications.markAll')}
            </Button>
          )
        }
      />

      <div role="tablist" className="mb-4 grid grid-cols-2 gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
            className={cn(
              'min-h-11 rounded-xl font-medium',
              tab === key ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            {t(`notifications.tabs.${key}`)}
          </button>
        ))}
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data?.results.length === 0 && (
        <EmptyState
          icon={BellOff}
          title={t(tab === 'unread' ? 'notifications.noneUnread' : 'notifications.none')}
        />
      )}
      {data?.results.length > 0 && (
        <Card className="divide-y divide-gray-100 p-2">
          {data.results.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onOpen={open} />
          ))}
        </Card>
      )}
      {data && <Pagination page={page} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
