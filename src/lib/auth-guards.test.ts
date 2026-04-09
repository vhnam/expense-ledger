import { describe, expect, it } from 'vitest'
import { hasAuthenticatedUser, isPublicPath } from './auth-guards'

describe('isPublicPath', () => {
  it('allows auth page and child routes', () => {
    expect(isPublicPath('/auth')).toBe(true)
    expect(isPublicPath('/auth/reset-password')).toBe(true)
  })

  it('allows better-auth api routes', () => {
    expect(isPublicPath('/api/auth/sign-in/email')).toBe(true)
  })

  it('blocks protected application routes', () => {
    expect(isPublicPath('/')).toBe(false)
    expect(isPublicPath('/accounts')).toBe(false)
  })
})

describe('hasAuthenticatedUser', () => {
  it('returns true only when user exists in result.data', () => {
    expect(hasAuthenticatedUser({ data: { user: { id: 'u_1' } } })).toBe(true)
    expect(hasAuthenticatedUser({ data: { user: undefined } })).toBe(false)
    expect(hasAuthenticatedUser({ data: null })).toBe(false)
    expect(hasAuthenticatedUser(null)).toBe(false)
  })

  it('guards against misreading the getSession response shape', () => {
    const result = { data: { user: { id: 'u_1' } } }

    // Legacy buggy check used session?.user on the wrapper object.
    const buggyCheck = Boolean((result as { user?: unknown }).user)
    expect(buggyCheck).toBe(false)
    expect(hasAuthenticatedUser(result)).toBe(true)
  })
})
