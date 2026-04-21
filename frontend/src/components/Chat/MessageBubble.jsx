import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ThinkingDots() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#c5bdb4',
            display: 'inline-block',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </span>
  )
}

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  const isThinking = !isUser && content === ''

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
      {!isUser && (
        <div style={{
          width: '26px',
          height: '26px',
          background: '#f0ede8',
          border: '1.5px solid #e8e5e0',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Lora', serif",
          fontSize: '10px',
          fontWeight: 700,
          color: '#d6a96a',
          marginTop: '1px',
        }}>
          A
        </div>
      )}
      <div
        style={{
          maxWidth: '76%',
          padding: '10px 14px',
          fontSize: '13px',
          lineHeight: isUser ? 1.55 : 1.65,
          borderRadius: isUser ? '16px 16px 3px 16px' : '3px 16px 16px 16px',
          background: isUser ? '#292524' : '#f5f4f1',
          color: isUser ? '#fafaf9' : '#44403c',
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
                  <pre style={{ background: '#1c1917', color: '#fafaf9', borderRadius: '8px', padding: '12px', overflowX: 'auto', fontSize: '12px', margin: '8px 0' }}>
                    <code className={className} {...props}>{children}</code>
                  </pre>
                ) : (
                  <code style={{ background: '#e8e5e0', color: '#44403c', borderRadius: '4px', padding: '1px 5px', fontSize: '12px' }} {...props}>
                    {children}
                  </code>
                )
              },
              p({ children }) {
                return <p style={{ margin: '0 0 8px' }}>{children}</p>
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
