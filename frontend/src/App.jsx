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
        padding: '7px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: active ? 600 : 400,
        color: active ? '#f07820' : '#6b6058',
        background: active ? 'rgba(240,120,32,0.10)' : 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#b0a899' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#6b6058' }}
    >
      {children}
    </button>
  )
}

function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [adminView, setAdminView] = useState(false)
  const [activeView, setActiveView] = useState('chat')
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
  const { documents, loading: docsLoading, uploading, uploadProgress, uploadQueue, error: docsError, upload, remove } = useDocuments(activeId)

  if (adminView) {
    return <AdminUsers onBack={() => setAdminView(false)} />
  }

  const activeConv = conversations.find((c) => c._id === activeId)
  const activeTitle = activeConv?.title || 'Nova conversa'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d0c0a' }}>
      {/* Sidebar */}
      <aside
        className="w-72 flex flex-col shrink-0"
        style={{
          background: '#131110',
          borderRight: '1px solid #242018',
        }}
      >
        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #242018' }}>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '19px',
              fontWeight: 700,
              color: '#ede8df',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            Dr. <span style={{ color: '#f07820' }}>Theo</span>
          </h1>
          <p style={{ fontSize: '10px', color: '#4a433d', marginTop: '3px', fontWeight: 400, letterSpacing: '0.04em' }}>
            base de conhecimento
          </p>
        </div>

        {/* Nav tabs */}
        <div style={{ padding: '8px', borderBottom: '1px solid #242018', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid #242018', marginTop: 'auto' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
            <p
              style={{
                fontSize: '10px',
                color: '#4a433d',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '160px',
              }}
            >
              {user?.email}
            </p>
            {isAdmin && (
              <button
                onClick={() => setAdminView(true)}
                style={{
                  fontSize: '10px',
                  color: '#f07820',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  padding: '0',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffa050')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#f07820')}
              >
                Usuários
              </button>
            )}
          </div>
          <button
            onClick={logout}
            style={{
              fontSize: '10px',
              color: '#4a433d',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#e05040')}
            onMouseLeave={(e) => (e.target.style.color = '#4a433d')}
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
            conversationId={activeId}
            conversationTitle={activeTitle}
            ensureActiveConversation={ensureActiveConversation}
            upload={upload}
            uploading={uploading}
            uploadProgress={uploadProgress}
            uploadQueue={uploadQueue}
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
