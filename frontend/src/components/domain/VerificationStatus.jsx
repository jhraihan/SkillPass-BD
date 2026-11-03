import { BadgeCheck, Hourglass, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '@/components/ui/Badge';

const STYLE = {
  PENDING: { tone: 'yellow', icon: Hourglass },
  APPROVED: { tone: 'green', icon: BadgeCheck },
  REJECTED: { tone: 'red', icon: XCircle },
};

export default function VerificationStatus({ status, size = 'md', className }) {
  const { t } = useTranslation();
  const style = STYLE[status] ?? { tone: 'gray' };
  return (
    <Badge tone={style.tone} icon={style.icon} size={size} className={className}>
      {t(`verification.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
