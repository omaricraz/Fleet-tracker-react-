import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { AppShell } from '@/layouts/AppShell'
import { DashboardPage } from '@/features/dashboard'
import { ResourceManagementPage } from '@/features/resource-management'
import { FleetManagementPage } from '@/pages/FleetManagementPage'
import { TripManagementPage } from '@/pages/TripManagementPage'
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
    children: appRoutes.map((route) => ({
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
        ) : (
          <PlaceholderPage route={route} />
        ),
    })),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
