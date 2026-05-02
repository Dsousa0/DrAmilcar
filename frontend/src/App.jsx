import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: active ? 600 : 400,
        color: active ? '#1c1917' : '#a8a29e',
        background: active ? '#f0ede8' : 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#44403c' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#a8a29e' }}
    >
      {children}
    </button>
  )
}

function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [adminView, setAdminView] = useState(false)
  const [activeView, setActiveView] = useState('chat')
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

  if (adminView) {
    return <AdminUsers onBack={() => setAdminView(false)} />
  }

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

        {/* Nav tabs */}
        <div style={{ padding: '8px', borderBottom: '1px solid #e8e5e0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <NavButton active={activeView === 'chat'} onClick={() => setActiveView('chat')}>
            Chat
          </NavButton>
          <NavButton active={activeView === 'documents'} onClick={() => setActiveView('documents')}>
            Documentos
          </NavButton>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => { selectConversation(id); setActiveView('chat') }}
          onNew={() => { newConversation(); setActiveView('chat') }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e8e5e0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <p style={{ fontSize: '10px', color: '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
              {user?.email}
            </p>
            {isAdmin && (
              <button
                onClick={() => setAdminView(true)}
                style={{ fontSize: '10px', color: '#d6a96a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '0', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c4954f')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d6a96a')}
              >
                Usuários
              </button>
            )}
          </div>
          <button
            onClick={logout}
            style={{ fontSize: '10px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.target.style.color = '#c25b4a')}
            onMouseLeave={(e) => (e.target.style.color = '#a8a29e')}
          >
            sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeView === 'chat' ? (
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
        ) : (
          <DocumentsPage
            isAdmin={isAdmin}
            upload={upload}
            uploading={uploading}
            uploadProgress={uploadProgress}
            documents={documents}
            loading={docsLoading}
            error={docsError}
            onRemove={remove}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const { token } = useAuth()
  return token ? <MainLayout /> : <Login />
}
