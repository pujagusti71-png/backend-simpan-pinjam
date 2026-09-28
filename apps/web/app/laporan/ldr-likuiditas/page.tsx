'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Building2, TrendingUp, Wallet, Percent, UsersRound } from 'lucide-react'

import { apiFetch } from '@/lib/api'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)

export default function LdrLikuiditasPage() {
    const [summary, setSummary] = useState({
        totalSimpanan: 0,
        totalPinjaman: 0,
        ldr: 0,
        danaBeredar: 0,
        nasabahTidakAktif: 0,
        totalNasabah: 0,
        persentaseKeterlambatan: 0,
    })
    const [riskJobs, setRiskJobs] = useState<Array<{ label: string; value: number }>>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [nasabahRes, pinjamanRes, simpananRes, pekerjaanRes, summaryRes] = await Promise.all([
                    apiFetch('/nasabah').catch(() => []),
                    apiFetch('/pinjaman').catch(() => []),
                    apiFetch('/simpanan').catch(() => []),
                    apiFetch('/analisis-pekerjaan').catch(() => ({ data: [] })),
                    apiFetch('/dashboard/summary').catch(() => null),
                ])

                const nasabah = Array.isArray(nasabahRes) ? nasabahRes : []
                const pinjaman = Array.isArray(pinjamanRes) ? pinjamanRes : []
                const simpanan = Array.isArray(simpananRes) ? simpananRes : []
                const jobs = Array.isArray(pekerjaanRes?.data)
                    ? pekerjaanRes.data
                    : Array.isArray(pekerjaanRes)
                        ? pekerjaanRes
                        : []

                // Saldo simpanan terbaru per nasabah (bukan jumlah seluruh transaksi snapshot)
                let totalSimpanan = 0
                if (summaryRes?.simpanan?.totalSaldo !== undefined) {
                    totalSimpanan = Number(summaryRes.simpanan.totalSaldo)
                } else {
                    const saldoPerNasabah = new Map<number, number>()
                    simpanan.forEach((item: any) => {
                        if (item.nasabahId && !saldoPerNasabah.has(item.nasabahId)) {
                            saldoPerNasabah.set(item.nasabahId, Number(item.saldoAkhir ?? 0))
                        }
                    })
                    totalSimpanan = [...saldoPerNasabah.values()].reduce((sum, v) => sum + v, 0)
                }

                // Total nilai pinjaman aktif yang benar
                let totalPinjaman = 0
                if (summaryRes?.pinjaman?.nilaiTotalAktif !== undefined) {
                    totalPinjaman = Number(summaryRes.pinjaman.nilaiTotalAktif)
                } else {
                    totalPinjaman = pinjaman
                        .filter((p: any) => p.status === 'active')
                        .reduce((sum: number, item: any) => sum + Number(item.jumlahPinjaman ?? item.jumlah ?? 0), 0)
                }

                const ldr = totalSimpanan > 0 ? (totalPinjaman / totalSimpanan) * 100 : 0
                const danaBeredar = Math.max(0, totalSimpanan - totalPinjaman)

                const inactive = nasabah.filter((item: any) => {
                    const riwayat = String(item?.riwayatPembayaran ?? '').toLowerCase()
                    const hasTunggakan = Boolean(item?.tunggakan ?? item?.adaTunggakan)
                    const risky = ['K3', 'K4', 'K5'].includes(String(item?.slik ?? ''))
                    return riwayat.includes('telat') || hasTunggakan || risky
                }).length

                const derivedRiskJobs = jobs.map((item: any) => ({
                    label: item.pekerjaan || 'Pekerjaan',
                    value: Math.max(0, Number(item?.persentaseKeterlambatan ?? 0)),
                }))

                const totalNasabah = summaryRes?.nasabah?.total ?? nasabah.length
                const avgKeterlambatan = derivedRiskJobs.length > 0
                    ? derivedRiskJobs.reduce((sum: number, item: { value: number }) => sum + item.value, 0) / derivedRiskJobs.length
                    : 0

                setSummary({
                    totalSimpanan,
                    totalPinjaman,
                    ldr: Number(ldr.toFixed(1)),
                    danaBeredar,
                    nasabahTidakAktif: inactive,
                    totalNasabah,
                    persentaseKeterlambatan: avgKeterlambatan,
                })
                setRiskJobs(derivedRiskJobs)
            } catch (error) {
                console.error('Gagal memuat data likuiditas', error)
                setSummary({
                    totalSimpanan: 0,
                    totalPinjaman: 0,
                    ldr: 0,
                    danaBeredar: 0,
                    nasabahTidakAktif: 0,
                    totalNasabah: 0,
                    persentaseKeterlambatan: 0,
                })
                setRiskJobs([])
            } finally {
                setLoading(false)
            }
        }

        void loadData()
    }, [])

    const statCards = useMemo(
        () => [
            {
                label: 'Total Dana Simpanan',
                value: formatCurrency(summary.totalSimpanan),
                tone: 'text-emerald-600',
                icon: Wallet,
            },
            {
                label: 'Total Pinjaman',
                value: formatCurrency(summary.totalPinjaman),
                tone: 'text-sky-600',
                icon: Building2,
            },
            {
                label: 'LDR',
                value: `${summary.ldr.toFixed(1)}%`,
                tone: 'text-violet-600',
                icon: Percent,
            },
            {
                label: 'Dana Beredar',
                value: formatCurrency(summary.danaBeredar),
                tone: 'text-amber-600',
                icon: TrendingUp,
            },
        ],
        [summary],
    )

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Laporan</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-900">LDR & Likuiditas</h1>
                    </div>
                    <Link
                        href="/laporan"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Link>
                </header>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
                        Memuat dashboard likuiditas...
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {statCards.map(({ label, value, tone, icon: Icon }) => (
                                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-slate-500">{label}</p>
                                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <p className={`mt-4 text-2xl font-bold ${tone}`}>{value}</p>
                                </div>
                            ))}
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900">Ringkasan operasional</h2>
                                <div className="mt-5 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-sm text-slate-500">Total nasabah</span>
                                        <span className="text-base font-semibold text-slate-900">{summary.totalNasabah}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-sm text-slate-500">Nasabah tidak aktif</span>
                                        <span className="text-base font-semibold text-amber-600">{summary.nasabahTidakAktif}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <span className="text-sm text-slate-500">Persentase keterlambatan</span>
                                        <span className="text-base font-semibold text-rose-600">{summary.persentaseKeterlambatan.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-1">
                                        <span className="text-sm text-slate-500">Status likuiditas</span>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${summary.ldr >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {summary.ldr >= 80 ? 'Waspada' : 'Sehat'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5 text-sky-600" />
                                    <h2 className="text-lg font-bold text-slate-900">Profil risiko per pekerjaan</h2>
                                </div>
                                <div className="mt-5 space-y-4">
                                    {riskJobs.length === 0 ? (
                                        <p className="text-sm text-slate-500">Belum ada data analisis pekerjaan.</p>
                                    ) : (
                                        riskJobs.map((job) => (
                                            <div key={job.label}>
                                                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                                                    <span>{job.label}</span>
                                                    <span className="font-semibold text-slate-800">{job.value.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                                                        style={{ width: `${Math.min(job.value, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}
