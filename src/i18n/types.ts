/**
 * One message: `() => 'Text'` or `({ n }: { n: number }) => ...`. Any
 * one-argument function is assignable to `(params: never) => string`.
 */
export type Message = (params: never) => string

/** An area's messages. Modules use `satisfies Catalog` to keep exact keys. */
export type Catalog = Record<string, Message>
