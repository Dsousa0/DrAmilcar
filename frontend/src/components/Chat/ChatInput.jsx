import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const question = value.trim()
    if (!question || disabled) return
    onSend(question)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: '14px 20px 18px', borderTop: '1px solid #242018', background: '#0d0c0a' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          background: '#131110',
          border: '1.5px solid #242018',
          borderRadius: '12px',
          padding: '10px 12px',
          transition: 'border-color 200ms, box-shadow 200ms',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = '#f07820'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240,120,32,0.08)'
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = '#242018'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta sobre os documentos…"
          disabled={disabled}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: '#ede8df',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            opacity: disabled ? 0.4 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            width: '34px',
            height: '34px',
            background: canSend ? '#f07820' : '#1a1815',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            fontSize: '16px',
            color: canSend ? '#0d0c0a' : '#2e2a24',
            fontWeight: 700,
            transition: 'background 150ms, color 150ms, transform 80ms',
          }}
          onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = '#e06810' }}
          onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = '#f07820' }}
          onMouseDown={(e) => { if (canSend) e.currentTarget.style.transform = 'scale(0.92)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          ↑
        </button>
      </div>
    </form>
  )
}
