import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ThinkingDots() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#f07820',
            display: 'inline-block',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            opacity: 0.7,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </span>
  )
}

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  const isThinking = !isUser && content === ''

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '16px',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '28px',
            height: '28px',
            background: 'rgba(240,120,32,0.10)',
            border: '1.5px solid rgba(240,120,32,0.25)',
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Lora', serif",
            fontSize: '11px',
            fontWeight: 700,
            color: '#f07820',
            marginTop: '1px',
          }}
        >
          A
        </div>
      )}
      <div
        style={{
          maxWidth: '76%',
          padding: '10px 14px',
          fontSize: '13px',
          lineHeight: isUser ? 1.55 : 1.7,
          borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          background: isUser ? '#f07820' : '#1a1815',
          color: isUser ? '#0d0c0a' : '#c8c0b4',
          border: isUser ? 'none' : '1px solid #242018',
          fontWeight: isUser ? 500 : 400,
        }}
      >
        {isUser ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content}</p>
        ) : isThinking ? (
          <ThinkingDots />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, children, className, ...props }) {
                const isBlock = /language-/.test(className || '')
                return isBlock ? (
                  <pre
                    style={{
                      background: '#0d0c0a',
                      color: '#ede8df',
                      borderRadius: '8px',
                      padding: '12px',
                      overflowX: 'auto',
                      fontSize: '12px',
                      margin: '8px 0',
                      border: '1px solid #242018',
                    }}
                  >
                    <code className={className} {...props}>{children}</code>
                  </pre>
                ) : (
                  <code
                    style={{
                      background: '#0d0c0a',
                      color: '#f07820',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      fontSize: '12px',
                      border: '1px solid #242018',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p({ children }) {
                return <p style={{ margin: '0 0 8px' }}>{children}</p>
              },
              strong({ children }) {
                return <strong style={{ color: '#ede8df', fontWeight: 600 }}>{children}</strong>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
