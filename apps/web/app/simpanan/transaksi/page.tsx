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

const formatDate = (value: string) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

type NasabahOption = {
    id: number
    nama: string
    nik: string
}

type TransactionRow = {
    id: number
    nasabah: string
    tanggal: string
    jenis: 'Setoran' | 'Penarikan'
    nominal: number
    bungaRate: number
    saldoAkhir: number
    status: string
    keterangan: string
}

export default function TransaksiSimpananPage() {
    const [nasabahList, setNasabahList] = useState<NasabahOption[]>([])
    const [rows, setRows] = useState<TransactionRow[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [selectedBalance, setSelectedBalance] = useState(0)
    const [form, setForm] = useState({
        nasabahId: '',
        jenis: 'setoran',
        nominal: '',
        tanggal: new Date().toISOString().slice(0, 10),
        keterangan: '',
    })

    const autoRate = Number(form.nominal) > 0 && selectedBalance + Number(form.nominal) > 5_000_000
        ? 0.5
        : 0
    const autoInterest = (Number(form.nominal) || 0) * (autoRate / 100)

    const loadData = async () => {
        try {
            setLoading(true)
            const nasabah = await apiFetch('/nasabah')
            const list = Array.isArray(nasabah) ? nasabah : []
            setNasabahList(list)

            if (list.length > 0 && !form.nasabahId) {
                setForm((prev) => ({ ...prev, nasabahId: String(list[0].id) }))
            }

            const flatRows: TransactionRow[] = []

            for (const item of list) {
                try {
                    const response = await apiFetch(`/simpanan/nasabah/${item.id}`)
                    const records = Array.isArray(response?.data)
                        ? response.data
                        : Array.isArray(response)
                            ? response
                            : []

                    records.forEach((record: any) => {
                        const isBunga = String(record?.keterangan ?? '').toLowerCase().includes('bunga')
                        const bungaRate = Number(record?.bungaSimpanan ?? 0)
                        const nominalValue = Math.abs(Number(record.jumlahSetoran || 0)) || Number(record?.transaksiBunga?.[0]?.nominalBunga || 0)
                        flatRows.push({
                            id: record.id,
                            nasabah: item.nama,
                            tanggal: record.tanggalSetoran || record.createdAt,
                            jenis: isBunga ? 'Setoran' : Number(record.jumlahSetoran || 0) >= 0 ? 'Setoran' : 'Penarikan',
                            nominal: nominalValue,
                            bungaRate: bungaRate > 0 ? bungaRate : isBunga ? 0.5 : 0,
                            saldoAkhir: Number(record.saldoAkhir || 0),
                            status: record.status || 'aktif',
                            keterangan: record.keterangan || (isBunga ? 'Bunga tabungan' : 'Transaksi simpanan'),
                        })
                    })
                } catch {
                    // skip failed customer
                }
            }

            setRows(flatRows.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()))
        } catch (error) {
            console.error('Gagal memuat transaksi simpanan', error)
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [])

    useEffect(() => {
        const fetchSelectedBalance = async () => {
            if (!form.nasabahId) {
                setSelectedBalance(0)
                return
            }

            try {
                const summary = await apiFetch(`/simpanan/summary/${form.nasabahId}`)
                setSelectedBalance(Number(summary?.saldoSaatIni || 0))
            } catch {
                setSelectedBalance(0)
            }
        }

        void fetchSelectedBalance()
    }, [form.nasabahId])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')

        if (!form.nasabahId || !form.nominal) {
            setError('Pilih nasabah dan masukkan nominal transaksi.')
            return
        }

        const nominal = Number(form.nominal)
        if (!Number.isFinite(nominal) || nominal <= 0) {
            setError('Nominal harus angka positif.')
            return
        }

        try {
            setSubmitting(true)

            if (form.jenis === 'setoran') {
                const rate = selectedBalance + nominal > 5_000_000 ? 0.5 : 0

                await apiFetch('/simpanan', {
                    method: 'POST',
                    body: JSON.stringify({
                        nasabahId: Number(form.nasabahId),
                        jumlahSetoran: nominal,
                        bungaSimpanan: rate,
                        jenisInterest: 'flat',
                        tanggalSetoran: new Date(`${form.tanggal}T00:00:00`).toISOString(),
                        keterangan: form.keterangan || 'Setoran simpanan',
                    }),
                })
            } else {
                await apiFetch('/simpanan/withdraw', {
                    method: 'POST',
                    body: JSON.stringify({
                        nasabahId: Number(form.nasabahId),
                        jumlahPenarikan: nominal,
                        keterangan: form.keterangan || 'Penarikan simpanan',
                    }),
                })
            }

            setForm((prev) => ({
                ...prev,
                nominal: '',
                tanggal: new Date().toISOString().slice(0, 10),
                keterangan: '',
            }))
            await loadData()
        } catch (err) {
            console.error('Gagal menyimpan transaksi simpanan', err)
            setError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi simpanan.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-6xl space-y-8">
                <header className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Transaksi Simpanan</h2>
                        <p className="mt-2 text-slate-500">Catat setoran dan penarikan simpanan nasabah.</p>
                    </div>
                    <Link
                        href="/simpanan"
                        className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        Kembali ke Simpanan
                    </Link>
                </header>

                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">Form transaksi baru</h3>
                    <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Nasabah</span>
                            <select
                                value={form.nasabahId}
                                onChange={(event) => setForm((prev) => ({ ...prev, nasabahId: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-sky-500"
                            >
                                <option value="">Pilih nasabah</option>
                                {nasabahList.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama} ({item.nik})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Jenis transaksi</span>
                            <select
                                value={form.jenis}
                                onChange={(event) => setForm((prev) => ({ ...prev, jenis: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
                            >
                                <option value="setoran">Setoran</option>
                                <option value="penarikan">Penarikan</option>
                            </select>
                        </label>

                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Nominal</span>
                            <input
                                type="number"
                                min="1"
                                value={form.nominal}
                                onChange={(event) => setForm((prev) => ({ ...prev, nominal: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
                                placeholder="500000"
                            />
                        </label>

                        <label className="space-y-2 text-sm font-medium text-slate-700">
                            <span>Tanggal</span>
                            <input
                                type="date"
                                value={form.tanggal}
                                onChange={(event) => setForm((prev) => ({ ...prev, tanggal: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
                            />
                        </label>

                        <div className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Bunga otomatis</span>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                                {form.nominal && Number(form.nominal) > 0
                                    ? `Saldo setelah setoran: ${formatCurrency(selectedBalance + Number(form.nominal))}. Bunga otomatis: ${autoRate.toFixed(1)}% (${formatCurrency(autoInterest)})`
                                    : 'Masukkan nominal untuk melihat bunga otomatis.'}
                                <div className="mt-2 text-xs text-emerald-600">
                                    Ketentuan: saldo sampai Rp 5.000.000 = 0%, di atas Rp 5.000.000 sampai Rp 20.000.000 = 0,5%.
                                </div>
                            </div>
                        </div>

                        <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                            <span>Keterangan</span>
                            <textarea
                                value={form.keterangan}
                                onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-500"
                                placeholder="Contoh: Setoran bulanan, penarikan kebutuhan sekolah"
                            />
                        </label>

                        {error ? (
                            <div className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || loading}
                                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {submitting ? 'Menyimpan...' : 'Catat transaksi'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="py-10 text-center text-slate-500">Memuat transaksi simpanan...</div>
                    ) : rows.length === 0 ? (
                        <div className="py-10 text-center text-slate-600">Belum ada transaksi simpanan yang tercatat.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-700">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-3 py-3 font-semibold text-slate-600">Nasabah</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Jenis</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Nominal</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Bunga</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Tanggal</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Saldo Akhir</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="px-3 py-3 font-semibold text-slate-600">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="px-3 py-4 font-medium text-slate-900">{row.nasabah}</td>
                                            <td className="px-3 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.jenis === 'Setoran' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {row.jenis}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">{formatCurrency(row.nominal)}</td>
                                            <td className="px-3 py-4 text-emerald-700">{row.bungaRate > 0 ? `${row.bungaRate.toFixed(1)}%` : '0%'}</td>
                                            <td className="px-3 py-4">{formatDate(row.tanggal)}</td>
                                            <td className="px-3 py-4">{formatCurrency(row.saldoAkhir)}</td>
                                            <td className="px-3 py-4 capitalize text-slate-900">{row.status}</td>
                                            <td className="px-3 py-4 text-slate-600">{row.keterangan}</td>
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
