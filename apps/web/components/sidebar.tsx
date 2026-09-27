'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    Home, Users, PiggyBank, CreditCard, BarChart2, FileText,
    LogOut, ChevronRight, ChevronDown, BookOpen, Database,
    Banknote, ArrowLeftRight, ClipboardList, ShieldCheck,
    TrendingUp, XCircle, PlusCircle,
} from 'lucide-react'
import { removeToken } from '@/lib/api'

const navConfig = [
    {
        group: 'MAIN MENU',
        items: [
            { href: '/dashboard', label: 'Beranda', icon: Home },
        ]
    },
    {
        group: 'MASTER DATA',
        items: [
            {
                href: '/nasabah', label: 'Data Anggota', icon: Users,
                children: [
                    { href: '/nasabah', label: 'Semua Anggota', icon: Users },
                    { href: '/nasabah/tidak-aktif', label: 'Tidak Aktif', icon: XCircle },
                ]
            },
            {
                href: '/simpanan', label: 'Data Tabungan', icon: PiggyBank,
                children: [
                    { href: '/simpanan', label: 'Ringkasan', icon: PiggyBank },
                    { href: '/simpanan/data', label: 'Data Simpanan', icon: Database },
                    { href: '/simpanan/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
                    { href: '/simpanan/buku-tabungan', label: 'Buku Tabungan', icon: BookOpen },
                    { href: '/simpanan/deposito', label: 'Deposito', icon: Banknote },
                ]
            },
            {
                href: '/pinjaman', label: 'Data Pinjaman', icon: CreditCard,
                children: [
                    { href: '/pinjaman', label: 'Semua Pinjaman', icon: CreditCard },
                    { href: '/pinjaman/pembayaran', label: 'Pembayaran', icon: Banknote },
                    { href: '/pinjaman/pre-loan-checking', label: 'Pre-Loan Check', icon: ShieldCheck },
                    { href: '/pinjaman/analisis-skor-risiko', label: 'Skor Risiko', icon: TrendingUp },
                ]
            },
        ]
    },
    {
        group: 'PENGAJUAN',
        items: [
            { href: '/simpanan/transaksi', label: 'Pengajuan Simpanan', icon: PlusCircle },
            { href: '/pinjaman?baru=1', label: 'Pengajuan Pinjaman', icon: PlusCircle },
        ]
    },
    {
        group: 'ANALISIS & LAPORAN',
        items: [
            { href: '/analisis', label: 'Analisis Risiko', icon: BarChart2 },
            {
                href: '/laporan', label: 'Data Laporan', icon: FileText,
                children: [
                    { href: '/laporan', label: 'Laporan Umum', icon: ClipboardList },
                    { href: '/laporan/ldr-likuiditas', label: 'LDR & Likuiditas', icon: TrendingUp },
                ]
            },
        ]
    },
]

export default function Sidebar() {
    const pathname = usePathname() || '/'
    const router = useRouter()

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {}
        navConfig.forEach(group => {
            group.items.forEach(item => {
                if ('children' in item && item.children) {
                    init[item.href] = pathname === item.href || pathname.startsWith(item.href + '/')
                }
            })
        })
        return init
    })

    const toggleMenu = (href: string) =>
        setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }))

    const handleLogout = () => {
        removeToken()
        router.push('/login')
    }

    return (
        <aside
            className="hidden min-h-screen w-[200px] shrink-0 flex-col md:flex overflow-y-auto"
            style={{ backgroundColor: '#2e7d32' }}
        >
            {/* Logo */}
            <div className="px-4 py-4 border-b border-green-700 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">💰</span>
                </div>
                <p className="text-white font-bold text-xs leading-tight tracking-wide uppercase">Apps</p>
                <p className="text-white font-bold text-sm leading-tight tracking-wide uppercase">Koperasi</p>
            </div>

            {/* Nav Groups */}
            <nav className="flex flex-1 flex-col pb-3" aria-label="Navigasi utama">
                {navConfig.map((group) => (
                    <div key={group.group}>
                        {/* Group Label */}
                        <div className="px-4 pt-4 pb-1">
                            <p className="text-[9px] font-bold tracking-widest text-green-300 uppercase">{group.group}</p>
                        </div>

                        <div className="flex flex-col gap-0.5 px-2">
                            {group.items.map((item) => {
                                const Icon = item.icon
                                const isParentActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                const hasChildren = 'children' in item && item.children && item.children.length > 0
                                const isOpen = openMenus[item.href] ?? false

                                if (!hasChildren) {
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${isParentActive
                                                ? 'bg-white text-green-800 shadow-sm font-semibold'
                                                : 'text-green-100 hover:bg-green-700'
                                                }`}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
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
                                            className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${isParentActive
                                                ? 'bg-green-700 text-white'
                                                : 'text-green-100 hover:bg-green-700'
                                                }`}
                                        >
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {isOpen
                                                ? <ChevronDown className="h-3 w-3 text-green-300" />
                                                : <ChevronRight className="h-3 w-3 text-green-300" />}
                                        </button>

                                        {isOpen && 'children' in item && item.children && (
                                            <div className="mt-0.5 ml-2 flex flex-col gap-0.5 border-l border-green-600 pl-3">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon
                                                    const isChildActive = pathname === child.href
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${isChildActive
                                                                ? 'bg-white text-green-800 shadow-sm'
                                                                : 'text-green-200 hover:bg-green-700 hover:text-white'
                                                                }`}
                                                        >
                                                            <ChildIcon className="h-3 w-3 shrink-0" />
                                                            {child.label}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className="border-t border-green-700 p-2">
                <button
                    id="sidebar-logout-btn"
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-green-100 hover:bg-green-700 transition-all cursor-pointer"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                </button>
            </div>
        </aside>
    )
}