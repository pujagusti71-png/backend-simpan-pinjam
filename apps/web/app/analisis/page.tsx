"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AnalisisPage() {
  const [rows, setRows] = useState<Array<{ nama: string; penghasilan: number; cicilan: number; rasio: number; risiko: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalisisRisiko()
      .then((data) => {
        const items = Array.isArray(data) ? data : []
        setRows(items.map((item: any) => {
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
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
  const low = rows.filter((row) => row.risiko.toLowerCase().includes('rendah') || row.risiko.toLowerCase().includes('layak')).length
  const medium = rows.filter((row) => row.risiko.toLowerCase().includes('sedang') || row.risiko.toLowerCase().includes('review')).length
  const high = Math.max(0, rows.length - low - medium)
  const total = Math.max(rows.length, 1)
  const lowPercent = Math.round((low / total) * 100)
  const mediumPercent = Math.round((medium / total) * 100)
  const highPercent = Math.max(0, 100 - lowPercent - mediumPercent)

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Analisis Risiko</p>
          <h1 className="mt-3 text-xl font-semibold text-slate-100">Analisis Risiko</h1>
          <p className="mt-3 max-w-2xl text-xs text-slate-400">Lihat kondisi risiko pinjaman nasabah.</p>
        </header>

        <section className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-400">Risiko Rendah</p>
            <p className="mt-4 text-lg font-bold text-emerald-400">{low} nasabah</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-400">Risiko Sedang</p>
            <p className="mt-4 text-lg font-bold text-amber-300">{medium} nasabah</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-400">Risiko Tinggi</p>
            <p className="mt-4 text-lg font-bold text-rose-400">{high} nasabah</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Sebaran Risiko</p>
              <h2 className="mt-3 text-sm font-semibold text-slate-100">Komposisi risiko nasabah</h2>
            </div>
            <div className="space-y-2 text-right text-slate-300">
              <p className="text-sm">Rendah {lowPercent}%</p>
              <p className="text-sm">Sedang {mediumPercent}%</p>
              <p className="text-sm">Tinggi {highPercent}%</p>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-1">
            <div className="flex h-10 overflow-hidden rounded-3xl bg-slate-700">
              <div className="h-full bg-emerald-400" style={{ width: `${lowPercent}%` }} />
              <div className="h-full bg-amber-300" style={{ width: `${mediumPercent}%` }} />
              <div className="h-full bg-rose-400" style={{ width: `${highPercent}%` }} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-800 p-4">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Daftar Nasabah</p>
            <h2 className="mt-3 text-sm font-semibold text-slate-100">Detail nasabah berdasarkan risiko</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs text-slate-100">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="border-b border-slate-700 px-3 py-2">Nama</th>
                  <th className="border-b border-slate-700 px-3 py-2">Penghasilan</th>
                  <th className="border-b border-slate-700 px-3 py-2">Cicilan</th>
                  <th className="border-b border-slate-700 px-3 py-2">Rasio %</th>
                  <th className="border-b border-slate-700 px-3 py-2">Risiko</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Memuat data...</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Belum ada data analisis.</td></tr> : rows.map((row) => {
                  const badgeClasses =
                    row.risiko === 'Rendah'
                      ? 'bg-emerald-400 text-slate-950'
                      : row.risiko === 'Sedang'
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-rose-400 text-slate-950'

                  return (
                    <tr key={row.nama} className="border-b border-slate-700 last:border-b-0">
                      <td className="px-3 py-2 font-medium text-slate-100">{row.nama}</td>
                      <td className="px-3 py-2 text-slate-300">{formatCurrency(row.penghasilan)}</td>
                      <td className="px-3 py-2 text-slate-300">{formatCurrency(row.cicilan)}</td>
                      <td className="px-3 py-2 text-slate-300">{row.rasio.toFixed(1)}%</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                          {row.risiko}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
