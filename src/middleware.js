import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('samwad_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/subscription-expired'];

  // Check if the current path is public
  const isPublicPath = publicPaths.includes(pathname);

  console.log('Middleware - Path:', pathname, 'Token exists:', !!token, 'Is Public:', isPublicPath);

  // Handle public paths
  if (isPublicPath) {
    // If user has token and tries to access login, redirect to home
    if (pathname === '/login' && token) {
      console.log('Authenticated user accessing login - redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Allow access to subscription-expired regardless of token
    if (pathname === '/subscription-expired') {
      return NextResponse.next();
    }
    
    // Allow access to other public paths
    return NextResponse.next();
  }

  // For protected paths, check authentication
  if (!token) {
    console.log('No token found - redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow access to protected paths with valid token
  return NextResponse.next();
}

export const config = {
  // More specific matcher to avoid unnecessary middleware calls
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};