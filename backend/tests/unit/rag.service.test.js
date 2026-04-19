const { buildPrompt } = require('../../src/services/rag.service')

describe('buildPrompt', () => {
  it('should include all chunks joined in the system message', () => {
    const { system } = buildPrompt(['chunk one', 'chunk two'], 'What is this?')
    expect(system).toContain('chunk one')
    expect(system).toContain('chunk two')
  })

  it('should put the question in the user message, not system', () => {
    const question = 'What is the deadline?'
    const { system, user } = buildPrompt(['context'], question)
    expect(user).toBe(question)
    // Question must NOT appear verbatim inside system instructions
    const instructionPart = system.split('CONTEXTO:')[0]
    expect(instructionPart).not.toContain(question)
  })

  it('should include the CONTEXTO delimiter in the system message', () => {
    const { system } = buildPrompt(['data'], 'Question?')
    expect(system).toContain('CONTEXTO:')
  })

  it('should handle empty chunks array gracefully', () => {
    const { system } = buildPrompt([], 'Question?')
    expect(typeof system).toBe('string')
    expect(system.length).toBeGreaterThan(0)
  })
})
