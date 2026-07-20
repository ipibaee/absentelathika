import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Protect all routes except auth API endpoints, next static files, images, etc.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
