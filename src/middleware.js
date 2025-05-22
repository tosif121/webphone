import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('samwad_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/404', '/subscription-expired'];

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    // Redirect authenticated users away from the login page
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to the login page
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
