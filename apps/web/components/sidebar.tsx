'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Users,
    PiggyBank,
    CreditCard,
    BarChart2,
    FileText,
    Settings,
    LogOut,
    ChevronRight,
} from 'lucide-react'
import { removeToken } from '@/lib/api'

const navItems = [
    { href: '/dashboard', label: 'Beranda', icon: Home },
    { href: '/nasabah', label: 'Anggota', icon: Users },
    { href: '/simpanan', label: 'Simpanan', icon: PiggyBank },
    { href: '/pinjaman', label: 'Pinjaman', icon: CreditCard },
    { href: '/analisis', label: 'Analisis Risiko', icon: BarChart2 },
    { href: '/laporan', label: 'Laporan', icon: FileText },
]

export default function Sidebar() {
    const pathname = usePathname() || '/'
    const router = useRouter()

    const handleLogout = () => {
        removeToken()
        router.push('/login')
    }

    return (
        <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col md:flex"
            style={{ backgroundColor: '#2e7d32' }}>

            {/* Logo / Title */}
            <div className="px-5 py-5 border-b border-green-700">
                <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-1">Sistem</p>
                <p className="text-white font-bold text-sm leading-tight">Koperasi Simpan Pinjam</p>
            </div>

            {/* Main Menu Label */}
            <div className="px-5 pt-5 pb-2">
                <p className="text-[10px] font-bold tracking-widest text-green-300 uppercase">Main Menu</p>
            </div>

            {/* Nav Items */}
            <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Navigasi utama">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${isActive
                                ? 'bg-white text-green-800 shadow-sm'
                                : 'text-green-100 hover:bg-green-700'
                                }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{label}</span>
                            {isActive && <ChevronRight className="h-3 w-3 text-green-500" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="border-t border-green-700 p-3 space-y-0.5">
                <Link
                    href="/pengaturan"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-green-700 transition-all"
                >
                    <Settings className="h-4 w-4" />
                    Setting
                </Link>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-green-700 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Keluar
                </button>
            </div>
        </aside>
    )
}