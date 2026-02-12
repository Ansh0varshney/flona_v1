import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './db'

// Function to generate anonymous name from email
function generateFlonaName(email: string): string {
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

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      flonaName?: string | null
    }
  }

  interface User {
    id?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    flonaName?: string
  }
}

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'gmail.com'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Force account selection screen to allow users to choose different email
          prompt: 'select_account',
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user }) {
      const email = user.email
      console.log('signIn callback - Attempting sign in with email:', email)
      console.log('signIn callback - Allowed domain:', ALLOWED_DOMAIN)
      
      if (!email) {
        console.log('signIn callback - DENIED: No email provided')
        return false
      }
      
      const emailLower = email.toLowerCase()
      const domainCheck = emailLower.endsWith(`@${ALLOWED_DOMAIN}`)
      console.log('signIn callback - Email (lowercase):', emailLower)
      console.log('signIn callback - Domain check result:', domainCheck)
      
      if (!domainCheck) {
        console.log('signIn callback - DENIED: Email does not end with allowed domain')
        return false
      }
      
      console.log('signIn callback - APPROVED: User email:', email)

      // Create user in DB if first login
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name,
          image: user.image,
        },
        create: {
          email,
          name: user.name,
          image: user.image,
          flona_name: generateFlonaName(email),
        },
      })
      
      // Generate flona_name if it doesn't exist for existing users
      if (!dbUser.flona_name) {
        await prisma.user.update({
          where: { email },
          data: { flona_name: generateFlonaName(email) },
        })
      }
      
      console.log('signIn callback - DB user created/updated:', dbUser.id)
      
      return true
    },

    async jwt({ token, user: jwtUser, account, trigger }) {
      // When user first signs in (has account) or if flonaName is missing, fetch user data
      if ((account && jwtUser?.email) || (token.email && !token.flonaName)) {
        try {
          const email = jwtUser?.email || (token.email as string)
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, flona_name: true },
          })
          if (dbUser) {
            token.userId = dbUser.id
            token.flonaName = dbUser.flona_name ?? undefined
            console.log('jwt callback - Added user ID and flona_name to token:', dbUser.id, dbUser.flona_name)
          }
        } catch (error) {
          console.error('jwt callback - Error fetching user:', error)
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) || ''
        session.user.flonaName = (token.flonaName as string) || null
        console.log('session callback - User ID in session:', session.user.id, 'Flona name:', session.user.flonaName)
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
