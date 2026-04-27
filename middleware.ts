import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We can't use Firebase Admin SDK easily in Middleware (Edge Runtime)
// without complex setup. A better way for Next.js Middleware with Firebase
// is often to use session cookies, but for this project we'll implement
// a client-side protection primarily and use middleware for basic routing logic.
// However, I will try to implement a robust check if possible or 
// focus on the AuthContext and ProtectedRoute components for the logic.

// For now, let's just do basic redirects. The real role check will happen
// on the client side in the ProtectedRoute component since we are using
// Firebase Client SDK.

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Let's assume we store a basic auth flag in cookies for middleware
    const isAuthenticated = request.cookies.get('auth-session');

    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*', '/test/:path*', '/result/:path*'],
};
