import {
  favouriteItems,
  isFavourite,
  toggleFavourite,
  useSavedItems,
} from '#/lib/saved-items'
import type { SavedItem } from '#/lib/saved-items'
import { m } from '#/i18n'
import { Icon } from '../icon'

/** Star toggle for the item header; the favourite lives in local storage only. */
export function FavouriteButton(item: SavedItem) {
  const pressed = isFavourite(useSavedItems(favouriteItems), item)
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => toggleFavourite(item)}
      className="inline-flex min-h-6 items-center gap-1 rounded-sm text-muted-foreground hover:text-foreground aria-pressed:text-foreground pointer-coarse:min-h-11"
    >
      <Icon name="star" />
      {m.item.favouriteButton()}
    </button>
  )
}
