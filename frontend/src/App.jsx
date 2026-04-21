// frontend/src/App.jsx
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import UploadZone from './components/Upload/UploadZone.jsx'
import DocumentList from './components/Documents/DocumentList.jsx'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function MainLayout() {
  const { user, logout } = useAuth()
  const { documents, loading: docsLoading, uploading, uploadProgress, error: docsError, upload, remove } = useDocuments()
  const {
    conversations,
    activeId,
    messages,
    selectConversation,
    newConversation,
    ensureActiveConversation,
    appendOptimistic,
    appendTokenToLast,
    refreshList,
  } = useConversations()

  const activeConv = conversations.find((c) => c._id === activeId)
  const activeTitle = activeConv?.title || 'Nova conversa'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fffffe' }}>
      {/* Sidebar */}
      <aside className="w-72 flex flex-col shrink-0" style={{ background: '#fafaf9', borderRight: '1px solid #e8e5e0' }}>

        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #e8e5e0' }}>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.3px' }}>
            DrAmilcar
          </h1>
          <p style={{ fontSize: '10px', color: '#a8a29e', marginTop: '3px', fontWeight: 400 }}>
            base de conhecimento
          </p>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
        />

        {/* Divider */}
        <div style={{ height: '1px', background: '#e8e5e0', margin: '4px 0 0' }} />

        {/* Upload */}
        <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />

        {/* Upload error */}
        {docsError && (
          <p style={{ fontSize: '11px', color: '#c25b4a', padding: '0 16px 8px' }}>{docsError}</p>
        )}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '10px 16px 6px' }}>
            Documentos
          </p>
          <DocumentList documents={documents} loading={docsLoading} onRemove={remove} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e8e5e0' }}>
          <p style={{ fontSize: '10px', color: '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {user?.email}
          </p>
          <button
            onClick={logout}
            style={{ fontSize: '10px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.target.style.color = '#c25b4a')}
            onMouseLeave={(e) => (e.target.style.color = '#a8a29e')}
          >
            sair
          </button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
          activeTitle={activeTitle}
          docCount={documents.length}
          appendOptimistic={appendOptimistic}
          appendTokenToLast={appendTokenToLast}
          ensureActiveConversation={ensureActiveConversation}
          refreshList={refreshList}
        />
      </main>
    </div>
  )
}

export default function App() {
  const { token } = useAuth()
  return token ? <MainLayout /> : <Login />
}
