'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { getToken, removeToken } from '@/lib/api'
import { APP_USER, getUserInitials } from '@/lib/user'

// Breadcrumb map
const pageTitles: Record<string, string> = {
    '/dashboard': 'Beranda',
    '/nasabah': 'Anggota',
    '/simpanan': 'Simpanan',
    '/pinjaman': 'Pinjaman',
    '/analisis': 'Analisis Risiko',
    '/laporan': 'Laporan',
}

export default function Header() {
    const router = useRouter()
    const pathname = usePathname() || '/dashboard'
    const [isUserOpen, setIsUserOpen] = useState(false)
    const token = getToken()

    const pageTitle = pageTitles[pathname] || 'Beranda'

    const handleLogout = () => {
        removeToken()
        setIsUserOpen(false)
        router.push('/login')
    }

    return (
        <header className="sticky top-0 z-30 shadow-sm" style={{ backgroundColor: '#2e7d32' }}>
            <div className="flex items-center justify-between px-6 py-0" style={{ minHeight: '52px' }}>
                {/* App name */}
                <div className="flex items-center gap-0">
                    <span className="text-white font-bold text-base tracking-wide uppercase">KOPERASI</span>
                </div>

                {/* Right: user menu */}
                <div className="relative flex items-center gap-3">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsUserOpen((open) => !open)}
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-green-700 transition-all"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-800 text-xs font-bold">
                                {getUserInitials(APP_USER.name)}
                            </div>
                            <span className="font-medium hidden sm:block">{APP_USER.name}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-green-200" />
                        </button>

                        {isUserOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                <div className="border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">{APP_USER.name}</p>
                                    <p className="text-xs text-slate-500">{APP_USER.role}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsUserOpen(false); alert('Fitur profil segera tersedia') }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <User className="h-4 w-4" />
                                    Profil
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 transition hover:bg-slate-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Page title bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2">
                <span className="text-slate-400 text-xs">🏠</span>
                <span className="text-xs text-slate-500">{pageTitle}</span>
            </div>
        </header>
    )
}
