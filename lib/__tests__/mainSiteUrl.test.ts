import { getMainSiteUrl } from '../mainSiteUrl'

describe('getMainSiteUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENV

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ENV
    } else {
      process.env.NEXT_PUBLIC_ENV = originalEnv
    }
  })

  it('returns production URL when NEXT_PUBLIC_ENV is production', () => {
    process.env.NEXT_PUBLIC_ENV = 'production'
    expect(getMainSiteUrl()).toBe('https://resilientleadership.us')
  })

  it('returns staging URL when NEXT_PUBLIC_ENV is staging', () => {
    process.env.NEXT_PUBLIC_ENV = 'staging'
    expect(getMainSiteUrl()).toBe('https://staging.resilientleadership.us')
  })

  it('defaults to staging URL when NEXT_PUBLIC_ENV is not set', () => {
    delete process.env.NEXT_PUBLIC_ENV
    expect(getMainSiteUrl()).toBe('https://staging.resilientleadership.us')
  })

  it('defaults to staging URL when NEXT_PUBLIC_ENV is development', () => {
    process.env.NEXT_PUBLIC_ENV = 'development'
    expect(getMainSiteUrl()).toBe('https://staging.resilientleadership.us')
  })

  it('defaults to staging URL when NEXT_PUBLIC_ENV is an unknown value', () => {
    process.env.NEXT_PUBLIC_ENV = 'something-else'
    expect(getMainSiteUrl()).toBe('https://staging.resilientleadership.us')
  })
})
