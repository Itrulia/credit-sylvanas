import type { CommandMatch } from './command'

export interface GroupedMatch extends CommandMatch {
  index: number
}

export interface CommandMatchGroup {
  group: string
  matches: GroupedMatch[]
}

/**
 * Collects matches into one block per group, ordered by each block's best
 * match, and numbers rows across blocks so one index drives the keyboard.
 */
export function groupMatches(
  matches: CommandMatch[],
  startIndex = 0,
): CommandMatchGroup[] {
  const order: string[] = []
  const buckets = new Map<string, CommandMatch[]>()

  for (const match of matches) {
    const group = match.command.group
    if (!buckets.has(group)) {
      buckets.set(group, [])
      order.push(group)
    }
    buckets.get(group)!.push(match)
  }

  let index = startIndex

  return order.map((group) => ({
    group,
    matches: buckets.get(group)!.map((match) => ({ ...match, index: index++ })),
  }))
}
