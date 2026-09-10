import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Sabhi routes (admin, dashboard, register, shop) ko bina kisi block/redirect ke chalne dein
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, images, and favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};