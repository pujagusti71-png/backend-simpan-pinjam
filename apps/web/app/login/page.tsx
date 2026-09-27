'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { api, setToken } from '@/lib/api'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const passwordRef = useRef<HTMLInputElement>(null)

    const handleLogin = async () => {
        if (!username.trim()) {
            setError('Silakan masukkan username terlebih dahulu')
            return
        }
        if (!password) {
            setError('Silakan masukkan password')
            passwordRef.current?.focus()
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res: any = await api.login(username, password)
            const token = res?.token || res?.access_token
            if (!token) throw new Error('Token tidak ditemukan di response')
            setToken(token)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err?.message || 'Login gagal, coba lagi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="flex min-h-screen items-center justify-center px-4 py-8"
            style={{
                background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #43a047 80%, #66bb6a 100%)',
            }}
        >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-20" style={{ backgroundColor: '#81c784' }} />
                <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full opacity-15" style={{ backgroundColor: '#a5d6a7' }} />
                <div className="absolute top-1/3 right-10 h-40 w-40 rounded-full opacity-10" style={{ backgroundColor: '#c8e6c9' }} />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo / Icon */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <span className="text-3xl">💰</span>
                    </div>
                    <h1 className="text-center text-xl font-bold text-white drop-shadow">
                        Aplikasi Simpan Pinjam Koperasi
                    </h1>
                </div>

                {/* Card */}
                <div className="rounded-2xl bg-white px-8 py-7 shadow-xl">
                    <h2 className="mb-5 text-center text-base font-semibold text-slate-700">
                        Login Admin / Ketua
                    </h2>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void handleLogin()
                        }}
                    >
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="login-username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        passwordRef.current?.focus()
                                    }
                                }}
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="login-password"
                                ref={passwordRef}
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                            />
                        </div>

                        {error ? (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                        ) : null}

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition-all disabled:opacity-75"
                            style={{ backgroundColor: '#2e7d32' }}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>🔑</span>}
                            {loading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
