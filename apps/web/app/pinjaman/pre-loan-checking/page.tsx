"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, CircleAlert, SearchCheck } from "lucide-react"

import { api } from "@/lib/api"

type CheckingItem = {
  id: number
  nasabahId: number
  nama: string
  pekerjaan: string
  penghasilan: number
  rasio: number
  persentaseKeterlambatan: number
  totalSkor: number
  risk: "Layak" | "Review" | "Bermasalah"
  insight: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0)

// Pre-loan checking = cek kelayakan awal SEBELUM pinjaman disetujui, memakai
// rasio cicilan, riwayat pembayaran, dan hasil Risk Scoring Engine
// (/analisis-risiko) yang sudah menggabungkan data SLIK & perilaku pinjaman.
export default function PreLoanCheckingPage() {
  const [items, setItems] = useState<CheckingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await api.getAnalisisRisiko()
        const rows = Array.isArray(data)
          ? data.map((item: any) => {
              const rasio = Number(item.rasioCicilan ?? 0)
              const persentaseKeterlambatan = Number(item.persentaseKeterlambatan ?? 0)
              const totalSkor = Number(item.totalSkor ?? 0)
              const status = (item.status ?? "review").toLowerCase()

              let risk: CheckingItem["risk"] = "Layak"
              let insight = "Rasio cicilan dan riwayat pembayaran masih aman."

              if (status === "reject") {
                risk = "Bermasalah"
                insight =
                  "Skor risiko tinggi — rasio cicilan, riwayat pembayaran, dan/atau data SLIK menunjukkan potensi gagal bayar."
              } else if (status === "review") {
                risk = "Review"
                insight = "Perlu verifikasi tambahan sebelum approval (skor risiko sedang)."
              }

              return {
                id: item.id ?? item.nasabahId ?? Date.now(),
                nasabahId: item.nasabahId ?? 0,
                nama: item.namaNasabah ?? "Nasabah",
                pekerjaan: item.pekerjaan ?? "Tidak diketahui",
                penghasilan: Number(item.penghasilan ?? 0),
                rasio,
                persentaseKeterlambatan,
                totalSkor,
                risk,
                insight,
              }
            })
          : []

        setItems(rows)
      } catch (loadError) {
        console.error("Gagal memuat data pre-loan checking", loadError)
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat data pre-loan checking."
        )
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const summary = useMemo(() => {
    const total = items.length
    const layak = items.filter((item) => item.risk === "Layak").length
    const review = items.filter((item) => item.risk === "Review").length
    const bermasalah = items.filter((item) => item.risk === "Bermasalah").length

    return { total, layak, review, bermasalah }
  }, [items])

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Pre-Loan Checking
            </h2>
            <p className="mt-2 text-slate-500">
              Cek kelayakan awal sebelum pengajuan, berdasarkan skor risiko
              komposit terbaru.
            </p>
          </div>
          <Link
            href="/pinjaman"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-sm text-emerald-700">Layak</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {summary.layak}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm text-amber-700">Review</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {summary.review}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <p className="text-sm text-rose-700">Bermasalah</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">
              {summary.bermasalah}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              Memuat data kelayakan nasabah...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <SearchCheck className="h-6 w-6" />
              </div>
              <p className="text-lg text-slate-600">
                Belum ada data nasabah untuk dicek kelayakan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {item.nama}
                      </p>
                      <p className="text-sm text-slate-500">{item.pekerjaan}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.risk === "Layak"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.risk === "Review"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.risk}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Penghasilan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatCurrency(item.penghasilan)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Rasio Cicilan
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.rasio.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">Keterlambatan</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.persentaseKeterlambatan.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400 uppercase">
                        Skor Risiko
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.totalSkor}/100
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-lg bg-white p-3 text-sm text-slate-600">
                    {item.risk === "Bermasalah" ? (
                      <CircleAlert className="mt-0.5 h-4 w-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    )}
                    <span>{item.insight}</span>
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
