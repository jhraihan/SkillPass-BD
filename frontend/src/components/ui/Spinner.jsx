import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-10' };

export default function Spinner({ size = 'md', className }) {
  return (
    <Loader2
      className={cn('animate-spin text-brand-600', SIZES[size], className)}
      aria-hidden="true"
    />
  );
}
