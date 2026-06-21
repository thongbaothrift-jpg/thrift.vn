import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token and role from cookies
  const token = request.cookies.get('thrifted_auth_token')?.value;
  const role = request.cookies.get('thrifted_auth_role')?.value;

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // If no token or role is not ADMIN, redirect to home
    if (!token || role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect logged in users from auth pages (Optional)
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    if (token) {
      const url = request.nextUrl.clone();
      // If admin, go to dashboard, else go home
      url.pathname = role === 'ADMIN' ? '/admin' : '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
  ],
};
