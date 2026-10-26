import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { LoadingState } from '@/components/ui';
import Footer from '@/features/public/components/Footer';
import Navbar from '@/features/public/components/Navbar';

export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
