// app/auth/callback/route.ts
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
      // Tukar kode menjadi sesi
      const { data: { session: sesi }, error: authError } = await klienSupabase.auth.exchangeCodeForSession(kodeAkses)
      
      if (authError) throw authError

      if (sesi) {
        // Ambil data role dari tabel profiles berdasarkan ID user yang login
        const { data: profil, error: dbError } = await klienSupabase
          .from('profiles')
          .select('role')
          .eq('id', sesi.user.id)
          .single()

        // Jika ada error di database atau profil tidak ditemukan
        if (dbError || !profil) {
          await klienSupabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?pesan=profil-tidak-ditemukan`)
        }

        // Logika Pengalihan berdasarkan role
        // Hanya yang memiliki nilai 'guru' di kolom role yang bisa masuk ke dashboard guru
        if (profil.role === 'guru') {
          return NextResponse.redirect(`${origin}/guru/dashboard`)
        } 
        
        // Jika rolenya adalah santri
        if (profil.role === 'santri') {
          return NextResponse.redirect(`${origin}/santri/dashboard`)
        }

        // Jika user berhasil login lewat Google tapi role-nya belum diset di DB
        await klienSupabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?pesan=role-tidak-valid`)
      }
    } catch (err) {
      console.error("Auth Callback Error:", err)
      return NextResponse.redirect(`${origin}/login?pesan=error-sistem`)
    }
  }

  // Jika tidak ada kode akses
  return NextResponse.redirect(`${origin}/login?pesan=akses-ditolak`)
}