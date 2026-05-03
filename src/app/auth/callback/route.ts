import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(permintaan: Request) {
  const { searchParams, origin } = new URL(permintaan.url)
  const kodeAkses = searchParams.get('code')

  if (kodeAkses) {
    const simpananCookie = await cookies()
    const klienSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(nama: string) {
            return simpananCookie.get(nama)?.value
          },
          set(nama: string, nilai: string, opsi: CookieOptions) {
            simpananCookie.set({ name: nama, value: nilai, ...opsi })
          },
          remove(nama: string, opsi: CookieOptions) {
            simpananCookie.set({ name: nama, value: '', ...opsi })
          },
        },
      }
    )
    
    try {
      const { data: { session: sesi } } = await klienSupabase.auth.exchangeCodeForSession(kodeAkses)
      
      if (sesi) {
        const { data: profil } = await klienSupabase
          .from('profiles')
          .select('role')
          .eq('id', sesi.user.id)
          .maybeSingle()

        // Pengalihan berdasarkan role
        if (profil?.role === 'guru' || sesi.user.app_metadata.provider === 'google') {
          return NextResponse.redirect(`${origin}/guru/dashboard`)
        } 
        return NextResponse.redirect(`${origin}/santri/dashboard`)
      }
    } catch (err) {
      return NextResponse.redirect(`${origin}/login?pesan=error-sistem`)
    }
  }
  return NextResponse.redirect(`${origin}/login?pesan=akses-ditolak`)
}