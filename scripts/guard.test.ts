import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assertLocalOnly } from './guard.ts'

const local = readFileSync('wrangler.jsonc', 'utf8')
const remote = local.replace(
  '"migrations_dir": "migrations"',
  '"migrations_dir": "migrations", "remote": true',
)

describe('assertLocalOnly', () => {
  it('allows the committed local config', () => {
    expect(() => assertLocalOnly([], {}, local)).not.toThrow()
  })

  it('refuses --remote, CI and a remote D1 binding', () => {
    expect(() => assertLocalOnly(['--remote'], {}, local)).toThrow(/--remote/)
    expect(() => assertLocalOnly([], { CI: '1' }, local)).toThrow(/CI/)
    expect(remote).toContain('"remote": true')
    expect(() => assertLocalOnly([], {}, remote)).toThrow(/"remote": true/)
  })
})

describe.each(['scripts/seed-local.ts', 'scripts/seed-synthetic.ts'])(
  '%s',
  (script) => {
    const source = readFileSync(script, 'utf8')

    it('runs the guard before anything else and asks for local bindings only', () => {
      expect(source.indexOf('guardOrExit()')).toBeGreaterThan(-1)
      expect(source.indexOf('guardOrExit()')).toBeLessThan(
        source.indexOf('getPlatformProxy<'),
      )
      expect(source).toMatch(/remoteBindings: false/)
    })

    const run = (args: string[], env: Record<string, string>) => {
      try {
        execFileSync(process.execPath, [script, ...args], {
          env: { ...process.env, CI: '', ...env },
          stdio: 'pipe',
          timeout: 20_000,
        })
        return { code: 0, stderr: '' }
      } catch (e) {
        const err = e as { status: number; stderr: Buffer }
        return { code: err.status, stderr: err.stderr.toString() }
      }
    }

    it('refuses --remote', () => {
      const r = run(['--remote'], {})
      expect(r.code).toBe(1)
      expect(r.stderr).toMatch(/--remote/)
    })

    it('refuses CI', () => {
      const r = run([], { CI: 'true' })
      expect(r.code).toBe(1)
      expect(r.stderr).toMatch(/CI/)
    })
  },
)
