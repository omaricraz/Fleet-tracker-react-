import { Navigate, createBrowserRouter } from 'react-router-dom'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { AppProviders } from '@/components/providers/app-providers'
import { AppShell } from '@/layouts/AppShell'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DriverMobileShell } from '@/layouts/DriverMobileShell'
import { DashboardPage } from '@/features/dashboard'
import { RequestManagementPage } from '@/features/request-management'
import { ResourceManagementPage } from '@/features/resource-management'
import { GuestOnly, RequireAuth } from '@/features/auth/RequireAuth'
import { FleetManagementPage } from '@/pages/FleetManagementPage'
import { FleetVehicleProfilePage } from '@/pages/FleetVehicleProfilePage'
import { TripManagementPage } from '@/pages/TripManagementPage'
import { TripProfilePage } from '@/pages/TripProfilePage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { DriverSalesPosPage } from '@/pages/DriverSalesPosPage'
import { DriverProfilePage } from '@/pages/DriverProfilePage'
import { DriverSubmitRequestPage } from '@/pages/DriverSubmitRequestPage'
import { InventoryAlertsPage } from '@/pages/InventoryAlertsPage'
import { DriverTripPage } from '@/pages/DriverTripPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { useAuth } from '@/features/auth/AuthContext'
import { getHomePath } from '@/features/auth/permissions'
import { INVENTORY_ALERTS_PAGE_PATH } from '@/features/inventory-alerts/constants'
import { appRoutes } from '@/routes/manifest'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <LoadingSkeleton className="h-24 w-full max-w-md" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={getHomePath(user)} replace />
}

export const router = createBrowserRouter([
  {
    element: <AppProviders />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: (
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            ),
          },
        ],
      },
      {
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        children: [
          ...appRoutes
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
                ) : route.path === '/user-management' ? (
                  <UserManagementPage />
                ) : (
                  <PlaceholderPage route={route} />
                ),
            })),
          { path: '/trip-management/:id', element: <TripProfilePage /> },
          { path: '/fleet-management/vehicles/:id', element: <FleetVehicleProfilePage /> },
          { path: INVENTORY_ALERTS_PAGE_PATH, element: <InventoryAlertsPage /> },
        ],
      },
      {
        path: '/driver',
        element: (
          <RequireAuth>
            <DriverMobileShell />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <DriverSubmitRequestPage /> },
          { path: 'trip', element: <DriverTripPage /> },
          { path: 'sales', element: <DriverSalesPosPage /> },
          { path: 'profile', element: <DriverProfilePage /> },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
