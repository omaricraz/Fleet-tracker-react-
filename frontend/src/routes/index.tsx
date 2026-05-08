import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DriverMobileShell } from '@/layouts/DriverMobileShell'
import { DashboardPage } from '@/features/dashboard'
import { RequestManagementPage } from '@/features/request-management'
import { ResourceManagementPage } from '@/features/resource-management'
import { FleetManagementPage } from '@/pages/FleetManagementPage'
import { TripManagementPage } from '@/pages/TripManagementPage'
import { DriverSalesPosPage } from '@/pages/DriverSalesPosPage'
import { DriverSubmitRequestPage } from '@/pages/DriverSubmitRequestPage'
import { DriverTripPage } from '@/pages/DriverTripPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { appRoutes } from '@/routes/manifest'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/platform" />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <AppShell />,
    children: appRoutes
      .filter((route) => !route.path.startsWith('/driver'))
      .map((route) => ({
        path: route.path,
        element:
          route.path === '/dashboard' ? (
            <DashboardPage />
          ) : route.path === '/fleet-management' ? (
            <FleetManagementPage />
          ) : route.path === '/trip-management' ? (
            <TripManagementPage />
          ) : route.path === '/resource-management' ? (
            <ResourceManagementPage />
          ) : route.path === '/request-management' ? (
            <RequestManagementPage />
          ) : (
            <PlaceholderPage route={route} />
          ),
      })),
  },
  {
    path: '/driver',
    element: <DriverMobileShell />,
    children: [
      { index: true, element: <DriverSubmitRequestPage /> },
      { path: 'trip', element: <DriverTripPage /> },
      { path: 'sales', element: <DriverSalesPosPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
