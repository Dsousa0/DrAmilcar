const authService = require('../../src/services/auth.service')

describe('hashPassword', () => {
  it('should return a bcrypt hash different from the input', async () => {
    const hash = await authService.hashPassword('mypassword')
    expect(hash).not.toBe('mypassword')
    expect(hash).toMatch(/^\$2b\$12\$/)
  })
})

describe('comparePassword', () => {
  it('should return true when password matches hash', async () => {
    const hash = await authService.hashPassword('correct')
    expect(await authService.comparePassword('correct', hash)).toBe(true)
  })

  it('should return false when password does not match hash', async () => {
    const hash = await authService.hashPassword('correct')
    expect(await authService.comparePassword('wrong', hash)).toBe(false)
  })
})

describe('generateToken', () => {
  it('should return a three-part JWT string', () => {
    const token = authService.generateToken({ userId: 'abc123', email: 'a@b.com' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyToken', () => {
  it('should return the original payload for a valid token', () => {
    const token = authService.generateToken({ userId: 'abc123', email: 'a@b.com', role: 'admin' })
    const payload = authService.verifyToken(token)
    expect(payload.userId).toBe('abc123')
    expect(payload.email).toBe('a@b.com')
    expect(payload.role).toBe('admin')
  })

  it('should throw for a tampered token', () => {
    expect(() => authService.verifyToken('invalid.token.here')).toThrow()
  })
})
