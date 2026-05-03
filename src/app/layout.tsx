// src/app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
// Impor Bootstrap Icons agar semua ikon "bi bi-..." muncul
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

// Menggunakan Plus Jakarta Sans agar tampilan UI lebih modern mirip desain yang Anda tunjukkan
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'] 
});

export const metadata = {
  title: 'E-Raport - Sistem Penilaian Digital',
  description: 'Aplikasi pengelolaan nilai santri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={jakarta.className}>
        {children}
        
        {/* Opsional: Jika Anda butuh fitur interaktif Bootstrap seperti Modal atau Dropdown */}
        {/* <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script> */}
      </body>
    </html>
  );
}