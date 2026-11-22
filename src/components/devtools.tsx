import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools'
import { pacerDevtoolsPlugin } from '@tanstack/react-pacer-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

// Loaded only under import.meta.env.DEV (see __root.tsx); never in the production bundle.
export default function Devtools() {
  return (
    <TanStackDevtools
      config={{ position: 'bottom-right' }}
      plugins={[
        { name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> },
        { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
        formDevtoolsPlugin(),
        pacerDevtoolsPlugin(),
        hotkeysDevtoolsPlugin(),
      ]}
    />
  )
}
