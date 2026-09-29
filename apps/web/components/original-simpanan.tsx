"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, X } from "lucide-react"

type SavingsRow = [
  string, // 0: initials
  string, // 1: nama
  string, // 2: status keanggotaan
  string, // 3: no rekening
  string, // 4: jenis simpanan
  string, // 5: saldo formatted
  string, // 6: AKTIF / TIDAK AKTIF
  string, // 7: color
]

export default function OriginalSimpanan({
  rows,
}: {
  rows: SavingsRow[]
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Semua Status")
  const [type, setType] = useState("Semua Tipe")
  const [viewRow, setViewRow] = useState<SavingsRow | null>(null)
  const visibleRows = rows.filter(
    (row) =>
      row[1].toLowerCase().includes(query.toLowerCase()) &&
      (status === "Semua Status" || row[6] === status) &&
      (type === "Semua Tipe" || row[4] === type)
  )
  const exportCsv = () => {
    const csv = [
      ["Nasabah", "No. Rekening", "Tipe Simpanan", "Saldo", "Status"],
      ...visibleRows.map((row) => row.slice(1, 7)),
    ]
      .map((row) => row.join(","))
      .join("\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    )
    link.download = "data-simpanan.csv"
    link.click()
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[#f8f9fa] p-4 sm:p-6 md:p-8 lg:p-10 text-slate-900">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-bold text-[#111]">Data Simpanan</h1>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Export Data
        </button>
      </div>
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
            Periode
            <input
              className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
              defaultValue="01 Mei 2025 - 31 Mei 2025"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
            Status Nasabah
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
            >
              <option>Semua Status</option>
              <option>AKTIF</option>
              <option>TIDAK AKTIF</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
            Tipe Simpanan
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
            >
              <option>Semua Tipe</option>
              <option>Simpanan Sukarela</option>
              <option>Simpanan Wajib</option>
              <option>Deposito</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
            Rentang Saldo
            <select className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case">
              <option>Min - Max Saldo</option>
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filter Aktif:</span>
            <span className="rounded-2xl bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
              {status}
            </span>
            <span className="rounded-2xl bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
              {type}
            </span>
            {(status !== "Semua Status" || type !== "Semua Tipe" || query) && (
              <button
                type="button"
                onClick={() => {
                  setStatus("Semua Status")
                  setType("Semua Tipe")
                  setQuery("")
                }}
                className="text-xs text-red-500 hover:underline ml-2"
              >
                Reset Filter
              </button>
            )}
          </div>
          <button
            className="rounded-md bg-green-700 hover:bg-green-800 px-4 py-2 font-semibold text-white shadow-sm transition-all"
            type="button"
            onClick={() => {
              // Filters are applied reactively in visibleRows
            }}
          >
            Terapkan Filter
          </button>
        </div>
      </section>
      <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 text-lg font-bold text-[#111]">
            Daftar Nasabah Simpanan
          </h2>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nasabah..."
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold"
              type="button"
              onClick={exportCsv}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {[
                  "Nasabah",
                  "No. Rekening",
                  "Tipe Simpanan",
                  "Saldo",
                  "Status",
                  "Aksi",
                ].map((head) => (
                  <th
                    key={head}
                    className="border-b border-slate-200 p-3 text-left text-xs font-semibold text-slate-500 uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada data simpanan.
                  </td>
                </tr>
              ) : visibleRows.map((row) => (
                <tr key={row[3]}>
                  <td className="border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${row[7] === "blue" ? "bg-blue-100 text-blue-700" : row[7] === "pink" ? "bg-pink-100 text-pink-700" : row[7] === "yellow" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {row[0]}
                      </div>
                      <div>
                        <b className="block text-slate-900">{row[1]}</b>
                        <span className="text-xs text-slate-500">{row[2]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-slate-200 p-4">{row[3]}</td>
                  <td className="border-b border-slate-200 p-4">
                    <span className="rounded bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                      {row[4]}
                    </span>
                  </td>
                  <td className="border-b border-slate-200 p-4 font-semibold">
                    {row[5]}
                  </td>
                  <td className="border-b border-slate-200 p-4">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${row[6] === "AKTIF" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                    >
                      {row[6]}
                    </span>
                  </td>
                  <td className="border-b border-slate-200 p-4">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                      type="button"
                      onClick={() => setViewRow(row)}
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between pt-5 text-sm text-slate-500">
          Menampilkan {visibleRows.length} data simpanan
        </div>
      </section>

      {/* Modal View Detail Simpanan */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detail Simpanan</h3>
                <p className="text-xs text-slate-500">{viewRow[3]}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
                    viewRow[7] === "blue" ? "bg-blue-100 text-blue-700" :
                    viewRow[7] === "pink" ? "bg-pink-100 text-pink-700" :
                    viewRow[7] === "yellow" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {viewRow[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{viewRow[1]}</p>
                  <p className="text-xs text-slate-500">{viewRow[2]}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">No. Rekening</span>
                  <p className="font-semibold text-slate-900 font-mono text-sm">{viewRow[3]}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Jenis Simpanan</span>
                  <p className="font-semibold text-slate-800">{viewRow[4]}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Saldo</span>
                  <p className="font-bold text-emerald-700">{viewRow[5]}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Status</span>
                  <span
                    className={`inline-block mt-1 rounded px-2 py-0.5 text-xs font-semibold ${
                      viewRow[6] === "AKTIF" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {viewRow[6]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/simpanan/data?rekening=${encodeURIComponent(viewRow[3])}`
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Lihat Buku Tabungan
              </button>
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
