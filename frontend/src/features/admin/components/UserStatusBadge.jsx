import { Ban, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';

function stateOf(user) {
  if (user.is_suspended) return { key: 'suspended', tone: 'red', icon: Ban };
  if (user.is_locked) return { key: 'locked', tone: 'yellow', icon: Lock };
  return { key: 'active', tone: 'green', icon: CheckCircle2 };
}

export default function UserStatusBadge({ user, size = 'sm' }) {
  const { t } = useTranslation('admin');
  const { key, tone, icon } = stateOf(user);

  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={tone} icon={icon} size={size}>
        {t(`users.state.${key}`)}
      </Badge>
      {user.must_change_credential && (
        <Badge tone="blue" icon={KeyRound} size={size}>
          {t('users.mustChange')}
        </Badge>
      )}
    </span>
  );
}
