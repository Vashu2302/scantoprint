import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Admin & Dashboard Route Protection
  const protectedRoutes = ['/admin', '/dashboard'];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const token = request.cookies.get('stp_auth_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Subdomain Routing
  const currentHost = hostname.replace(`:${url.port}`, '');
  const isVercelDomain = currentHost.endsWith('.vercel.app');
  const isLocalhost = currentHost.includes('localhost');

  if (!isVercelDomain && !isLocalhost && !currentHost.startsWith('www.')) {
    const parts = currentHost.split('.');
    
    // Check if on shop subdomain (e.g. vashu-prints.scantoprint.in)
    if (parts.length > 2) {
      const subdomain = parts[0];

      // QR Scan karte hi bina kisi intermediate page ke direct /upload render hoga
      if (pathname === '/') {
        return NextResponse.rewrite(new URL(`/upload?shop_slug=${subdomain}`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};