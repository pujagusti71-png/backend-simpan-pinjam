"use client"

import Link from "next/link"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const reports: Array<[string, string, string, string]> = [
    [
        "Portofolio Pinjaman",
        "Ringkasan pinjaman aktif dan kolektibilitas",
        "/pinjaman",
        "📁",
    ],
    [
        "Analisis Risiko",
        "Prediksi risiko gagal bayar peminjam",
        "/pinjaman/analisis-skor-risiko",
        "🛡️",
    ],
    ["Tren Simpanan", "Pertumbuhan dana simpanan bulanan", "/simpanan", "📈"],
    [
        "LDR & Likuiditas",
        "Analisis LDR dan ketersediaan likuiditas",
        "/laporan/ldr-likuiditas",
        "💰",
    ],
    [
        "Data Tidak Aktif",
        "Daftar nasabah tidak aktif periode ini",
        "/nasabah/tidak-aktif",
        "⚠️",
    ],
]
export default function OriginalLaporan({ riskJobs, lineData }: { riskJobs?: Array<{ label: string; value: number }>; lineData?: Array<{ month: string; value: number }> }) {
    const exportData = () => {
        const exportRows = riskJobs?.length
            ? riskJobs.map((job) => [job.label, `${job.value}%`])
            : []
        const csv = [['Laporan', 'Nilai'], ...exportRows].map((row) => row.join(',')).join('\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        link.download = 'laporan-analitik.csv'
        link.click()
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-[#f8f9fa] p-4 sm:p-6 md:p-8 lg:p-10 text-slate-900">
            <header className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <div className="text-[0.85rem] font-medium text-slate-500">
                        Analitik Lanjutan
                    </div>
                    <h1 className="my-1 text-2xl font-bold text-[#111]">
                        Laporan & Analitik
                    </h1>
                    <p className="m-0 text-[0.95rem] text-slate-500">
                        Pantau performa keuangan dan kesehatan portofolio secara real-time
                    </p>
                </div>
                <button
                    type="button"
                    onClick={exportData}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700"
                >
                    ↓ Ekspor Data
                </button>
            </header>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                {reports.map(([title, description, href, icon]) => (
                    <Link
                        key={title}
                        href={href}
                        className="rounded-xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:shadow-md"
                    >
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-xl">
                            {icon}
                        </div>
                        <h2 className="m-0 mb-2 text-sm font-bold text-[#111]">{title}</h2>
                        <p className="m-0 text-xs leading-5 text-slate-500">
                            {description}
                        </p>
                    </Link>
                ))}
            </section>
            <section className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-[2] rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h2 className="m-0 mb-1 text-lg font-bold text-[#111]">
                        Tren Keterlambatan Pembayaran
                    </h2>
                    <p className="m-0 mb-5 text-sm text-slate-500">
                        Persentase keterlambatan nasabah bulanan
                    </p>
                    <div className="h-[250px] rounded-lg bg-[#f9fafb]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid stroke="#d1d5db" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#128c7e" strokeWidth={2} dot={{ r: 4, fill: '#128c7e' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="flex-1 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h2 className="m-0 mb-1 text-lg font-bold text-[#111]">
                        Pekerjaan Risiko Tertinggi
                    </h2>
                    <p className="m-0 mb-5 text-sm text-slate-500">
                        Berdasarkan rasio NPL per sektor
                    </p>
                    {riskJobs?.length ? riskJobs.map((job, index) => [job.label, `${job.value}%`, ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-violet-500', 'bg-cyan-500'][index] ?? 'bg-cyan-500'] as const).map(([name, value, color]) => (
                        <div key={name} className="mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
                                {name}
                            </span>
                            <b className="text-sm text-[#111]">{value}</b>
                        </div>
                    )) : <p className="text-sm text-slate-500">Belum ada data risiko pekerjaan.</p>}
                    <Link
                        href="/analisis"
                        className="mt-2 block border-t border-slate-200 pt-4 text-center text-sm font-semibold text-[#128c7e]"
                    >
                        Lihat Semua Data Pekerjaan
                    </Link>
                </div>
            </section>
        </main>
    )
}
