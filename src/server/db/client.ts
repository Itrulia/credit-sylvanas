import '@tanstack/react-start/server-only'
import { env } from 'cloudflare:workers'

// The only file that knows where the database lives (DESIGN §2).
export const db = (): D1Database => env.DB
