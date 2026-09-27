'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, LogOut, Settings, X, Check, Lock, Mail, Phone, Building, Menu } from 'lucide-react'
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

export default function Header({ onToggleMobile }: { onToggleMobile?: () => void }) {
    const router = useRouter()
    const pathname = usePathname() || '/dashboard'
    const [isUserOpen, setIsUserOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Profile state
    const [userName, setUserName] = useState(APP_USER.name)
    const [userEmail, setUserEmail] = useState('admin@simpanpinjam.com')
    const [userPhone, setUserPhone] = useState('0812-3456-7890')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [profileSuccess, setProfileSuccess] = useState(false)

    // Settings state
    const [koperasiName, setKoperasiName] = useState('Koperasi Simpan Pinjam Seje')
    const [koperasiAddress, setKoperasiAddress] = useState('Jl. Raya Koperasi No. 12, Kab. Seje')
    const [defaultRate, setDefaultRate] = useState('1.2')
    const [maxTenor, setMaxTenor] = useState('24')
    const [settingsSuccess, setSettingsSuccess] = useState(false)

    const pageTitle = pageTitles[pathname] || 'Beranda'

    const handleLogout = () => {
        removeToken()
        setIsUserOpen(false)
        router.push('/login')
    }

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault()
        APP_USER.name = userName
        setProfileSuccess(true)
        setTimeout(() => {
            setProfileSuccess(false)
            setIsProfileOpen(false)
        }, 1200)
    }

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault()
        setSettingsSuccess(true)
        setTimeout(() => {
            setSettingsSuccess(false)
            setIsSettingsOpen(false)
        }, 1200)
    }

    return (
        <>
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 sm:px-6" style={{ minHeight: '52px' }}>
                    {/* Left: Hamburger menu on mobile + Breadcrumb */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onToggleMobile}
                            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            aria-label="Buka Menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                            <span className="text-sm sm:text-base">🏠</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-medium text-slate-700 truncate max-w-[130px] sm:max-w-none">{pageTitle}</span>
                        </div>
                    </div>

                    {/* Right: user menu */}
                    <div className="relative flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                            {userName.toUpperCase()}
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
                                {getUserInitials(userName)}
                            </button>

                            {isUserOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-sm font-bold text-slate-900">{userName}</p>
                                        <p className="text-xs text-slate-500">{APP_USER.role}</p>
                                    </div>
                                    <button
                                        id="header-profile-btn"
                                        type="button"
                                        onClick={() => {
                                            setIsUserOpen(false)
                                            setIsProfileOpen(true)
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <User className="h-4 w-4 text-slate-400" />
                                        Profil Saya
                                    </button>
                                    <button
                                        id="header-settings-btn"
                                        type="button"
                                        onClick={() => {
                                            setIsUserOpen(false)
                                            setIsSettingsOpen(true)
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Settings className="h-4 w-4 text-slate-400" />
                                        Pengaturan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal Profil Saya */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-green-700" />
                                <h3 className="text-base font-bold text-slate-800">Profil Saya</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsProfileOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {profileSuccess && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-700">
                                <Check className="h-4 w-4" />
                                Profil berhasil diperbarui!
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-lg font-bold text-white">
                                    {getUserInitials(userName)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{userName}</p>
                                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                                        {APP_USER.role}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Nomor Telepon
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={userPhone}
                                        onChange={(e) => setUserPhone(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Ubah Password (Opsional)
                                </label>
                                <div className="relative mb-2">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        placeholder="Password Baru"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        placeholder="Konfirmasi Password Baru"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-green-800"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Pengaturan */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-700" />
                                <h3 className="text-base font-bold text-slate-800">Pengaturan Sistem</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {settingsSuccess && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-700">
                                <Check className="h-4 w-4" />
                                Pengaturan berhasil disimpan!
                            </div>
                        )}

                        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Nama Koperasi
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={koperasiName}
                                        onChange={(e) => setKoperasiName(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Alamat Kantor
                                </label>
                                <input
                                    type="text"
                                    value={koperasiAddress}
                                    onChange={(e) => setKoperasiAddress(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Bunga Default (%/thn)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={defaultRate}
                                        onChange={(e) => setDefaultRate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Tenor Maksimal (Bulan)
                                    </label>
                                    <input
                                        type="number"
                                        value={maxTenor}
                                        onChange={(e) => setMaxTenor(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-green-800"
                                >
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
