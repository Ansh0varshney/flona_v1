import AuthGuard from './components/Auth/AuthGuard'
import ChatRoom from './components/Chat/ChatRoom'

export default function HomePage() {
  return (
    <AuthGuard>
      <ChatRoom />
    </AuthGuard>
  )
}
