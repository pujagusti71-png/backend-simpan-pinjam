import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import '@workspace/ui/src/styles/globals.css'
import AppShell from '@/components/app-shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['600', '700'],
})

export const metadata: Metadata = {
  title: 'Simpan Pinjam',
  description: 'Sistem manajemen Simpan Pinjam',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-[#f8f9fa] text-slate-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
