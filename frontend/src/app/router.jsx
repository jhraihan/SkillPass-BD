/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import RouteError from '@/components/app/RouteError';
import AdminLayout from '@/layouts/AdminLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import PublicLayout from '@/layouts/PublicLayout';
import RoleLayout from '@/layouts/RoleLayout';
import RootLayout from '@/layouts/RootLayout';
import WorkerLayout from '@/layouts/WorkerLayout';
import { RequireAuth, RequireRole } from './guards';

// Every page is loaded on demand so budget phones download only what they open.

// Public & Auth — M2
const LandingPage = lazy(() => import('@/features/public/pages/LandingPage'));
const LoginPage = lazy(() => import('@/features/public/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/public/pages/RegisterPage'));
const SetPinPage = lazy(() => import('@/features/public/pages/SetPinPage'));
const WorkerSearchPage = lazy(() => import('@/features/public/pages/WorkerSearchPage'));
const WorkerProfilePage = lazy(() => import('@/features/public/pages/WorkerProfilePage'));
const TrustExplainerPage = lazy(() => import('@/features/public/pages/TrustExplainerPage'));
const AboutPage = lazy(() => import('@/features/public/pages/AboutPage'));
const NotFoundPage = lazy(() => import('@/features/public/pages/NotFoundPage'));

// Customer — M3
const CustomerDashboardPage = lazy(() => import('@/features/customer/pages/CustomerDashboardPage'));
const NewRequestPage = lazy(() => import('@/features/customer/pages/NewRequestPage'));
const MatchResultsPage = lazy(() => import('@/features/customer/pages/MatchResultsPage'));
const MyBookingsPage = lazy(() => import('@/features/customer/pages/MyBookingsPage'));
const BookingDetailPage = lazy(() => import('@/features/customer/pages/BookingDetailPage'));
const ReviewFormPage = lazy(() => import('@/features/customer/pages/ReviewFormPage'));
const NotificationsPage = lazy(() => import('@/features/customer/pages/NotificationsPage'));
const AccountSettingsPage = lazy(() => import('@/features/customer/pages/AccountSettingsPage'));

// Worker — M4
const WorkerHomePage = lazy(() => import('@/features/worker/pages/WorkerHomePage'));
const ProfileWizardPage = lazy(() => import('@/features/worker/pages/ProfileWizardPage'));
const EditProfilePage = lazy(() => import('@/features/worker/pages/EditProfilePage'));
const MyJobsPage = lazy(() => import('@/features/worker/pages/MyJobsPage'));
const JobRequestPage = lazy(() => import('@/features/worker/pages/JobRequestPage'));
const ActiveJobPage = lazy(() => import('@/features/worker/pages/ActiveJobPage'));
const MyReviewsPage = lazy(() => import('@/features/worker/pages/MyReviewsPage'));
const WorkHistoryPage = lazy(() => import('@/features/worker/pages/WorkHistoryPage'));
const HelpPage = lazy(() => import('@/features/worker/pages/HelpPage'));

// Admin & Verification — M5
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const CatalogPage = lazy(() => import('@/features/admin/pages/CatalogPage'));
const VerificationUploadPage = lazy(() => import('@/features/admin/pages/VerificationUploadPage'));
const VerificationQueuePage = lazy(() => import('@/features/admin/pages/VerificationQueuePage'));
const VerificationReviewPage = lazy(() => import('@/features/admin/pages/VerificationReviewPage'));
const ReportsQueuePage = lazy(() => import('@/features/admin/pages/ReportsQueuePage'));
const ReportResolvePage = lazy(() => import('@/features/admin/pages/ReportResolvePage'));
const UsersPage = lazy(() => import('@/features/admin/pages/UsersPage'));

// Reference pages for the team. Development only: left out of production builds.
function exampleRoutes() {
  const ExampleListPage = lazy(() => import('@/features/_example/ExampleListPage'));
  const ExampleDetailPage = lazy(() => import('@/features/_example/ExampleDetailPage'));
  const ExampleFormPage = lazy(() => import('@/features/_example/ExampleFormPage'));
  return [
    { path: '_examples', element: <ExampleListPage /> },
    { path: '_examples/new', element: <ExampleFormPage /> },
    { path: '_examples/:id', element: <ExampleDetailPage /> },
  ];
}

export const routes = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'workers', element: <WorkerSearchPage /> },
          { path: 'workers/:id', element: <WorkerProfilePage /> },
          { path: 'trust-score', element: <TrustExplainerPage /> },
          { path: 'about', element: <AboutPage /> },
          {
            path: 'set-pin',
            element: (
              <RequireAuth>
                <SetPinPage />
              </RequireAuth>
            ),
          },
          ...(import.meta.env.DEV ? exampleRoutes() : []),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'customer',
        element: (
          <RequireRole roles={['CUSTOMER']}>
            <CustomerLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <CustomerDashboardPage /> },
          { path: 'requests/new', element: <NewRequestPage /> },
          { path: 'requests/:id/matches', element: <MatchResultsPage /> },
          { path: 'bookings', element: <MyBookingsPage /> },
          { path: 'bookings/:id', element: <BookingDetailPage /> },
          { path: 'bookings/:id/review', element: <ReviewFormPage /> },
        ],
      },
      {
        path: 'worker',
        element: (
          <RequireRole roles={['WORKER']}>
            <WorkerLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <WorkerHomePage /> },
          { path: 'setup', element: <ProfileWizardPage /> },
          { path: 'profile', element: <EditProfilePage /> },
          { path: 'jobs', element: <MyJobsPage /> },
          { path: 'jobs/:id', element: <ActiveJobPage /> },
          { path: 'requests/:id', element: <JobRequestPage /> },
          { path: 'reviews', element: <MyReviewsPage /> },
          { path: 'history', element: <WorkHistoryPage /> },
          { path: 'verification', element: <VerificationUploadPage /> },
          { path: 'help', element: <HelpPage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'verifications', element: <VerificationQueuePage /> },
          { path: 'verifications/:id', element: <VerificationReviewPage /> },
          { path: 'reports', element: <ReportsQueuePage /> },
          { path: 'reports/:id', element: <ReportResolvePage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'catalog', element: <CatalogPage /> },
        ],
      },
      {
        element: (
          <RequireAuth>
            <RoleLayout />
          </RequireAuth>
        ),
        children: [
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'account', element: <AccountSettingsPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
