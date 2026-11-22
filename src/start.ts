import { createMiddleware, createStart } from '@tanstack/react-start'
import { hideServerError } from './lib/errors'

const hideErrors = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    try {
      return await next()
    } catch (error) {
      throw hideServerError(error)
    }
  },
)

export const startInstance = createStart(() => ({
  functionMiddleware: [hideErrors],
}))
