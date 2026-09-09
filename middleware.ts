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

  // 2. Subdomain Extraction (e.g. balod.scantoprint.in -> balod)
  const currentHost = hostname.replace(`:${url.port}`, '');
  const isLocalhost = currentHost.includes('localhost');
  const baseDomain = isLocalhost ? 'localhost' : 'scantoprint.in';

  if (currentHost !== baseDomain && !currentHost.startsWith('www.')) {
    const subdomain = currentHost.replace(`.${baseDomain}`, '');
    // Rewrite balod.scantoprint.in to /shop/balod
    if (subdomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      return NextResponse.rewrite(new URL(`/shop/${subdomain}${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};