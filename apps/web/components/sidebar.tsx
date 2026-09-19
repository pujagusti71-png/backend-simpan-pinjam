'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_USER, getUserInitials } from '@/lib/user'

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/simpanan', label: 'Simpanan' },
    { href: '/pinjaman', label: 'Pinjaman' },
    { href: '/laporan', label: 'Laporan' },
]

export default function Sidebar() {
    const pathname = usePathname() || '/'

    return (
        <aside className="hidden min-h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white p-6 md:flex">
            <div className="mb-10 flex items-center gap-2.5 font-bold text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">SP</div>
                <span>Simpan Pinjam</span>
            </div>

            <nav className="flex flex-1 flex-col gap-2" aria-label="Navigasi utama">
                {navItems.map(({ href, label }) => {
                    const isActive = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                ? 'bg-teal-50 text-teal-700'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            {label}
                        </Link>
                    )
                })}
            </nav>

            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {getUserInitials(APP_USER.name)}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{APP_USER.name}</p>
                    <p className="text-xs text-slate-500">{APP_USER.role}</p>
                </div>
            </div>
        </aside>
    )
}