import { Ban, KeyRound, LockOpen, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

export default function UserActions({ user, onRun, onAsk }) {
  const { t } = useTranslation('admin');
  const resetLabel =
    user.role === 'WORKER' ? 'users.actions.resetPin' : 'users.actions.resetPassword';

  return (
    <div className="flex flex-wrap gap-1">
      {user.is_suspended ? (
        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => onRun('reactivate')}>
          {t('users.actions.reactivate')}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" icon={Ban} onClick={() => onAsk('suspend')}>
          {t('users.actions.suspend')}
        </Button>
      )}
      {user.is_locked && (
        <Button size="sm" variant="ghost" icon={LockOpen} onClick={() => onRun('unlock')}>
          {t('users.actions.unlock')}
        </Button>
      )}
      <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => onAsk('reset')}>
        {t(resetLabel)}
      </Button>
    </div>
  );
}
