import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, children, ...props }) {
                return inline ? (
                  <code className="bg-gray-100 text-gray-800 rounded px-1 text-xs" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs mt-2 mb-2">
                    <code {...props}>{children}</code>
                  </pre>
                )
              },
            }}
          >
            {content || '▋'}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
