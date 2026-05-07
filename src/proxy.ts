import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // --- 1. LOGGING UNTUK DEBUGGING ---
  console.log("--- Mengakses Path:", pathname);

  // --- 2. FORCE REDIRECT ROOT KE LOGIN ---
  // Kita taruh di paling atas agar tidak perlu cek session dulu
  if (pathname === '/') {
    console.log("-> Action: Redirect ROOT ke /login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Persiapkan response dasar
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // --- 3. INISIALISASI SUPABASE CLIENT ---
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

  // Ambil data user session aktif
  const { data: { user } } = await supabase.auth.getUser();

  // --- 4. LOGIKA PROTEKSI RUTE ---
  const isProtectedRoute = pathname.startsWith('/guru') || pathname.startsWith('/santri');
  const isAuthRoute = pathname === '/login';

  // Jika BELUM login & mencoba mengakses rute terproteksi
  if (!user && isProtectedRoute) {
    console.log("-> Action: User tidak dikenal, lempar ke /login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika SUDAH login & mencoba mengakses halaman /login
  if (user && isAuthRoute) {
    console.log("-> Action: User sudah login, pindahkan ke /guru");
    return NextResponse.redirect(new URL('/guru', request.url));
  }

  return response;
}

// --- 5. KONFIGURASI MATCHER ---
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - File gambar (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};