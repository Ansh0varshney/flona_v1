'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import * as Ably from 'ably'
import { ChatClient, type Room, type PresenceMember } from '@ably/chat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export interface Message {
  id: string
  text: string
  userName: string
  userEmail: string
  timestamp: number
  reactions?: Record<string, string[]>
}

// Function to generate anonymous name from email
function generateAnonymousName(email: string): string {
  const adjectives = ['Happy', 'Bright', 'Quick', 'Clever', 'Swift', 'Bold', 'Calm', 'Cool', 'Keen', 'Nice']
  const animals = ['Panda', 'Eagle', 'Tiger', 'Wolf', 'Fox', 'Hawk', 'Owl', 'Dolphin', 'Phoenix', 'Dragon']

  // Generate consistent hash from email
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  const adjIndex = Math.abs(hash) % adjectives.length
  const animIndex = Math.abs(hash >> 8) % animals.length

  return `${adjectives[adjIndex]} ${animals[animIndex]}`
}

export default function ChatRoom() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<PresenceMember[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [currentUserFlonaName, setCurrentUserFlonaName] = useState<string>('Anonymous')

  // Use refs to persist chat client and room across re-renders
  const realtimeClientRef = useRef<Ably.Realtime | null>(null)
  const chatClientRef = useRef<ChatClient | null>(null)
  const currentRoomRef = useRef<Room | null>(null)
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([])
  const messageIdsRef = useRef<Set<string>>(new Set())
  const isInitializedRef = useRef(false)
  const connectionPromiseRef = useRef<Promise<void> | null>(null)
  const flonaNameCacheRef = useRef<Map<string, string>>(new Map())

  function handleSignOut() {
    signOut()
  }

  async function getFlonaName(email: string): Promise<string> {
    // Check cache first
    if (flonaNameCacheRef.current.has(email)) {
      return flonaNameCacheRef.current.get(email)!
    }

    // Fetch from API
    try {
      const response = await fetch(`/api/user/flona-name?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        const flonaName = data.flonaName || generateAnonymousName(email)
        flonaNameCacheRef.current.set(email, flonaName)
        return flonaName
      }
    } catch {
      // Fallback to generated name
    }

    const fallback = generateAnonymousName(email)
    flonaNameCacheRef.current.set(email, fallback)
    return fallback
  }

  async function sendMessage(text: string) {
    console.log('sendMessage called', {
      roomExists: !!room,
      sessionExists: !!session?.user,
      roomType: typeof room,
      roomKeys: room ? Object.keys(room) : null
    })

    if (!room || !session?.user) {
      console.error('Cannot send message: room or session not available', { room: !!room, session: !!session?.user })
      return
    }

    try {
      // Save to database first
      console.log('Saving message to database...', text)
      const dbResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!dbResponse.ok) {
        const error = await dbResponse.json()
        console.error('Failed to save message to database:', error)
      } else {
        console.log('✓ Message saved to database')
      }

      // Then send via Ably for real-time delivery
      await room.messages.send({ text })
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  async function addReaction(messageId: string, emoji: string) {
    if (!room) return

    try {
      // For message reactions, use messages.reactions.send instead
      // Room reactions are ephemeral and not tied to specific messages
      await room.reactions.send({
        name: emoji,
      })
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  async function handleTyping(isTyping: boolean) {
    if (!room) return

    if (isTyping) {
      await room.typing.keystroke()
    } else {
      await room.typing.stop()
    }
  }

  // Fetch current user's flona name
  useEffect(() => {
    async function loadCurrentUserFlonaName() {
      if (session?.user?.flonaName) {
        setCurrentUserFlonaName(session.user.flonaName)
      } else if (session?.user?.email) {
        // Fallback: fetch from API if not in session
        const flonaName = await getFlonaName(session.user.email)
        setCurrentUserFlonaName(flonaName)
      }
    }
    loadCurrentUserFlonaName()
  }, [session])

  useEffect(function () {
    let isMounted = true

    async function setupChat() {
      // Prevent duplicate initialization
      if (isInitializedRef.current || !isMounted) {
        console.log('Chat already initialized or component unmounted, skipping setup')
        return
      }

      if (!session?.user) {
        console.log('No session available, skipping chat setup')
        return
      }

      isInitializedRef.current = true

      try {
        console.log('Starting chat setup for user:', session.user.email)

        // Reuse existing Ably client if already connected, otherwise create new one
        let realtimeClient = realtimeClientRef.current

        if (!realtimeClient || realtimeClient.connection.state !== 'connected') {
          console.log('Creating new Ably Realtime client...')
          realtimeClient = new Ably.Realtime({
            authUrl: '/api/ably/token',
            clientId: session.user.email!,
          })
          realtimeClientRef.current = realtimeClient

          const clientForConnection = realtimeClient

          // Wait for the client to connect
          console.log('Waiting for Ably connection...')
          if (!connectionPromiseRef.current) {
            connectionPromiseRef.current = new Promise<void>((resolve, reject) => {
              const connectTimeout = setTimeout(() => {
                console.error('Connection timeout - client state:', clientForConnection.connection.state)
                connectionPromiseRef.current = null
                reject(new Error('Connection timeout'))
              }, 15000)

              clientForConnection.connection.once('connected', () => {
                clearTimeout(connectTimeout)
                console.log('✓ Ably client connected')
                connectionPromiseRef.current = null
                resolve()
              })

              clientForConnection.connection.once('failed', (stateChange) => {
                clearTimeout(connectTimeout)
                const errorMsg = stateChange.reason?.message || 'Unknown error'
                console.error('✗ Ably connection failed:', errorMsg)
                connectionPromiseRef.current = null
                reject(new Error(`Ably connection failed: ${errorMsg}`))
              })
            })
          }

          await connectionPromiseRef.current
        } else {
          console.log('Reusing existing Ably connection')
        }

        if (!isMounted) return

        // Create Chat client if not exists
        if (!chatClientRef.current) {
          chatClientRef.current = new ChatClient(realtimeClient)
          console.log('✓ Chat client created')
        } else {
          console.log('Reusing existing Chat client')
        }

        // Get or create room
        try {
          if (!currentRoomRef.current) {
            currentRoomRef.current = await chatClientRef.current.rooms.get('campus-global', {
              typing: {},
              presence: {},
            })
            console.log('✓ Room obtained:', currentRoomRef.current)

            if (!currentRoomRef.current) {
              throw new Error('Room is null after creation')
            }

            await currentRoomRef.current.attach()
            console.log('✓ Chat room attached successfully')
          } else {
            console.log('Reusing existing room')
          }

          if (!isMounted) return

          console.log('Setting room state, room:', currentRoomRef.current)
          setRoom(currentRoomRef.current)
          console.log('✓ Room state set')
        } catch (roomError) {
          console.error('✗ Failed to get/attach room:', roomError instanceof Error ? roomError.message : roomError)
          throw roomError
        }

        // Load message history from database AFTER room is connected
        try {
          const response = await fetch('/api/messages')
          if (response.ok) {
            const historicalMessages = await response.json()
            setMessages(historicalMessages)
            // Add message IDs to prevent duplicates and cache flona names
            historicalMessages.forEach((msg: Message) => {
              messageIdsRef.current.add(msg.id)
              if (msg.userEmail && msg.userName) {
                flonaNameCacheRef.current.set(msg.userEmail, msg.userName)
              }
            })
            console.log(`✓ Loaded ${historicalMessages.length} historical messages`)
            console.log('Historical messages:', historicalMessages)
          }
        } catch (error) {
          console.error('Failed to load message history:', error)
        }

        // Only set up subscriptions once per room to prevent duplicates
        if (subscriptionsRef.current.length === 0) {
          console.log('Setting up room subscriptions...')

          // Subscribe to messages with proper cleanup and deduplication
          const messageSub = currentRoomRef.current.messages.subscribe(async (messageEvent) => {
            const messageId = messageEvent.message.serial || Date.now().toString()

            // Prevent duplicate messages
            if (messageIdsRef.current.has(messageId)) {
              console.log('Skipping duplicate message:', messageId)
              return
            }

            messageIdsRef.current.add(messageId)

            const clientEmail = messageEvent.message.clientId || ''
            const userName = clientEmail ? await getFlonaName(clientEmail) : 'Anonymous'

            const newMessage: Message = {
              id: messageId,
              text: messageEvent.message.text || '',
              userName,
              userEmail: clientEmail,
              timestamp: messageEvent.message.timestamp instanceof Date ? messageEvent.message.timestamp.getTime() : messageEvent.message.timestamp,
              reactions: {},
            }
            setMessages((prev) => [...prev, newMessage])
          })
          subscriptionsRef.current.push(messageSub)

          // Subscribe to room reactions (ephemeral, not tied to messages)
          const reactionSub = currentRoomRef.current.reactions.subscribe((reactionEvent) => {
            // Room reactions are ephemeral events, not message reactions
            // They appear as floating emojis or general reactions
            console.log('Room reaction received:', reactionEvent.reaction.name)
          })
          subscriptionsRef.current.push(reactionSub)

          // Subscribe to typing events
          const typingSub = currentRoomRef.current.typing.subscribe(async (typingEvent) => {
            // currentlyTyping is already a Set
            const typingSet = new Set(typingEvent.currentlyTyping)
            // Filter out current user
            if (session.user?.email) {
              typingSet.delete(session.user.email)
            }

            // Convert emails to flona names
            const flonaNames: string[] = []
            for (const email of typingSet) {
              const flonaName = await getFlonaName(email)
              flonaNames.push(flonaName)
            }

            setTypingUsers(new Set(flonaNames))
          })
          subscriptionsRef.current.push(typingSub)

          // Subscribe to presence events
          const presenceSub = currentRoomRef.current.presence.subscribe((presenceEvent) => {
            if (currentRoomRef.current) {
              currentRoomRef.current.presence.get().then((members) => {
                setOnlineUsers(members)
              })
            }
          })
          subscriptionsRef.current.push(presenceSub)

          console.log('✓ All subscriptions set up')
        } else {
          console.log('Subscriptions already set up, skipping')
        }

        // Join presence (safe to call multiple times)
        await currentRoomRef.current.presence.enter({
          name: currentUserFlonaName,
        })

        // Get initial presence
        const members = await currentRoomRef.current.presence.get()
        setOnlineUsers(members)
      } catch (error) {
        console.error('Failed to setup chat:', error instanceof Error ? error.message : error)
        if (error instanceof Error) {
          console.error('Error details:', error.stack)
        }
        isInitializedRef.current = false
      }
    }

    setupChat()

    return function () {
      isMounted = false
      // Only clean up if component is truly unmounting (not just re-rendering)
      // We don't clean up the persistent refs here to keep the connection alive
    }
  }, [session])

  // Separate cleanup effect for when component actually unmounts
  useEffect(function () {
    return function () {
      console.log('Component unmounting, cleaning up chat connections')
      // Unsubscribe from all subscriptions
      subscriptionsRef.current.forEach((sub) => {
        try {
          sub.unsubscribe()
        } catch (e) {
          console.error('Error unsubscribing:', e)
        }
      })
      subscriptionsRef.current = []

      // Only detach room, but keep the client alive for potential reuse
      if (currentRoomRef.current) {
        try {
          currentRoomRef.current.detach()
        } catch (e) {
          console.error('Error detaching room:', e)
        }
        currentRoomRef.current = null
      }

      messageIdsRef.current.clear()
      // Reset init flag so component can reinitialize when remounting
      isInitializedRef.current = false

      // Don't destroy the Ably client or chat client - keep them for reuse
      // They will be properly cleaned up when the app unmounts or user logs out
    }
  }, [])

  // Debug effect to track room state
  useEffect(() => {
    console.log('Room state changed:', { room: !!room, currentRef: !!currentRoomRef.current })
  }, [room])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col">
        <MessageList
          messages={messages}
          currentUserEmail={session?.user?.email || ''}
          onAddReaction={addReaction}
          typingUsers={Array.from(typingUsers)}
        />
        <MessageInput onSend={sendMessage} onTyping={handleTyping} />
      </div>
    </div>
  )
}
