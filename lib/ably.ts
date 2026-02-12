import Ably from 'ably'

export const GLOBAL_CHANNEL = 'campus:global'

// Client-side: use token auth
export async function getAblyClient() {
  return new Ably.Realtime({
    authUrl: '/api/ably/token',
  })
}
