import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/providers/theme-provider'
import { router } from '@/routes'

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
