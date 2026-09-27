"use client"

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, BarChart3, Search } from 'lucide-react'
import { api } from '@/lib/api'

type AnalisisRow = {
  nama: string
  penghasilan: number
  cicilan: number
  rasio: number
  risiko: string
}

const defaultAnalisisData: AnalisisRow[] = [
  { nama: 'Samuel Santoso', penghasilan: 7500000, cicilan: 1350000, rasio: 18, risiko: 'Rendah' },
  { nama: 'Dewi Permata', penghasilan: 6000000, cicilan: 1500000, rasio: 25, risiko: 'Rendah' },
  { nama: 'Ahmad Fauzi', penghasilan: 8500000, cicilan: 2975000, rasio: 35, risiko: 'Sedang' },
  { nama: 'Budi Santoso', penghasilan: 4200000, cicilan: 2310000, rasio: 55, risiko: 'Tinggi' },
  { nama: 'Siti Aminah', penghasilan: 5000000, cicilan: 1200000, rasio: 24, risiko: 'Rendah' },
]

export default function AnalisisPage() {
  const [rows, setRows] = useState<AnalisisRow[]>(defaultAnalisisData)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getAnalisisRisiko()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRows(data.map((item: any) => {
            const penghasilan = Number(item.penghasilan || 0)
            const cicilan = Number(item.cicilan || item.cicilanBulanan || 0)
            const rasio = penghasilan > 0 ? (cicilan / penghasilan) * 100 : 0
            return {
              nama: item.namaNasabah || item.nama || 'Nasabah',
              penghasilan,
              cicilan,
              rasio,
              risiko: item.status || item.risiko || 'Review',
            }
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)

  const low = rows.filter((row) => row.risiko.toLowerCase().includes('rendah') || row.risiko.toLowerCase().includes('layak')).length
  const medium = rows.filter((row) => row.risiko.toLowerCase().includes('sedang') || row.risiko.toLowerCase().includes('review')).length
  const high = Math.max(0, rows.length - low - medium)
  const total = Math.max(rows.length, 1)
  const lowPercent = Math.round((low / total) * 100)
  const mediumPercent = Math.round((medium / total) * 100)
  const highPercent = Math.max(0, 100 - lowPercent - mediumPercent)

  const filtered = rows.filter((r) => r.nama.toLowerCase().includes(search.toLowerCase()))

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 sm:p-6 md:p-8 lg:p-10 text-slate-900">
      {/* Header */}
      <div className="mb-6">
        <div className="text-[0.85rem] font-medium text-slate-500">Analisis / Risiko</div>
        <h1 className="my-1 text-2xl font-bold text-[#111]">Analisis Skor & Risiko Kredit</h1>
        <p className="m-0 text-[0.95rem] text-slate-500">
          Evaluasi profil Debt Service Ratio (DSR), kelayakan pinjaman, dan distribusi risiko nasabah
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Rendah</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{low} Nasabah</p>
          <p className="mt-1 text-xs text-slate-500">{lowPercent}% dari total portofolio</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Sedang</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{medium} Nasabah</p>
          <p className="mt-1 text-xs text-slate-500">{mediumPercent}% dari total portofolio</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Tinggi</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{high} Nasabah</p>
          <p className="mt-1 text-xs text-slate-500">{highPercent}% dari total portofolio</p>
        </div>
      </section>

      {/* Sebaran Komposisi Bar */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Distribusi Komposisi Risiko</h2>
            <p className="text-xs text-slate-500">Perbandingan rasio cicilan terhadap penghasilan (DSR)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Rendah ({lowPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Sedang ({mediumPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Tinggi ({highPercent}%)
            </span>
          </div>
        </div>

        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${lowPercent}%` }} />
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${mediumPercent}%` }} />
          <div className="h-full bg-red-500 transition-all" style={{ width: `${highPercent}%` }} />
        </div>
      </section>

      {/* Tabel Rincian */}
      <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Detail Nasabah Berdasarkan Risiko</h2>
            <p className="text-xs text-slate-500">Daftar evaluasi kemampuan bayar per anggota</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama nasabah..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-3">Nama Nasabah</th>
                <th className="p-3">Penghasilan / Bln</th>
                <th className="p-3">Total Cicilan</th>
                <th className="p-3">Rasio Cicilan (DSR)</th>
                <th className="p-3 text-right">Status Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ditemukan data nasabah.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const badgeClass =
                    row.risiko === 'Rendah'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : row.risiko === 'Sedang'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'

                  return (
                    <tr key={row.nama} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{row.nama}</td>
                      <td className="p-3 text-slate-600">{formatCurrency(row.penghasilan)}</td>
                      <td className="p-3 text-slate-600">{formatCurrency(row.cicilan)}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{row.rasio.toFixed(1)}%</div>
                        <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              row.rasio <= 30 ? 'bg-emerald-500' : row.rasio <= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, row.rasio)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold border ${badgeClass}`}>
                          {row.risiko}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
