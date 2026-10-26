import { Outlet, ScrollRestoration } from 'react-router';
import DevRoleSwitcher from '@/components/app/DevRoleSwitcher';

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <DevRoleSwitcher />
      <ScrollRestoration />
    </>
  );
}
