import { useAuth } from '@/app/auth-context';
import AdminLayout from './AdminLayout';
import CustomerLayout from './CustomerLayout';
import WorkerLayout from './WorkerLayout';

/** For pages every role can open (notifications, account): use the current user's layout. */
export default function RoleLayout() {
  const { user } = useAuth();
  if (user?.role === 'WORKER') return <WorkerLayout />;
  if (user?.role === 'ADMIN') return <AdminLayout />;
  return <CustomerLayout />;
}
