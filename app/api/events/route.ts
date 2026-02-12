import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isWithinCampus } from '@/lib/events'

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Flona/1.0',
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Reverse geocoding failed')
  }

  const data = (await response.json()) as { display_name?: string }
  return data.display_name || 'IIT Kharagpur Campus'
}

export async function GET() {
  const now = new Date()
  const events = await prisma.event.findMany({
    where: {
      end_time: {
        gt: now,
      },
    },
    include: {
      creator: {
        select: {
          flona_name: true,
        },
      },
    },
    orderBy: {
      start_time: 'asc',
    },
  })

  // Transform to camelCase for frontend and use flona_name
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    lat: event.lat,
    lng: event.lng,
    locationName: event.location_name,
    startTime: event.start_time,
    endTime: event.end_time,
    createdBy: event.created_by,
    createdAt: event.created_at,
    creator: {
      name: event.creator.flona_name,
    },
  }))

  return NextResponse.json(formattedEvents)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    if (!isWithinCampus(lat, lng)) {
      return NextResponse.json({ error: 'Coordinates out of campus bounds' }, { status: 400 })
    }

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    let locationName = 'IIT Kharagpur Campus'
    try {
      locationName = await reverseGeocode(lat, lng)
    } catch (error) {
      console.warn('Reverse geocoding failed, using fallback')
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        lat,
        lng,
        location_name: locationName,
        start_time: startTime,
        end_time: endTime,
        created_by: user.id,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
