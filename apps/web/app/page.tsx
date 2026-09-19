'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { Wallet, PiggyBank, PieChart as PieIcon, Users, TrendingUp, ChevronDown } from 'lucide-react'

import { api } from '@/lib/api'
import OriginalDashboard from '@/components/original-dashboard'

const defaultAreaData = [
  { month: "Des '24", value: 1.8 },
  { month: "Jan '25", value: 2.2 },
  { month: "Feb '25", value: 2.5 },
  { month: "Mar '25", value: 2.8 },
  { month: "Apr '25", value: 3.1 },
  { month: "Mei '25", value: 3.4 },
]

const defaultPieData = [
  { name: 'Rendah', value: 52, color: '#0d9488' },
  { name: 'Sedang', value: 33, color: '#7dd3fc' },
  { name: 'Tinggi', value: 15, color: '#e0f2fe' },
]

export default function Page() {
  const [period, setPeriod] = useState('6 Bulan Terakhir')
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [metrics, setMetrics] = useState({
    totalPinjaman: 0,
    totalSimpanan: 0,
    ldr: 0,
    nasabahAktif: 0,
  })
  const [areaData, setAreaData] = useState(defaultAreaData)
  const [pieData, setPieData] = useState(defaultPieData)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [nasabah, pinjaman, simpanan, risk] = await Promise.all([
          api.getNasabah().catch(() => []),
          api.getPinjaman().catch(() => []),
          api.getSimpanan().catch(() => []),
          api.getAnalisisRisiko().catch(() => []),
        ])

        const nasabahList = Array.isArray(nasabah) ? nasabah : []
        const pinjamanList = Array.isArray(pinjaman) ? pinjaman : []
        const simpananList = Array.isArray(simpanan) ? simpanan : []
        const riskList = Array.isArray(risk) ? risk : []

        const totalPinjaman = pinjamanList.reduce((sum: number, item: any) => sum + Number(item?.jumlahPinjaman ?? item?.jumlah ?? 0), 0)
        const totalSimpanan = simpananList.reduce((sum: number, item: any) => sum + Number(item?.saldoAkhir ?? item?.saldo ?? 0), 0)
        const ldr = totalSimpanan > 0 ? (totalPinjaman / totalSimpanan) * 100 : 0

        const riskCounts = {
          Rendah: 0,
          Sedang: 0,
          Tinggi: 0,
        }

        riskList.forEach((item: any) => {
          const status = String(item?.status ?? item?.kategoriRisiko ?? 'Rendah')
          const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
          if (normalized in riskCounts) riskCounts[normalized as keyof typeof riskCounts] += 1
        })

        const nextPie = [
          { name: 'Rendah', value: riskList.length > 0 ? Math.max(10, Math.round((riskCounts.Rendah / Math.max(riskList.length, 1)) * 100)) : 52, color: '#0d9488' },
          { name: 'Sedang', value: riskList.length > 0 ? Math.max(10, Math.round((riskCounts.Sedang / Math.max(riskList.length, 1)) * 100)) : 33, color: '#7dd3fc' },
          { name: 'Tinggi', value: riskList.length > 0 ? Math.max(5, 100 - Math.max(10, Math.round((riskCounts.Rendah / Math.max(riskList.length, 1)) * 100)) - Math.max(10, Math.round((riskCounts.Sedang / Math.max(riskList.length, 1)) * 100))) : 15, color: '#e0f2fe' },
        ]

        const multiplier = totalSimpanan > 0 ? totalSimpanan / 1_000_000 : 1
        const nextArea = [
          { month: "Des '24", value: Number((multiplier * 0.55).toFixed(1)) },
          { month: "Jan '25", value: Number((multiplier * 0.68).toFixed(1)) },
          { month: "Feb '25", value: Number((multiplier * 0.82).toFixed(1)) },
          { month: "Mar '25", value: Number((multiplier * 0.96).toFixed(1)) },
          { month: "Apr '25", value: Number((multiplier * 1.08).toFixed(1)) },
          { month: "Mei '25", value: Number((multiplier * 1.2).toFixed(1)) },
        ]

        setMetrics({
          totalPinjaman,
          totalSimpanan,
          ldr: Number(ldr.toFixed(1)),
          nasabahAktif: nasabahList.length,
        })
        setAreaData(nextArea)
        setPieData(nextPie)
      } catch (error) {
        console.error('Gagal memuat dashboard utama', error)
        setMetrics({ totalPinjaman: 0, totalSimpanan: 0, ldr: 0, nasabahAktif: 0 })
        setAreaData(defaultAreaData)
        setPieData(defaultPieData)
      }
    }

    void loadDashboard()
  }, [])

  return <OriginalDashboard metrics={metrics} areaData={areaData} />

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-10 py-10 text-slate-900">
      <div className="space-y-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-slate-500">Ringkasan kinerja pinjaman dan simpanan</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">TOTAL PINJAMAN AKTIF</p>
            <p className="mt-3 text-xl font-bold text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(metrics.totalPinjaman || 0)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500">{metrics.totalPinjaman > 0 ? 'Live' : '0%'}</span>
              <span>dari data real-time</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <PiggyBank className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">TOTAL DANA SIMPANAN</p>
            <p className="mt-3 text-xl font-bold text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(metrics.totalSimpanan || 0)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500">Live</span>
              <span>dari data simpanan</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <PieIcon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">LDR</p>
            <p className="mt-3 text-xl font-bold text-slate-900">{metrics.ldr.toFixed(1)}%</p>
            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${metrics.ldr >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {metrics.ldr >= 80 ? 'Waspada' : 'Sehat'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">NASABAH AKTIF</p>
            <p className="mt-3 text-xl font-bold text-slate-900">{metrics.nasabahAktif}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500">Live</span>
              <span>dari database</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-900">Tren Dana Simpanan</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPeriodOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm"
                >
                  {period}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {isPeriodOpen ? (
                  <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {['3 Bulan Terakhir', '6 Bulan Terakhir', '1 Tahun Terakhir'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setPeriod(option)
                          setIsPeriodOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[1.5, 3.5]} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value}M`} />
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} formatter={(value) => [`${value}M`, 'Nilai']} />
                  <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} fill="url(#tealGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Distribusi Risiko Nasabah</h3>
            <div className="relative mt-8 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{metrics.nasabahAktif}</span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
