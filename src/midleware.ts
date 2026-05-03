import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(permintaan: NextRequest) {
  let responsHalaman = NextResponse.next({
    request: { headers: permintaan.headers },
  })

  const klienSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(nama: string) {
          return permintaan.cookies.get(nama)?.value
        },
        set(nama: string, nilai: string, opsi: CookieOptions) {
          permintaan.cookies.set({ name: nama, value: nilai, ...opsi })
          responsHalaman = NextResponse.next({ request: { headers: permintaan.headers } })
          responsHalaman.cookies.set({ name: nama, value: nilai, ...opsi })
        },
        remove(nama: string, opsi: CookieOptions) {
          permintaan.cookies.set({ name: nama, value: '', ...opsi })
          responsHalaman = NextResponse.next({ request: { headers: permintaan.headers } })
          responsHalaman.cookies.set({ name: nama, value: '', ...opsi })
        },
      },
    }
  )

  const { data: { session: sesiAktif } } = await klienSupabase.auth.getSession()

  // Jika tidak ada sesi dan mencoba akses dashboard, tendang ke login
  if (!sesiAktif && (permintaan.nextUrl.pathname.startsWith('/guru') || permintaan.nextUrl.pathname.startsWith('/santri'))) {
    return NextResponse.redirect(new URL('/login', permintaan.url))
  }

  return responsHalaman
}

export const config = {
  matcher: ['/guru/:path*', '/santri/:path*'],
}