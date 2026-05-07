import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [adminView, setAdminView] = useState(false)
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
  const {
    documents,
    uploading,
    uploadProgress,
    uploadQueue,
    error: docsError,
    upload,
    remove,
  } = useDocuments(activeId)

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

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => selectConversation(id)}
          onNew={() => newConversation()}
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
        <ChatWindow
          messages={messages}
          conversationId={activeId}
          activeTitle={activeTitle}
          documents={documents}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadQueue={uploadQueue}
          docsError={docsError}
          upload={upload}
          onRemoveDocument={remove}
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
  const { token, mustChangePassword } = useAuth()
  if (!token) return <Login />
  if (mustChangePassword) return <ChangePassword />
  return <MainLayout />
}
