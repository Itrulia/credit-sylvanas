// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { iconOnlyTooltip } from './wowhead'

it('keeps mouseover on the name from reaching the document, so only the icon opens the tooltip', () => {
  const link = document.createElement('a')
  const icon = document.createElement('span')
  const name = document.createElement('span')
  link.appendChild(icon)
  link.appendChild(name)
  document.body.appendChild(link)
  const onDocument = vi.fn()
  document.addEventListener('mouseover', onDocument)

  const cleanup = iconOnlyTooltip(name)
  name.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  expect(onDocument).not.toHaveBeenCalled()

  icon.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  expect(onDocument).toHaveBeenCalledTimes(1)

  cleanup?.()
  name.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  expect(onDocument).toHaveBeenCalledTimes(2)
  document.removeEventListener('mouseover', onDocument)
})
