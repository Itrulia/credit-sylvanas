import type { ReactNode } from 'react'

/** Single-column text page: About, Impressum, Privacy. */
export function ProsePage({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <div className="page-wrap py-8">
      <div className="max-w-prose space-y-10 text-base leading-7">
        <header className="space-y-3">
          <h1 className="text-display">{title}</h1>
          <div className="text-muted-foreground">{intro}</div>
        </header>
        {children}
      </div>
    </div>
  )
}

export function ProseSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2
        id={id}
        tabIndex={-1}
        className="text-title border-b border-border-strong pb-2 outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
