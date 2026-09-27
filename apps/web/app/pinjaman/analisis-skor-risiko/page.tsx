"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"

import { api } from "@/lib/api"

type RiskItem = {
  id: number
  nasabahId: number
  namaNasabah: string
  nik: string
  pekerjaan: string
  penghasilan: number
  status: string
  totalSkor: number
  kategoriRisiko: string
  rasioCicilan: number
  persentaseKeterlambatan: number
  frekuensiPinjaman: number
  penjumlahPeminjamanAktif: number
  indikasiBehaviorBerisiko: string | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0)

const getStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase() || ""

  if (normalized === "approve") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
  }

  if (normalized === "review") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
  }

  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
}

const getStatusLabel = (status: string) => {
  const normalized = status?.toLowerCase() || ""
  if (normalized === "approve") return "Approve"
  if (normalized === "review") return "Review"
  if (normalized === "reject") return "Reject"
  return status || "-"
}

export default function AnalisisSkorRisikoPage() {
  const [items, setItems] = useState<RiskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recomputing, setRecomputing] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await api.getAnalisisRisiko()
      const rows = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id ?? Date.now(),
            nasabahId: item.nasabahId ?? 0,
            namaNasabah: item.namaNasabah ?? item.nama ?? "Nasabah",
            nik: item.nik ?? "-",
            pekerjaan: item.pekerjaan ?? "Tidak diketahui",
            penghasilan: Number(item.penghasilan ?? 0),
            status: item.status ?? "review",
            totalSkor: Number(item.totalSkor ?? 0),
            kategoriRisiko: item.kategoriRisiko ?? "sedang",
            rasioCicilan: Number(item.rasioCicilan ?? 0),
            persentaseKeterlambatan: Number(item.persentaseKeterlambatan ?? 0),
            frekuensiPinjaman: Number(item.frekuensiPinjaman ?? 0),
            penjumlahPeminjamanAktif: Number(item.penjumlahPeminjamanAktif ?? 0),
            indikasiBehaviorBerisiko: item.indikasiBehaviorBerisiko ?? null,
          }))
        : []

      setItems(rows)
    } catch (loadError) {
      console.error("Gagal memuat analisis risiko", loadError)
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat analisis risiko."
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleRecomputeAll = async () => {
    try {
      setRecomputing(true)
      await api.recomputeAnalisisRisiko()
      await loadData()
    } catch (recomputeError) {
      console.error("Gagal menghitung ulang skor risiko", recomputeError)
    } finally {
      setRecomputing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Analisis & Skor Risiko
            </h2>
            <p className="mt-2 text-slate-500">
              Skor risiko komposit (rasio cicilan, riwayat pembayaran, SLIK,
              stabilitas keuangan, perilaku pinjaman) dan rekomendasi
              keputusan otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecomputeAll}
              disabled={recomputing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {recomputing ? "Menghitung..." : "Hitung Ulang Semua"}
            </button>
            <Link
              href="/pinjaman"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              Memuat data analisis risiko...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-lg text-slate-600">
                Belum ada data analisis risiko yang tersedia. Klik &quot;Hitung
                Ulang Semua&quot; setelah ada data nasabah &amp; pinjaman.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-900">
                        {item.namaNasabah}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.pekerjaan} • {formatCurrency(item.penghasilan)}
                        /bulan • NIK {item.nik}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">Total skor</span>
                      <span className="text-2xl font-black text-slate-900">
                        {item.totalSkor}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Rasio Cicilan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.rasioCicilan.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Keterlambatan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.persentaseKeterlambatan.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Frekuensi Pinjaman (30 hari)
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.frekuensiPinjaman}x
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Pinjaman Aktif Bersamaan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.penjumlahPeminjamanAktif}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Kategori risiko: {item.kategoriRisiko}
                    </span>
                    {item.indikasiBehaviorBerisiko ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        {item.indikasiBehaviorBerisiko}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
