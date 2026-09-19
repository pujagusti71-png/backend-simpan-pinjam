'use client'

import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type DashboardMetrics = {
    totalPinjaman: number
    totalSimpanan: number
    ldr: number
    nasabahAktif: number
}

const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2)}M`
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export default function OriginalDashboard({
    metrics,
    areaData,
}: {
    metrics: DashboardMetrics
    areaData: Array<{ month: string; value: number }>
}) {
    const cards = [
        { label: 'TOTAL PINJAMAN AKTIF', value: formatCompactCurrency(metrics.totalPinjaman), change: '↗ Data real-time' },
        { label: 'TOTAL DANA SIMPANAN', value: formatCompactCurrency(metrics.totalSimpanan), change: '↗ Data real-time' },
        { label: 'LDR RATIO', value: `${metrics.ldr.toFixed(1)}%`, change: metrics.ldr >= 80 ? 'STATUS WASPADA' : 'STATUS SEHAT' },
        { label: 'NASABAH AKTIF', value: metrics.nasabahAktif.toLocaleString('id-ID'), change: '↗ Data real-time' },
    ]

    return (
        <main className="min-h-screen overflow-y-auto bg-[#f8f9fa] p-10 text-slate-900">
            <div className="mb-[30px]">
                <div className="text-[0.85rem] font-medium text-slate-500">Beranda / Dashboard</div>
                <h1 className="my-1 text-2xl font-bold text-[#111]">Dashboard Ringkasan</h1>
                <p className="m-0 text-[0.95rem] text-slate-500">Pantau kinerja real-time pinjaman dan simpanan nasabah.</p>
            </div>

            <section className="mb-[30px] flex flex-col gap-5 md:flex-row">
                {cards.map((card) => (
                    <div key={card.label} className="flex-1 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h2 className="m-0 mb-2.5 text-[0.85rem] font-semibold text-slate-500">{card.label}</h2>
                        <p className="m-0 mb-2.5 text-[1.8rem] font-bold text-[#111]">{card.value}</p>
                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${card.label === 'LDR RATIO' && metrics.ldr >= 80 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'}`}>
                            {card.change}
                        </span>
                    </div>
                ))}
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="m-0 text-[1.1rem] font-bold text-[#111]">Tren Pertumbuhan Simpanan vs Pinjaman</h2>
                <p className="my-1 mb-5 text-[0.9rem] text-slate-500">Performa 6 Bulan Terakhir</p>
                <div className="h-[250px] rounded-lg bg-[#f9fafb]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dashboardGrowth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#128c7e" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#128c7e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#d1d5db" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#128c7e" strokeWidth={2} fill="url(#dashboardGrowth)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <nav className="sr-only" aria-label="Navigasi desain asli">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/simpanan">Simpanan</Link>
                <Link href="/pinjaman">Pinjaman</Link>
                <Link href="/laporan">Laporan</Link>
            </nav>
        </main>
    )
}
