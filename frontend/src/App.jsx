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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-white border-r border-gray-200 shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">DrAmilcar</h1>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
        />

        <div className="border-t border-gray-100 mt-1" />

        {/* Upload */}
        <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />

        {/* Error */}
        {docsError && <p className="text-xs text-red-500 px-4 -mt-2 mb-2">{docsError}</p>}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 uppercase px-4 pt-2 pb-1 tracking-wide">
            Documentos indexados
          </p>
          <DocumentList documents={documents} loading={docsLoading} onRemove={remove} />
        </div>

        {/* Logout */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
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
