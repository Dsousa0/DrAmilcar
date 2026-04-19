const { splitIntoChunks } = require('../../src/services/pdf.service')

describe('splitIntoChunks', () => {
  it('should return an array of strings', async () => {
    const chunks = await splitIntoChunks('Hello world')
    expect(Array.isArray(chunks)).toBe(true)
    expect(chunks.every((c) => typeof c === 'string')).toBe(true)
  })

  it('should split long text into multiple chunks', async () => {
    const longText = 'word '.repeat(600) // ~3000 chars, exceeds 1000 chunk size
    const chunks = await splitIntoChunks(longText)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('should return a single chunk for short text', async () => {
    const chunks = await splitIntoChunks('Short paragraph.')
    expect(chunks).toHaveLength(1)
  })

  it('should not return empty or whitespace-only chunks', async () => {
    const chunks = await splitIntoChunks('Some meaningful text content here.')
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true)
  })
})
