import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ambil data user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. REDIRECT LANDING PAGE KE LOGIN
  // Jika user buka "/" langsung lempar ke "/login"
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. PROTEKSI RUTE (GURU & SANTRI)
  const isProtectedRoute = 
    pathname.startsWith('/guru') || 
    pathname.startsWith('/santri');

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 3. (Opsional) REDIRECT JIKA SUDAH LOGIN
  // Jika user sudah login dan mencoba akses /login, arahkan ke dashboard guru
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/guru', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali file statis dan favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};