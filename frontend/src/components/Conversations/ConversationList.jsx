export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
      {/* Section label */}
      <p
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#3a3530',
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          padding: '14px 16px 6px',
        }}
      >
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
            color: '#6b6058',
            background: 'none',
            border: '1.5px dashed #2a2620',
            borderRadius: '7px',
            padding: '7px 10px',
            cursor: 'pointer',
            transition: 'all 150ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(240,120,32,0.4)'
            e.currentTarget.style.color = '#b0a899'
            e.currentTarget.style.background = 'rgba(240,120,32,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2620'
            e.currentTarget.style.color = '#6b6058'
            e.currentTarget.style.background = 'none'
          }}
        >
          <span style={{ color: '#f07820', fontSize: '14px', lineHeight: 1 }}>＋</span>
          Nova conversa
        </button>
      </div>

      {/* List */}
      {conversations.length > 0 && (
        <ul className="overflow-y-auto" style={{ maxHeight: '200px' }}>
          {conversations.map((conv) => {
            const isActive = conv._id === activeId
            return (
              <li key={conv._id}>
                <button
                  onClick={() => onSelect(conv._id)}
                  style={{
                    border: 'none',
                    borderLeft: isActive ? '2px solid #f07820' : '2px solid transparent',
                    textAlign: 'left',
                    padding: isActive ? '7px 10px 7px 9px' : '7px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#ede8df' : '#6b6058',
                    background: isActive ? 'rgba(240,120,32,0.08)' : 'none',
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
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.color = '#b0a899'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.color = '#6b6058'
                    }
                  }}
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
