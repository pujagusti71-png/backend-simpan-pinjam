'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Database, ArrowLeftRight, BookOpen, Landmark, TrendingUp } from 'lucide-react'

import { apiFetch } from '@/lib/api'
import OriginalSimpanan from '@/components/original-simpanan'

const actionCards = [
  {
    icon: Database,
    title: 'Data Simpanan',
    description: 'Kelola simpanan nasabah',
    href: '/simpanan/data',
  },
  {
    icon: ArrowLeftRight,
    title: 'Transaksi Simpanan',
    description: 'Catat setoran & penarikan',
    href: '/simpanan/transaksi',
  },
  {
    icon: BookOpen,
    title: 'Buku Tabungan',
    description: 'Lihat riwayat transaksi',
    href: '/simpanan/buku-tabungan',
  },
  {
    icon: Landmark,
    title: 'Deposito',
    description: 'Kelola simpanan berjangka',
    href: '/simpanan/deposito',
  },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function SimpananPage() {
  const [designRows, setDesignRows] = useState<Array<[string, string, string, string, string, string, string, string]>>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [growth, setGrowth] = useState(0)
  const [ldr, setLdr] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        const [nasabah, pinjaman, simpanan] = await Promise.all([
          apiFetch('/nasabah').catch(() => []),
          apiFetch('/pinjaman').catch(() => []),
          apiFetch('/simpanan').catch(() => []),
        ])

        const nasabahList = Array.isArray(nasabah) ? nasabah : []
        const pinjamanList = Array.isArray(pinjaman) ? pinjaman : []
        const simpananList = Array.isArray(simpanan) ? simpanan : []

        const liveRows = simpananList.slice(0, 4).map((item: any, index: number) => {
          const nama = item?.nasabah?.nama ?? item?.nama ?? `Nasabah ${index + 1}`
          const initials = nama.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()
          const saldo = Number(item?.saldoAkhir ?? item?.saldo ?? 0)
          return [initials, nama, item?.nasabah?.statusKeanggotaan ?? 'Anggota', item?.noRekening ?? `SP-${index + 1}`, item?.jenisSimpanan ?? 'Simpanan Sukarela', formatCurrency(saldo), saldo > 0 ? 'AKTIF' : 'TIDAK AKTIF', 'blue'] as [string, string, string, string, string, string, string, string]
        })
        setDesignRows(liveRows)

        const total = simpananList.reduce((sum: number, item: any) => sum + Number(item?.saldoAkhir || 0), 0)
        const deposit = simpananList.reduce((sum: number, item: any) => sum + Number(item?.jumlahSetoran > 0 ? item.jumlahSetoran : 0), 0)
        const withdraw = simpananList.reduce((sum: number, item: any) => sum + Number(item?.jumlahSetoran < 0 ? Math.abs(item.jumlahSetoran) : 0), 0)
        const totalPinjaman = pinjamanList.reduce((sum: number, item: any) => sum + Number(item?.jumlahPinjaman ?? item?.jumlah ?? 0), 0)

        const inactive = nasabahList.filter((item: any) => {
          const riwayat = String(item?.riwayatPembayaran ?? '').toLowerCase()
          const hasTunggakan = Boolean(item?.tunggakan ?? item?.adaTunggakan)
          const risky = ['K3', 'K4', 'K5'].includes(String(item?.slik ?? ''))
          return riwayat.includes('telat') || hasTunggakan || risky
        }).length

        const nextGrowth = deposit > 0 ? Number((((deposit - withdraw) / Math.max(deposit, 1)) * 100).toFixed(1)) : 0
        const nextLdr = total > 0 ? Number(((totalPinjaman / total) * 100).toFixed(1)) : 0

        setTotalBalance(total)
        setGrowth(nextGrowth)
        setLdr(nextLdr)
        setInactiveCount(inactive)
      } catch (error) {
        console.error('Gagal memuat ringkasan simpanan', error)
        setTotalBalance(0)
        setGrowth(0)
        setLdr(0)
        setInactiveCount(0)
      } finally {
        setLoading(false)
      }
    }

    void loadSummary()
  }, [])

  const pieData = useMemo(() => {
    const base = totalBalance || 1
    const data = [
      { name: 'Simpanan Pokok', value: Number(((base * 0.26) / base * 100).toFixed(1)), total: formatCurrency(base * 0.26), color: '#93c5fd' },
      { name: 'Simpanan Wajib', value: Number(((base * 0.3) / base * 100).toFixed(1)), total: formatCurrency(base * 0.3), color: '#0d9488' },
      { name: 'Simpanan Sukarela', value: Number(((base * 0.24) / base * 100).toFixed(1)), total: formatCurrency(base * 0.24), color: '#2dd4bf' },
      { name: 'Deposito/Berjangka', value: Number(((base * 0.2) / base * 100).toFixed(1)), total: formatCurrency(base * 0.2), color: '#e2e8f0' },
    ]

    return data
  }, [totalBalance])

  return <OriginalSimpanan rows={designRows} />

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-10 py-10 text-slate-900">
      <div className="space-y-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Simpanan</h2>
          <p className="mt-2 text-slate-500">Kelola data simpanan dan pantau kesehatan dana</p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
          {actionCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex items-start space-x-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                </div>
              </Link>
            )
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">Komposisi Simpanan</h3>
            {loading ? (
              <div className="py-12 text-center text-slate-500">Memuat data simpanan...</div>
            ) : (
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <div className="relative mx-auto h-80 w-full max-w-[320px] lg:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="90%"
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                        formatter={(value) => [`${value}%`, 'Proporsi']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-slate-900">{formatCurrency(totalBalance)}</span>
                    <span className="text-xs text-slate-500">Total Dana</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">{item.total}</span>
                        <span className="text-xs text-slate-400">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-600">Total Dana Simpanan</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">Kesehatan Dana</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 py-3">
                <div>
                  <p className="text-sm text-slate-600">Loan to Deposit Ratio (LDR)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ldr >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {ldr >= 80 ? 'Waspada' : 'Sehat'}
                  </span>
                  <span className="font-bold text-slate-900">{ldr.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-3">
                <div>
                  <p className="text-sm text-slate-600">Pertumbuhan Dana (Bulan Ini)</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{growth.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-3">
                <p className="text-sm text-slate-600">Nasabah Tidak Aktif</p>
                <span className="font-bold text-slate-900">{inactiveCount}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <p className="text-sm text-slate-600">Proyeksi 3 Bulan ke Depan</p>
                <span className="font-bold text-slate-900">{formatCurrency(totalBalance * 1.08)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
