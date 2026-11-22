/** The one public contact. Never invent one: an empty value renders the pending note. */
export function ContactEmail() {
  // read at render, so tests can stub it
  const email = (import.meta.env.VITE_CONTACT_EMAIL ?? '').trim()
  if (!email) {
    return (
      <span>
        We haven't published a contact address yet. It will appear here.
      </span>
    )
  }
  return (
    <a href={`mailto:${email}`} className="underline">
      {email}
    </a>
  )
}
