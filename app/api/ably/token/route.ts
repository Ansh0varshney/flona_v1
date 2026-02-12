import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Ably from 'ably'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    console.log('Token ably endpoint called')
    const session = await getServerSession(authOptions)
    
    console.log('Session:', session ? `Found for ${session.user?.email}` : 'None')
    if (!session || !session.user) {
      console.warn('Token request without session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ABLY_API_KEY) {
      console.error('ABLY_API_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const apiKey = process.env.ABLY_API_KEY

    console.log('Creating Ably client...')
    const client = new Ably.Rest({ key: apiKey })
    
    console.log('Creating token request for:', session.user.email)
    const tokenRequest = await client.auth.createTokenRequest({
      clientId: session.user.email!,
    })

    console.log('Token request created successfully')
    const response = NextResponse.json(tokenRequest)
    // Add CORS headers to ensure the token endpoint works properly
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (error) {
    console.error('Token endpoint error:', error instanceof Error ? error.message : error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create token request' },
      { status: 500 }
    )
  }
}
