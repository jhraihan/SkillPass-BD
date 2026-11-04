import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/auth-context';
import { playNewJobSound, vibrate } from '@/lib/alerts';
import { notificationParams } from '@/lib/notificationTypes';
import {
  mockListNotifications,
  mockMarkRead,
  mockSupport,
  mockUnreadCount,
} from '@/mocks/notifications';
import { api, apiOrMock } from './request';

export const POLL_INTERVAL_MS = 30000;

function useViewer() {
  return useAuth().user;
}

export function useNotifications({ unread = false, type, page = 1 } = {}) {
  const user = useViewer();
  const params = { page, ...(unread ? { unread: 'true' } : {}), ...(type ? { type } : {}) };
  return useQuery({
    queryKey: ['notifications', 'list', user?.role, params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/notifications/', { params }),
        () => mockListNotifications(params, user?.role),
      ),
    enabled: Boolean(user),
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (previous) => previous,
  });
}

export function useUnreadCount() {
  const user = useViewer();
  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.role],
    queryFn: () =>
      apiOrMock(
        () => api.get('/notifications/unread-count/'),
        () => mockUnreadCount(user?.role),
      ),
    enabled: Boolean(user),
    refetchInterval: POLL_INTERVAL_MS,
    select: (data) => data.count,
  });
}

function useMarkMutation(realCall, mockCall) {
  const user = useViewer();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiOrMock(
        () => realCall(id),
        () => mockCall(id, user?.role),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkNotificationRead() {
  return useMarkMutation((id) => api.post(`/notifications/${id}/read/`), mockMarkRead);
}

export function useMarkAllNotificationsRead() {
  return useMarkMutation(
    () => api.post('/notifications/read-all/'),
    (_, role) => mockMarkRead(undefined, role),
  );
}

export function useNewJobAlert() {
  const user = useViewer();
  const isWorker = user?.role === 'WORKER';
  const [dismissed, setDismissed] = useState(() => new Set());
  const announced = useRef(null);
  const markRead = useMarkNotificationRead();
  const params = { unread: 'true', type: 'NEW_JOB', page: 1 };
  const { data } = useQuery({
    queryKey: ['notifications', 'list', user?.role, params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/notifications/', { params }),
        () => mockListNotifications(params, user?.role),
      ),
    enabled: isWorker,
    refetchInterval: POLL_INTERVAL_MS,
  });
  const latest = data?.results?.[0];
  const alert = latest && !dismissed.has(latest.id) ? latest : null;

  useEffect(() => {
    if (!alert || announced.current === alert.id) return;
    announced.current = alert.id;
    playNewJobSound();
    vibrate();
  }, [alert]);

  const dismiss = () => {
    if (!alert) return;
    setDismissed((current) => new Set(current).add(alert.id));
    markRead.mutate(alert.id);
  };

  return { alert, dismiss };
}

export function useSupportContacts() {
  return useQuery({
    queryKey: ['support'],
    queryFn: () =>
      apiOrMock(
        () => api.get('/support/'),
        () => mockSupport(),
      ),
    staleTime: Infinity,
  });
}

export function useNotificationText(notification) {
  const { t, i18n } = useTranslation();
  const params = notificationParams(notification.data, i18n.language);
  const key = `notifications.types.${notification.type}`;
  return {
    title: i18n.exists(`${key}.title`) ? t(`${key}.title`, params) : notification.title,
    body: i18n.exists(`${key}.body`) ? t(`${key}.body`, params).trim() : notification.body,
  };
}
