export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onNew}
          className="w-full text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg py-1.5 transition-colors"
        >
          + Nova Conversa
        </button>
      </div>

      {conversations.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase px-4 pb-1 tracking-wide">
            Conversas
          </p>
          <ul className="overflow-y-auto max-h-48">
            {conversations.map((conv) => (
              <li key={conv._id}>
                <button
                  onClick={() => onSelect(conv._id)}
                  className={`w-full text-left px-4 py-2 text-xs truncate transition-colors ${
                    conv._id === activeId
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {conv.title || 'Nova conversa'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
