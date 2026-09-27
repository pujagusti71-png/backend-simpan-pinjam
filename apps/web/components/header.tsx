'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { getToken, removeToken } from '@/lib/api'
import { APP_USER, getUserInitials } from '@/lib/user'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Beranda',
    '/nasabah': 'Data Anggota',
    '/nasabah/tidak-aktif': 'Anggota Tidak Aktif',
    '/simpanan': 'Simpanan',
    '/simpanan/data': 'Data Simpanan',
    '/simpanan/transaksi': 'Transaksi Simpanan',
    '/simpanan/buku-tabungan': 'Buku Tabungan',
    '/simpanan/deposito': 'Deposito',
    '/pinjaman': 'Data Pinjaman',
    '/pinjaman/pembayaran': 'Pembayaran Pinjaman',
    '/pinjaman/pre-loan-checking': 'Pre-Loan Checking',
    '/pinjaman/analisis-skor-risiko': 'Analisis Skor Risiko',
    '/analisis': 'Analisis Risiko',
    '/laporan': 'Laporan Umum',
    '/laporan/ldr-likuiditas': 'LDR & Likuiditas',
    '/pengajuan-simpanan': 'Pengajuan Simpanan',
    '/pengajuan-pinjaman': 'Pengajuan Pinjaman',
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
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6" style={{ minHeight: '52px' }}>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-base">🏠</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-700">{pageTitle}</span>
                </div>

                {/* Right: user menu */}
                <div className="relative flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                        {APP_USER.name.toUpperCase()}
                    </span>

                    <div className="relative">
                        <button
                            id="header-user-btn"
                            type="button"
                            onClick={() => setIsUserOpen((open) => !open)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm shadow-md transition hover:opacity-90"
                            style={{ backgroundColor: '#2e7d32' }}
                            aria-label="Menu Akun"
                        >
                            {getUserInitials(APP_USER.name)}
                        </button>

                        {isUserOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                <div className="border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-bold text-slate-900">{APP_USER.name}</p>
                                    <p className="text-xs text-slate-500">{APP_USER.role}</p>
                                </div>
                                <button
                                    id="header-profile-btn"
                                    type="button"
                                    onClick={() => { setIsUserOpen(false); alert('Fitur profil segera tersedia') }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <User className="h-4 w-4 text-slate-400" />
                                    Profil Saya
                                </button>
                                <button
                                    id="header-settings-btn"
                                    type="button"
                                    onClick={() => { setIsUserOpen(false); alert('Fitur pengaturan segera tersedia') }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    Pengaturan
                                </button>
                                <div className="border-t border-slate-100" />
                                <button
                                    id="header-logout-btn"
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
