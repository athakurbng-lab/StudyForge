import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthToken } from '@/app/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');

  if (isAuthPage) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyAuthToken(token)
  if (!payload) {
    // Invalid token, delete cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }

  // TODO: Implement lazy streak check here (if lastStudiedAt < yesterday midnight)
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/groups/:path*', '/sessions/:path*'],
}
