import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: {
        created_at: 'asc',
      },
      take: 100, // Load last 100 messages
      include: {
        user: {
          select: {
            flona_name: true,
          },
        },
      },
    })

    // Transform to match frontend format
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      userName: msg.user.flona_name || msg.user_name,
      userEmail: msg.user_email,
      timestamp: msg.created_at.getTime(),
      reactions: {},
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {

    try {
    
    const session = await getServerSession(authOptions)
    console.log('POST /api/messages called')
    console.log(session)

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const text = String(body.text || '').trim()

    if (!text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    // Fetch user's flona_name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { flona_name: true },
    })

    const flonaName = user?.flona_name || session.user.name || 'Anonymous'

    const message = await prisma.chatMessage.create({
      data: {
        user_id: session.user.id,
        user_name: flonaName,
        user_email: session.user.email,
        text,
      },
    })

    return NextResponse.json({
      id: message.id,
      text: message.text,
      userName: message.user_name,
      userEmail: message.user_email,
      timestamp: message.created_at.getTime(),
      reactions: {},
    })
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
}
