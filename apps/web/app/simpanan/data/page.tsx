'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)

const getAnnualRate = (saldo: number): number => {
    if (saldo < 1_000_000) return 0
    if (saldo <= 10_000_000) return 2.0
    if (saldo <= 50_000_000) return 3.0
    if (saldo <= 100_000_000) return 3.75
    return 4.5
}

export default function DataSimpananPage() {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingInterest, setProcessingInterest] = useState(false)
    const [processResult, setProcessResult] = useState<any | null>(null)

    const loadRows = async () => {
        try {
            setLoading(true)

            const [nasabah, simpananRecords] = await Promise.all([
                apiFetch('/nasabah').catch(() => []),
                apiFetch('/simpanan').catch(() => []),
            ])

            const nasabahList = Array.isArray(nasabah) ? nasabah : []
            const records = Array.isArray(simpananRecords) ? simpananRecords : []
            const grouped = new Map<number, {
                id: number
                nama: string
                pekerjaan: string
                saldoSaatIni: number
                totalSetoran: number
                totalPenarikan: number
                totalBunga: number
                tierRate: number
            }>()

            for (const record of records) {
                const nasabahId = Number(record?.nasabahId ?? record?.nasabah?.id)
                if (!nasabahId) continue

                const nasabahItem = nasabahList.find((item: any) => Number(item.id) === nasabahId)
                if (!nasabahItem) continue

                const existing = grouped.get(nasabahId) ?? {
                    id: nasabahId,
                    nama: nasabahItem.nama,
                    pekerjaan: nasabahItem.pekerjaan || '-',
                    saldoSaatIni: 0,
                    totalSetoran: 0,
                    totalPenarikan: 0,
                    totalBunga: 0,
                    tierRate: 0,
                }

                const jumlahSetoran = Number(record?.jumlahSetoran ?? 0)
                const saldoAkhir = Number(record?.saldoAkhir ?? 0)
                const keterangan = String(record?.keterangan ?? '').toLowerCase()
                const isBungaTransaction = keterangan.includes('bunga') || keterangan.includes('bagi hasil')

                if (isBungaTransaction) {
                    existing.totalBunga += Math.max(jumlahSetoran, 0)
                } else if (jumlahSetoran > 0) {
                    existing.totalSetoran += jumlahSetoran
                } else if (jumlahSetoran < 0) {
                    existing.totalPenarikan += Math.abs(jumlahSetoran)
                }

                existing.saldoSaatIni = Math.max(existing.saldoSaatIni, saldoAkhir)
                existing.tierRate = getAnnualRate(existing.saldoSaatIni)

                grouped.set(nasabahId, existing)
            }

            const rowsToShow = Array.from(grouped.values())
                .filter((row) => row.saldoSaatIni > 0 || row.totalSetoran > 0 || row.totalPenarikan > 0 || row.totalBunga > 0)
                .sort((a, b) => b.saldoSaatIni - a.saldoSaatIni)

            setRows(rowsToShow)
        } catch (error) {
            console.error('Gagal memuat data simpanan', error)
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadRows()
    }, [])

    const handleProcessMonthlyInterest = async () => {
        if (!confirm('Jalankan pembagian bunga / bagi hasil simpanan bulan ini untuk seluruh nasabah aktif?')) {
            return
        }

        try {
            setProcessingInterest(true)
            setProcessResult(null)

            const res = await apiFetch('/simpanan/process-monthly-interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })

            setProcessResult(res)
            await loadRows()
        } catch (error: any) {
            console.error('Gagal memproses bunga bulanan:', error)
            alert(error?.message || 'Gagal memproses bunga bulanan. Periksa koneksi backend.')
        } finally {
            setProcessingInterest(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Data Simpanan Nasabah</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitoring saldo simpanan, akumulasi setoran tunai, dan bagi hasil bunga bulanan.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleProcessMonthlyInterest}
                            disabled={processingInterest}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                            title="Proses perhitungan & penyaluran bunga simpanan periode bulan ini ke saldo masing-masing nasabah"
                        >
                            <svg className={`h-4 w-4 ${processingInterest ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {processingInterest ? 'Memproses Bunga...' : 'Bagikan Bunga Bulanan'}
                        </button>
                        <Link
                            href="/simpanan"
                            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Kembali ke Simpanan
                        </Link>
                    </div>
                </header>

                {/* Notifikasi Hasil Proses Bunga */}
                {processResult && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-emerald-950">
                                    Hasil Pembagian Bunga Periode {processResult.periode}
                                </h4>
                                <p className="mt-1 text-sm text-emerald-800">
                                    Berhasil menyalurkan bunga ke <strong>{processResult.totalNasabahDiproses} nasabah</strong> dengan total bagi hasil <strong>{formatCurrency(processResult.totalBungaDibagikan)}</strong>.
                                </p>
                            </div>
                            <button
                                onClick={() => setProcessResult(null)}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-950"
                            >
                                Tutup ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Banner Skema Suku Bunga Resmi Koperasi */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Standar Suku Bunga Simpanan (p.a.)</span>
                            <h3 className="text-sm font-semibold text-slate-800 mt-0.5">Skema Berjenjang Bunga Bulanan Berdasarkan Saldo</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-600 font-medium">
                                &lt; Rp 1 Jt: <strong className="text-slate-800">0%</strong>
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200 font-medium">
                                1 Jt – 10 Jt: <strong>2.0% p.a.</strong>
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200 font-medium">
                                10 Jt – 50 Jt: <strong>3.0% p.a.</strong>
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200 font-medium">
                                50 Jt – 100 Jt: <strong>3.75% p.a.</strong>
                            </span>
                            <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-emerald-900 border border-emerald-300 font-bold">
                                &gt; 100 Jt: 4.5% p.a.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabel Simpanan */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500">Memuat data simpanan nasabah...</div>
                    ) : rows.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">Belum ada data simpanan aktif.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-700">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase text-slate-500">
                                        <th className="px-4 py-3">Nasabah</th>
                                        <th className="px-4 py-3">Pekerjaan</th>
                                        <th className="px-4 py-3">Saldo Simpanan</th>
                                        <th className="px-4 py-3">Setoran Pokok</th>
                                        <th className="px-4 py-3">Penarikan</th>
                                        <th className="px-4 py-3 text-right">Bunga / Bagi Hasil</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((row) => (
                                        <tr key={row.id} className="transition hover:bg-slate-50/80">
                                            <td className="px-4 py-4 font-semibold text-slate-900">{row.nama}</td>
                                            <td className="px-4 py-4 text-slate-600">{row.pekerjaan}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-slate-900">{formatCurrency(row.saldoSaatIni)}</div>
                                                <div className="mt-0.5 text-[11px] text-slate-500">
                                                    Tier: <span className="font-semibold text-emerald-700">{row.tierRate > 0 ? `${row.tierRate}% p.a.` : '0%'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-slate-700">{formatCurrency(row.totalSetoran)}</td>
                                            <td className="px-4 py-4 font-medium text-slate-700">
                                                {row.totalPenarikan > 0 ? (
                                                    <span className="text-red-600">-{formatCurrency(row.totalPenarikan)}</span>
                                                ) : (
                                                    'Rp 0'
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                    +{formatCurrency(row.totalBunga)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
