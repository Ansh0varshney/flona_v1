import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventIdParam = searchParams.get('event_id')
  const eventId = Number(eventIdParam)

  if (!eventIdParam || Number.isNaN(eventId)) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
  }

  const comments = await prisma.comment.findMany({
    where: { event_id: eventId },
    orderBy: { created_at: 'asc' },
    include: {
      user: {
        select: {
          flona_name: true,
          image: true,
        },
      },
    },
  })

  // Transform to use flonaName
  const formattedComments = comments.map(comment => ({
    ...comment,
    user: {
      name: comment.user.flona_name,
      image: comment.user.image,
    },
  }))

  return NextResponse.json(formattedComments)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const eventId = Number(body.eventId)
    const content = String(body.content || '').trim()

    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        event_id: eventId,
        user_id: user.id,
        content,
      },
      include: {
        user: {
          select: {
            flona_name: true,
            image: true,
          },
        },
      },
    })

    // Transform to use flonaName as name
    const formattedComment = {
      ...comment,
      user: {
        name: comment.user.flona_name,
        image: comment.user.image,
      },
    }

    return NextResponse.json(formattedComment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
