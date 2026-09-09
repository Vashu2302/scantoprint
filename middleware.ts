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

  // 2. Subdomain Routing (Only for custom domains, ignoring vercel.app & localhost)
  const currentHost = hostname.replace(`:${url.port}`, '');
  
  const isVercelDomain = currentHost.endsWith('.vercel.app');
  const isLocalhost = currentHost.includes('localhost');

  if (!isVercelDomain && !isLocalhost && !currentHost.startsWith('www.')) {
    const parts = currentHost.split('.');
    // If shop subdomain like balod.scantoprint.in (parts length >= 3)
    if (parts.length > 2) {
      const subdomain = parts[0];
      if (subdomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/shop')) {
        return NextResponse.rewrite(new URL(`/shop/${subdomain}${pathname}`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};