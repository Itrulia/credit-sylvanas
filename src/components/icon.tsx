import type { ComponentProps } from 'react'
import type { IconName } from '#/lib/icons'
import { cn } from '#/lib/utils'

const SIZE = {
  16: 'icon-16',
  20: 'icon-20',
  24: 'icon-24',
  40: 'icon-40',
  48: 'icon-48',
} as const

export type IconProps = {
  name: IconName
  size?: keyof typeof SIZE
  fill?: boolean
} & Omit<ComponentProps<'span'>, 'children'>

export function Icon({
  name,
  size = 16,
  fill,
  className,
  ...props
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      translate="no" // Google Translate would translate the ligature word and break the glyph
      data-fill={fill || undefined}
      className={cn('icon', SIZE[size], className)}
      {...props}
    >
      {name}
    </span>
  )
}
