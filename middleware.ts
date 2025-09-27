import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/profile', '/checkout', '/orders'];
const adminRoutes = ['/dashboard'];
const orderAdminRoutes = ['/dashboard/orders'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Redirect to login if trying to access protected route without authentication
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is trying to access admin routes
  if (token) {
    const userData = token.user as { role?: string; isAdmin?: boolean } | undefined;
    const isAdmin = userData?.isAdmin || false;
    const isOrderAdmin = userData?.role === 'orderAdmin';

    // Block access to admin routes for non-admin users
    if (adminRoutes.some(route => pathname.startsWith(route)) && !isAdmin && !isOrderAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For order admin, only allow access to order management
    if (isOrderAdmin && !orderAdminRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard?tab=orders', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*', 
    '/checkout/:path*', 
    '/orders/:path*',
    '/dashboard/:path*',
  ],
};
