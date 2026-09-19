'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Banknote, PiggyBank, FileBarChart } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pinjaman', label: 'Pinjaman', icon: Banknote },
  { href: '/simpanan', label: 'Simpanan', icon: PiggyBank },
  { href: '/laporan', label: 'Laporan', icon: FileBarChart },
]

export default function BottomNav() {
  const pathname = usePathname() || '/'

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-center gap-x-12 px-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-full px-4 py-1 transition ${isActive
                  ? 'border border-teal-100 bg-teal-50/50 text-teal-600'
                  : 'text-slate-400 hover:text-teal-600'
                }`}
            >
              <Icon className="h-5 w-5" />
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </footer>
  )
}
