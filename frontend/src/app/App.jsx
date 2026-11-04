import { RouterProvider } from 'react-router';
import OfflineBanner from '@/components/domain/OfflineBanner';
import AppProviders from './AppProviders';
import { router } from './router';

export default function App() {
  return (
    <AppProviders>
      <OfflineBanner />
      <RouterProvider router={router} />
    </AppProviders>
  );
}
