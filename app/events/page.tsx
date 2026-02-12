import AuthGuard from '../components/Auth/AuthGuard'
import EventsPage from '../components/Events/EventsPage'

export default function EventsRoute() {
  return (
    <AuthGuard>
      <EventsPage />
    </AuthGuard>
  )
}
