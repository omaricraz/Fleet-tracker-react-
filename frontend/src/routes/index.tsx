import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { AppShell } from '@/layouts/AppShell'
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
      element: <PlaceholderPage route={route} />,
    })),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
