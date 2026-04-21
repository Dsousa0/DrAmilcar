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
      style={{ padding: '14px 20px 18px', borderTop: '1px solid #e8e5e0', background: '#fffffe' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          background: '#f5f4f1',
          border: '1.5px solid #e8e5e0',
          borderRadius: '12px',
          padding: '10px 12px',
          transition: 'border-color 200ms',
        }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#d6a96a')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
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
            color: '#44403c',
            fontFamily: 'inherit',
            lineHeight: 1.55,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            width: '32px',
            height: '32px',
            background: canSend ? '#d6a96a' : '#e8e5e0',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            fontSize: '15px',
            color: canSend ? '#fff' : '#a8a29e',
            fontWeight: 700,
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = '#c4954f' }}
          onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = '#d6a96a' }}
        >
          ↑
        </button>
      </div>
    </form>
  )
}
