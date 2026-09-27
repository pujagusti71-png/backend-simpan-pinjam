'use client'

import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useState } from 'react'

type DashboardMetrics = {
    totalPinjaman: number
    totalSimpanan: number
    ldr: number
    nasabahAktif: number
}

const fmt = (v: number) => {
    if (v >= 1_000_000_000) return `Rp. ${(v / 1_000_000_000).toFixed(0)} M`
    if (v >= 1_000_000) return `Rp. ${(v / 1_000_000).toFixed(3).replace('.', ',')}`
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

export default function OriginalDashboard({
    metrics,
    areaData,
}: {
    metrics: DashboardMetrics
    areaData: Array<{ month: string; value: number }>
}) {
    const [showWelcome, setShowWelcome] = useState(true)
    const [welcomeCollapsed, setWelcomeCollapsed] = useState(false)

    const statCards = [
        { label: 'DATA ANGGOTA', value: metrics.nasabahAktif.toString(), borderColor: '#3b82f6', href: '/nasabah' },
        { label: 'DATA PINJAMAN', value: fmt(metrics.totalPinjaman), borderColor: '#22c55e', href: '/pinjaman' },
        { label: 'DATA ANGSURAN', value: fmt(metrics.totalPinjaman * 0.75), borderColor: '#3b82f6', href: '/pinjaman/pembayaran' },
        { label: 'DATA TABUNGAN', value: fmt(metrics.totalSimpanan), borderColor: '#f59e0b', href: '/simpanan' },
        { label: 'DATA DENDA', value: fmt(metrics.totalPinjaman * 0.03), borderColor: '#ef4444', href: '/laporan' },
        { label: 'DATA PENGAJUAN', value: fmt(metrics.totalPinjaman * 0.35), borderColor: '#6b7280', href: '/pinjaman' },
    ]

    return (
        <main className="min-h-screen bg-white p-6 text-slate-800">

            {/* Page Title */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-slate-400 text-base">🏠</span>
                <h1 className="text-xl font-bold text-slate-700 tracking-wide">Dashboard</h1>
            </div>

            {/* Welcome Card */}
            {showWelcome && (
                <div className="mb-5 rounded border border-green-200 overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <div
                        className="flex items-center justify-between px-3 py-2 text-white text-sm font-semibold"
                        style={{ backgroundColor: '#2e7d32' }}
                    >
                        <span>■ Selamat Datang</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setWelcomeCollapsed(c => !c)}
                                className="flex h-5 w-5 items-center justify-center rounded text-white hover:bg-green-700 text-xs"
                                title={welcomeCollapsed ? 'Expand' : 'Collapse'}
                            >
                                {welcomeCollapsed ? '▼' : '▲'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowWelcome(false)}
                                className="flex h-5 w-5 items-center justify-center rounded text-white hover:bg-green-700 text-xs"
                                title="Tutup"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    {/* Card Body */}
                    {!welcomeCollapsed && (
                        <div className="px-4 py-3 bg-green-50">
                            <p className="text-sm text-slate-700">
                                Selamat datang <strong>ADMIN!</strong> Anda bisa mengoperasikan sistem dengan wewenang tertentu melalui pilihan menu di bawah.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Stat Cards Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="block rounded bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderLeft: `4px solid ${card.borderColor}` }}
                    >
                        <p
                            className="text-xs font-bold uppercase tracking-wide mb-2"
                            style={{ color: card.borderColor }}
                        >
                            {card.label}
                        </p>
                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                    </Link>
                ))}
            </div>

            {/* Chart */}
            <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span
                        className="inline-block h-4 w-1 rounded-full"
                        style={{ backgroundColor: '#2e7d32' }}
                    />
                    <h2 className="text-sm font-bold text-slate-700">Tren Pertumbuhan Simpanan & Pinjaman</h2>
                    <span className="ml-auto text-xs text-slate-400">6 Bulan Terakhir</span>
                </div>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dashGreen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}Jt`} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                                formatter={(v) => [`${v} Jt`, 'Nilai']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={2} fill="url(#dashGreen)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
                © {new Date().getFullYear()} Koperasi Simpan Pinjam &nbsp;||&nbsp; Sistem Manajemen Koperasi
            </div>
        </main>
    )
}
