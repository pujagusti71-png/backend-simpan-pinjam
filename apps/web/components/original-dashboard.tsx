'use client'

import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type DashboardMetrics = {
    totalPinjaman: number
    totalSimpanan: number
    ldr: number
    nasabahAktif: number
}

const fmt = (v: number) => {
    if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`
    if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} Jt`
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

export default function OriginalDashboard({
    metrics,
    areaData,
}: {
    metrics: DashboardMetrics
    areaData: Array<{ month: string; value: number }>
}) {
    const cards = [
        { label: 'Total Pinjaman Aktif', value: fmt(metrics.totalPinjaman), sub: 'Data real-time', color: '#2e7d32' },
        { label: 'Total Dana Simpanan', value: fmt(metrics.totalSimpanan), sub: 'Data real-time', color: '#1565c0' },
        { label: 'LDR Ratio', value: `${metrics.ldr.toFixed(1)}%`, sub: metrics.ldr >= 80 ? 'Waspada' : 'Sehat', color: metrics.ldr >= 80 ? '#e65100' : '#2e7d32' },
        { label: 'Nasabah Aktif', value: metrics.nasabahAktif.toLocaleString('id-ID'), sub: 'Anggota terdaftar', color: '#6a1b9a' },
    ]

    return (
        <main className="min-h-screen bg-[#f4f6f8] p-6 text-slate-800">

            {/* Page Heading */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-800 tracking-wide">BERANDA</h1>
            </div>

            {/* Welcome Card */}
            <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
                <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ backgroundColor: '#2e7d32' }}
                >
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <span>■</span>
                        <span>Selamat Datang</span>
                    </div>
                    <div className="flex gap-1">
                        <button type="button" className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-green-700 text-xs font-bold">▲</button>
                        <button type="button" className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-green-700 text-xs font-bold">▼</button>
                        <button type="button" className="flex h-6 w-6 items-center justify-center rounded text-white hover:bg-green-700 text-xs font-bold">✕</button>
                    </div>
                </div>
                <div className="px-5 py-4 bg-green-50 border-t border-green-100">
                    <p className="text-sm text-slate-700">Selamat datang di sistem Koperasi Simpan Pinjam 🎉</p>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-lg bg-white p-5 shadow-sm border border-slate-200">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="inline-block h-3 w-1 rounded-full" style={{ backgroundColor: card.color }} />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-slate-800">{card.value}</p>
                        <span
                            className="mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${card.color}18`, color: card.color }}
                        >
                            {card.sub}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-200">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="inline-block h-4 w-1 rounded-full" style={{ backgroundColor: '#2e7d32' }} />
                    <h2 className="text-sm font-bold text-slate-700">Tren Pertumbuhan Simpanan vs Pinjaman</h2>
                    <span className="ml-auto text-xs text-slate-400">6 Bulan Terakhir</span>
                </div>
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e8ecef" strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}Jt`} />
                            <Tooltip
                                contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }}
                                formatter={(v) => [`${v} Jt`, 'Nilai']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={2.5} fill="url(#greenGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} Koperasi Simpan Pinjam &nbsp;|&nbsp; Sistem Manajemen Koperasi
            </div>
        </main>
    )
}
