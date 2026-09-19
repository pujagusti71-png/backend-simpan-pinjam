'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Calendar, ChevronDown, User, LogIn, LogOut, Settings } from 'lucide-react'
import { getToken, removeToken } from '@/lib/api'
import { APP_USER, getUserInitials } from '@/lib/user'

export default function Header() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState('01 Mei 2025 - 31 Mei 2025')
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const token = getToken()
  const handleLogout = () => {
    removeToken()
    setIsUserOpen(false)
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Simpan Pinjam</p>
            <p className="text-xs text-slate-500">{APP_USER.role}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {isDateOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {['Bulan Ini', 'Bulan Lalu', '3 Bulan Terakhir', 'Custom'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setDateRange(option)
                      setIsDateOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="max-w-[140px] truncate text-xs font-semibold text-slate-800 sm:max-w-none sm:text-sm">{APP_USER.name}</span>
              <button
                type="button"
                onClick={() => setIsUserOpen((open) => !open)}
                aria-label="Buka menu akun"
                title="Menu akun"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-slate-600 shadow-sm text-xs font-bold"
              >
                {getUserInitials(APP_USER.name)}
              </button>
            </div>
            {isUserOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {!token ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserOpen(false)
                      router.push('/login')
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <LogIn className="h-4 w-4" />
                    Masuk
                  </button>
                ) : (
                  <>
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{APP_USER.name}</p>
                      <p className="text-xs text-slate-500">{APP_USER.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserOpen(false)
                        alert('Fitur profil segera tersedia')
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserOpen(false)
                        alert('Fitur pengaturan segera tersedia')
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Pengaturan
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
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
