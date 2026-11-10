import { useTranslation } from 'react-i18next';
import { Input, Select } from '@/components/ui';
import { USER_STATES } from '@/lib/constants';

const ROLES = ['CUSTOMER', 'WORKER', 'ADMIN'];

export default function UserFilters({ filters, onChange }) {
  const { t } = useTranslation('admin');
  const set = (key) => (event) => onChange(key, event.target.value);

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem]">
      <Input
        aria-label={t('users.search')}
        placeholder={t('users.search')}
        value={filters.search}
        onChange={set('search')}
      />
      <Select
        aria-label={t('users.filterRole')}
        value={filters.role}
        onChange={set('role')}
        options={[
          { value: '', label: t('users.allRoles') },
          ...ROLES.map((role) => ({ value: role, label: t(`users.roles.${role}`) })),
        ]}
      />
      <Select
        aria-label={t('users.filterState')}
        value={filters.state}
        onChange={set('state')}
        options={[
          { value: '', label: t('users.allStates') },
          ...USER_STATES.map((state) => ({ value: state, label: t(`users.state.${state}`) })),
        ]}
      />
    </div>
  );
}
