// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { tagForWowhead } from '#/lib/wowhead'
import { renderInRouter } from './heatmap/test-utils'
import { ItemLink } from './item-link'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('tags the link for Wowhead only once React has mounted it', async () => {
  renderInRouter(<ItemLink id={2589} name="Linen Cloth" region="eu" />)
  const link = await screen.findByRole('link', { name: 'Linen Cloth' })
  expect(link.getAttribute('data-wowhead')).toBe('item=2589&domain=forever')
})

it('leaves the tag out of server HTML, where Wowhead could edit an unhydrated section', async () => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ItemLink id={2589} name="Linen Cloth" region="eu" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  const html = renderToString(<RouterProvider router={router} />)
  expect(html).toContain('Linen Cloth')
  expect(html).not.toContain('data-wowhead')
  // the icon placeholder in styles.css keys off this until hydration
  expect(html).toContain('data-item-link')
})

it('rescans Wowhead links once per frame after tagging', () => {
  const refreshLinks = vi.fn()
  vi.stubGlobal('WH', { Tooltips: { refreshLinks } })
  let frame: FrameRequestCallback = () => undefined
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frame = cb
    return 1
  })
  const a = document.createElement('a')
  const b = document.createElement('a')
  tagForWowhead(1)(a)
  tagForWowhead(2)(b)
  expect(a.dataset.wowhead).toBe('item=1&domain=forever')
  expect(refreshLinks).not.toHaveBeenCalled()
  frame(0)
  expect(refreshLinks).toHaveBeenCalledTimes(1)
})
