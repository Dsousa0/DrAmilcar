// frontend/src/components/Conversations/ConversationList.jsx
export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col">
      {/* Section label */}
      <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '14px 16px 6px' }}>
        Conversas
      </p>

      {/* Nova conversa */}
      <div style={{ padding: '0 10px 8px' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#78716c',
            background: 'none',
            border: '1.5px dashed #d6c5ae',
            borderRadius: '7px',
            padding: '7px 10px',
            cursor: 'pointer',
            transition: 'all 150ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d6a96a'
            e.currentTarget.style.color = '#44403c'
            e.currentTarget.style.background = '#faf7f3'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d6c5ae'
            e.currentTarget.style.color = '#78716c'
            e.currentTarget.style.background = 'none'
          }}
        >
          <span style={{ color: '#d6a96a', fontSize: '14px', lineHeight: 1 }}>＋</span>
          Nova conversa
        </button>
      </div>

      {/* List */}
      {conversations.length > 0 && (
        <ul className="overflow-y-auto" style={{ maxHeight: '180px' }}>
          {conversations.map((conv) => {
            const isActive = conv._id === activeId
            return (
              <li key={conv._id}>
                <button
                  onClick={() => onSelect(conv._id)}
                  style={{
                    border: 'none',
                    borderLeft: isActive ? '2.5px solid #d6a96a' : '2.5px solid transparent',
                    textAlign: 'left',
                    padding: isActive ? '8px 10px 8px 8px' : '8px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#292524' : '#78716c',
                    background: isActive ? '#f0ede8' : 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    margin: '1px 8px',
                    width: 'calc(100% - 16px)',
                    transition: 'all 120ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f5f3ef' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none' }}
                >
                  {conv.title || 'Nova conversa'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
