import { KeyRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  ReasonDialog,
  Table,
  useToast,
} from '@/components/ui';
import { useAdminUserAction, useAdminUsers } from '@/hooks/adminUsers';
import { formatDate } from '@/lib/format';
import CreateWorkerModal from '../components/CreateWorkerModal';
import CredentialModal from '../components/CredentialModal';
import UserActions from '../components/UserActions';
import UserFilters from '../components/UserFilters';
import UserStatusBadge from '../components/UserStatusBadge';

export default function UsersPage() {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', role: '', state: '' });
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [issued, setIssued] = useState(null);
  const { data, isPending, isError, error, refetch } = useAdminUsers({ ...filters, page });
  const act = useAdminUserAction();

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const run = (action, user, reason) =>
    act.mutate(
      { id: user.id, action, reason },
      {
        onSuccess: (result) => {
          if (action === 'reset-credential') setIssued(result);
          else toast.success(t(`users.done.${action}`));
        },
        onError: (mutationError) => toast.error(getErrorMessage(mutationError, t)),
        onSettled: () => setDialog(null),
      },
    );

  const columns = [
    {
      key: 'name',
      header: t('users.columns.name'),
      render: (user) => (
        <div>
          <p className="font-medium text-gray-900">{user.full_name}</p>
          <p className="text-gray-500">{user.phone}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.columns.role'),
      render: (user) => t(`users.roles.${user.role}`),
    },
    {
      key: 'state',
      header: t('users.columns.state'),
      render: (user) => <UserStatusBadge user={user} />,
    },
    {
      key: 'joined',
      header: t('users.columns.joined'),
      render: (user) => formatDate(user.date_joined, i18n.language),
    },
    {
      key: 'actions',
      header: '',
      render: (user) => (
        <UserActions
          user={user}
          onRun={(action) => run(action, user)}
          onAsk={(type) => setDialog({ type, user })}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button icon={UserPlus} onClick={() => setDialog({ type: 'onboard' })}>
            {t('onboard.open')}
          </Button>
        }
      />

      <UserFilters filters={filters} onChange={setFilter} />

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data && (
        <>
          <Table columns={columns} rows={data.results} emptyText={t('users.empty')} />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}

      <ReasonDialog
        open={dialog?.type === 'suspend'}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => run('suspend', dialog.user, reason)}
        loading={act.isPending}
        title={t('users.suspendTitle', { name: dialog?.user?.full_name })}
        message={t('users.suspendMessage')}
        label={t('users.reason')}
        confirmLabel={t('users.actions.suspend')}
      />
      <ConfirmDialog
        open={dialog?.type === 'reset'}
        onClose={() => setDialog(null)}
        onConfirm={() => run('reset-credential', dialog.user)}
        loading={act.isPending}
        tone="primary"
        icon={KeyRound}
        title={t('users.resetTitle', { name: dialog?.user?.full_name })}
        message={t('users.resetMessage')}
        confirmLabel={t('users.resetConfirm')}
      />
      <CreateWorkerModal
        open={dialog?.type === 'onboard'}
        onClose={() => setDialog(null)}
        onCreated={setIssued}
      />
      <CredentialModal issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}
