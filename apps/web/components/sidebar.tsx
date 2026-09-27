'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    Home,
    Users,
    PiggyBank,
    CreditCard,
    BarChart2,
    FileText,
    LogOut,
    ChevronRight,
    ChevronDown,
    BookOpen,
    Database,
    Banknote,
    ArrowLeftRight,
    ClipboardList,
    ShieldCheck,
    TrendingUp,
    XCircle,
} from 'lucide-react'
import { removeToken } from '@/lib/api'

type NavItem = {
    href: string
    label: string
    icon: React.ElementType
    children?: { href: string; label: string; icon: React.ElementType }[]
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Beranda', icon: Home },
    {
        href: '/nasabah', label: 'Anggota', icon: Users,
        children: [
            { href: '/nasabah', label: 'Data Anggota', icon: Users },
            { href: '/nasabah/tidak-aktif', label: 'Tidak Aktif', icon: XCircle },
        ]
    },
    {
        href: '/simpanan', label: 'Simpanan', icon: PiggyBank,
        children: [
            { href: '/simpanan', label: 'Ringkasan', icon: PiggyBank },
            { href: '/simpanan/data', label: 'Data Simpanan', icon: Database },
            { href: '/simpanan/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
            { href: '/simpanan/buku-tabungan', label: 'Buku Tabungan', icon: BookOpen },
            { href: '/simpanan/deposito', label: 'Deposito', icon: Banknote },
        ]
    },
    {
        href: '/pinjaman', label: 'Pinjaman', icon: CreditCard,
        children: [
            { href: '/pinjaman', label: 'Data Pinjaman', icon: CreditCard },
            { href: '/pinjaman/pembayaran', label: 'Pembayaran', icon: Banknote },
            { href: '/pinjaman/pre-loan-checking', label: 'Pre-Loan Check', icon: ShieldCheck },
            { href: '/pinjaman/analisis-skor-risiko', label: 'Skor Risiko', icon: TrendingUp },
        ]
    },
    { href: '/analisis', label: 'Analisis Risiko', icon: BarChart2 },
    {
        href: '/laporan', label: 'Laporan', icon: FileText,
        children: [
            { href: '/laporan', label: 'Laporan Umum', icon: ClipboardList },
            { href: '/laporan/ldr-likuiditas', label: 'LDR & Likuiditas', icon: TrendingUp },
        ]
    },
]

export default function Sidebar() {
    const pathname = usePathname() || '/'
    const router = useRouter()

    // Track which parent menus are open
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        navItems.forEach(item => {
            if (item.children) {
                const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/')
                initial[item.href] = isParentActive
            }
        })
        return initial
    })

    const toggleMenu = (href: string) => {
        setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }))
    }

    const handleLogout = () => {
        removeToken()
        router.push('/login')
    }

    return (
        <aside
            className="hidden min-h-screen w-[220px] shrink-0 flex-col md:flex overflow-y-auto"
            style={{ backgroundColor: '#2e7d32' }}
        >
            {/* Logo */}
            <div className="px-5 py-4 border-b border-green-700">
                <p className="text-[10px] font-semibold text-green-300 uppercase tracking-widest mb-0.5">Sistem</p>
                <p className="text-white font-bold text-sm leading-tight">Koperasi Simpan Pinjam</p>
            </div>

            {/* Main Menu Label */}
            <div className="px-5 pt-4 pb-1">
                <p className="text-[10px] font-bold tracking-widest text-green-300 uppercase">Main Menu</p>
            </div>

            {/* Nav */}
            <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-3" aria-label="Navigasi utama">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const isOpen = openMenus[item.href] ?? false

                    if (!item.children) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${isParentActive
                                    ? 'bg-white text-green-800 shadow-sm'
                                    : 'text-green-100 hover:bg-green-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="flex-1">{item.label}</span>
                                {isParentActive && <ChevronRight className="h-3 w-3 text-green-500" />}
                            </Link>
                        )
                    }

                    return (
                        <div key={item.href}>
                            <button
                                type="button"
                                onClick={() => toggleMenu(item.href)}
                                className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${isParentActive
                                    ? 'bg-green-700 text-white'
                                    : 'text-green-100 hover:bg-green-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {isOpen
                                    ? <ChevronDown className="h-3.5 w-3.5 text-green-300" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-green-300" />
                                }
                            </button>

                            {isOpen && (
                                <div className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-green-600 pl-3">
                                    {item.children.map((child) => {
                                        const ChildIcon = child.icon
                                        const isChildActive = pathname === child.href
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-all ${isChildActive
                                                    ? 'bg-white text-green-800 shadow-sm'
                                                    : 'text-green-200 hover:bg-green-700 hover:text-white'
                                                    }`}
                                            >
                                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                                {child.label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-green-700 p-3">
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