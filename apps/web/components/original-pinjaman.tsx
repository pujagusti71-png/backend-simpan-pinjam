"use client"

import { useState } from "react"
import { Eye } from "lucide-react"

type Loan = {
    id: number
    nama: string
    pekerjaan: string
    jumlah: number
    tenor: number
    risiko: string
    rekomendasi: string
}
export type LoanForm = {
    nama: string
    nik: string
    noHp: string
    email: string
    tanggalLahir: string
    alamat: string
    namaIbu: string
    tanggalLahirIbu: string
    alamatIbu: string
    pekerjaan: string
    penghasilan: string
    cicilan: string
    estimasiPengeluaran: string
    riwayat: string
    jumlahLembaga: string
    totalHutangLain: string
    adaTunggakan: string
    jumlahPinjaman: string
    tanggalPinjaman: string
    tenor: string
    bunga: string
    tujuan: string
}

/** Hitung bunga otomatis berdasarkan jumlah pinjaman */
export function hitungBunga(jumlah: number): number {
    if (jumlah < 5_000_000) return 0
    if (jumlah < 10_000_000) return 0.5
    if (jumlah < 15_000_000) return 1
    if (jumlah < 20_000_000) return 1.5
    if (jumlah <= 100_000_000) return 2
    if (jumlah <= 250_000_000) return 2.5
    if (jumlah <= 500_000_000) return 3
    if (jumlah <= 1_000_000_000) return 3.5
    return 4
}

const money = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value)

type LoanDetail = Loan & {
    bunga?: number | string
    tujuan?: string
    tanggalPinjaman?: string
    penghasilan?: number
    estimasiPengeluaran?: number
    cicilan?: number
}

export default function OriginalPinjaman({
    rows,
    onNew,
    onSelect,
    isNewOpen,
    form,
    onFormChange,
    onSubmit,
    onCancel,
    detailRows,
}: {
    rows: Loan[]
    onNew: () => void
    onSelect: (id: number) => void
    isNewOpen: boolean
    form: LoanForm
    onFormChange: (key: keyof LoanForm, value: string) => void
    onSubmit: () => void
    onCancel: () => void
    detailRows?: LoanDetail[]
}) {
    const [risk, setRisk] = useState("Semua Risiko")
    const [statusFilter, setStatusFilter] = useState("Semua Status")
    const [tenorFilter, setTenorFilter] = useState("Semua Tenor")
    const [viewDetail, setViewDetail] = useState<LoanDetail | null>(null)

    const visibleRows = rows.filter((row) => {
        const matchRisk = risk === "Semua Risiko" || row.risiko.toLowerCase() === risk.toLowerCase()
        const matchStatus = statusFilter === "Semua Status" || row.rekomendasi.toLowerCase() === statusFilter.toLowerCase()
        const matchTenor = tenorFilter === "Semua Tenor" || String(row.tenor) === tenorFilter
        return matchRisk && matchStatus && matchTenor
    })

    const exportData = () => {
        const csv = [
            ["Nama", "Pekerjaan", "Jumlah", "Tenor", "Risiko", "Rekomendasi"],
            ...rows.map((row) => [
                row.nama,
                row.pekerjaan,
                String(row.jumlah),
                String(row.tenor),
                row.risiko,
                row.rekomendasi,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n")
        const link = document.createElement("a")
        link.href = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" })
        )
        link.download = "data-pinjaman.csv"
        link.click()
    }

    // Hitung bunga otomatis dari jumlah pinjaman
    const jumlahPinjamanNum = Number(form.jumlahPinjaman) || 0
    const bungaOtomatis = hitungBunga(jumlahPinjamanNum)

    // Hitung estimasi cicilan bulanan
    const tenor = Number(form.tenor) || 0
    const monthlyRate = bungaOtomatis / 100 / 12
    const cicilanEstimasi = tenor > 0 && jumlahPinjamanNum > 0
        ? bungaOtomatis === 0
            ? jumlahPinjamanNum / tenor
            : (jumlahPinjamanNum * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
            (Math.pow(1 + monthlyRate, tenor) - 1)
        : 0
    const totalBayar = cicilanEstimasi * tenor

    return (
        <>
            <main className="min-h-screen overflow-y-auto bg-[#f8f9fa] p-4 sm:p-6 md:p-8 lg:p-10 text-slate-900">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="text-[0.85rem] font-medium text-slate-500">
                            Sistem / Pinjaman
                        </div>
                        <h1 className="my-1 text-2xl font-bold text-[#111]">
                            Kelola Pinjaman
                        </h1>
                        <p className="m-0 text-[0.95rem] text-slate-500">
                            Analisis pengajuan, pantau tunggakan, dan kelola portofolio
                            pinjaman
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={exportData}
                            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Export Data
                        </button>
                        <button
                            type="button"
                            onClick={onNew}
                            className="flex items-center gap-2 rounded-md bg-green-700 px-4 py-2.5 font-semibold text-white hover:bg-green-800 transition-colors"
                        >
                            <span className="text-lg leading-none">+</span> Pengajuan Baru
                        </button>
                    </div>
                </div>
                <section className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                            Periode Pengajuan
                            <input
                                className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                defaultValue="01 Mei 2025 - 31 Mei 2025"
                            />
                        </label>
                        <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                            Status Pinjaman
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                            >
                                <option value="Semua Status">Semua Status</option>
                                <option value="Approve">Approve</option>
                                <option value="Review">Review</option>
                                <option value="Reject">Reject</option>
                            </select>
                        </label>
                        <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                            Tenor
                            <select
                                value={tenorFilter}
                                onChange={(e) => setTenorFilter(e.target.value)}
                                className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                            >
                                <option value="Semua Tenor">Semua Tenor</option>
                                <option value="12">12 Bulan</option>
                                <option value="18">18 Bulan</option>
                                <option value="24">24 Bulan</option>
                            </select>
                        </label>
                        <div className="flex-1">
                            <div className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
                                Tingkat Risiko
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRisk("Semua Risiko")}
                                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ${risk === "Semua Risiko" ? "bg-slate-200 text-slate-800" : "border border-slate-300 bg-white text-slate-500"}`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRisk("Rendah")}
                                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ${risk === "Rendah" ? "bg-emerald-100 text-emerald-800" : "border border-slate-300 bg-white text-slate-500"}`}
                                >
                                    Rendah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRisk("Sedang")}
                                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ${risk === "Sedang" ? "bg-amber-100 text-amber-800" : "border border-slate-300 bg-white text-slate-500"}`}
                                >
                                    Sedang
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRisk("Tinggi")}
                                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ${risk === "Tinggi" ? "bg-red-100 text-red-800" : "border border-slate-300 bg-white text-slate-500"}`}
                                >
                                    Tinggi
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="m-0 text-lg font-bold text-[#111]">
                            Daftar Nasabah Pinjaman
                        </h2>
                        <span className="text-sm text-slate-500">
                            Menampilkan {visibleRows.length} data
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    {[
                                        "ID / Nasabah",
                                        "Pekerjaan",
                                        "Jumlah Pinjaman",
                                        "Tenor",
                                        "Risiko",
                                        "Status Pengajuan",
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
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            Belum ada data pinjaman.
                                        </td>
                                    </tr>
                                ) : visibleRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="border-b border-slate-200 p-4 font-semibold text-slate-900">
                                            {row.nama}
                                            <span className="block text-xs font-normal text-slate-500">
                                                L-{String(row.id).padStart(6, "0")}
                                            </span>
                                        </td>
                                        <td className="border-b border-slate-200 p-4">
                                            {row.pekerjaan}
                                        </td>
                                        <td className="border-b border-slate-200 p-4 font-semibold">
                                            {money(row.jumlah)}
                                        </td>
                                        <td className="border-b border-slate-200 p-4">
                                            {row.tenor} bln
                                        </td>
                                        <td className="border-b border-slate-200 p-4 font-semibold text-emerald-600">
                                            {row.risiko}
                                        </td>
                                        <td className="border-b border-slate-200 p-4">
                                            <span className={`rounded px-2 py-1 text-xs font-semibold ${
                                                row.rekomendasi === 'Approve' ? 'bg-emerald-100 text-emerald-800' :
                                                row.rekomendasi === 'Review' ? 'bg-amber-100 text-amber-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {row.rekomendasi}
                                            </span>
                                        </td>
                                        <td className="border-b border-slate-200 p-4">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                                                onClick={() => {
                                                    const detail = detailRows?.find(d => d.id === row.id) ?? row
                                                    setViewDetail(detail)
                                                }}
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
                </section>
            </main>

            {/* Modal View Detail Pinjaman */}
            {viewDetail && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 py-10">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Detail Pinjaman</h3>
                                <p className="text-xs text-slate-500">L-{String(viewDetail.id).padStart(6, "0")}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                            >
                                <span className="text-lg leading-none">✕</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                                <div>
                                    <span className="text-xs text-slate-400">Nama Nasabah</span>
                                    <p className="font-bold text-slate-900">{viewDetail.nama}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Pekerjaan</span>
                                    <p className="font-semibold text-slate-800">{viewDetail.pekerjaan}</p>
                                </div>
                                {viewDetail.tanggalPinjaman && (
                                    <div>
                                        <span className="text-xs text-slate-400">Tanggal Pinjaman</span>
                                        <p className="font-semibold text-slate-800">{viewDetail.tanggalPinjaman}</p>
                                    </div>
                                )}
                                {viewDetail.tujuan && (
                                    <div>
                                        <span className="text-xs text-slate-400">Tujuan Penggunaan</span>
                                        <p className="font-semibold text-slate-800">{viewDetail.tujuan}</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-slate-100 p-3 text-center">
                                    <span className="text-xs text-slate-400 block">Jumlah Pinjaman</span>
                                    <p className="font-bold text-emerald-700 text-sm mt-1">{money(viewDetail.jumlah)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-3 text-center">
                                    <span className="text-xs text-slate-400 block">Tenor</span>
                                    <p className="font-bold text-slate-900 text-sm mt-1">{viewDetail.tenor} Bulan</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-3 text-center">
                                    <span className="text-xs text-slate-400 block">Bunga</span>
                                    <p className="font-bold text-slate-900 text-sm mt-1">
                                        {Number(viewDetail.bunga) === 0 ? '0%' : `${viewDetail.bunga}%`} / thn
                                    </p>
                                </div>
                            </div>
                            {/* Estimasi Pengeluaran Nasabah */}
                            {(viewDetail.penghasilan !== undefined || viewDetail.cicilan !== undefined || viewDetail.estimasiPengeluaran !== undefined) && (
                                <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estimasi Keuangan Nasabah</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {viewDetail.penghasilan !== undefined && (
                                            <div>
                                                <span className="text-xs text-slate-400">Penghasilan / Bln</span>
                                                <p className="font-semibold text-emerald-700 text-sm">{money(viewDetail.penghasilan)}</p>
                                            </div>
                                        )}
                                        {viewDetail.estimasiPengeluaran !== undefined && (
                                            <div>
                                                <span className="text-xs text-slate-400">Est. Pengeluaran / Bln</span>
                                                <p className="font-semibold text-orange-600 text-sm">{money(viewDetail.estimasiPengeluaran)}</p>
                                            </div>
                                        )}
                                        {viewDetail.cicilan !== undefined && (
                                            <div>
                                                <span className="text-xs text-slate-400">Cicilan Saat Ini</span>
                                                <p className="font-semibold text-slate-900 text-sm">{money(viewDetail.cicilan)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className={`flex-1 rounded-xl p-3 text-center border ${
                                    viewDetail.risiko === 'Rendah' ? 'bg-emerald-50 border-emerald-200' :
                                    viewDetail.risiko === 'Sedang' ? 'bg-amber-50 border-amber-200' :
                                    'bg-red-50 border-red-200'
                                }`}>
                                    <span className="text-xs text-slate-400 block">Risiko</span>
                                    <p className={`font-bold text-sm mt-1 ${
                                        viewDetail.risiko === 'Rendah' ? 'text-emerald-700' :
                                        viewDetail.risiko === 'Sedang' ? 'text-amber-700' :
                                        'text-red-700'
                                    }`}>{viewDetail.risiko}</p>
                                </div>
                                <div className={`flex-1 rounded-xl p-3 text-center border ${
                                    viewDetail.rekomendasi === 'Approve' ? 'bg-emerald-50 border-emerald-200' :
                                    viewDetail.rekomendasi === 'Review' ? 'bg-amber-50 border-amber-200' :
                                    'bg-red-50 border-red-200'
                                }`}>
                                    <span className="text-xs text-slate-400 block">Rekomendasi</span>
                                    <p className={`font-bold text-sm mt-1 ${
                                        viewDetail.rekomendasi === 'Approve' ? 'text-emerald-700' :
                                        viewDetail.rekomendasi === 'Review' ? 'text-amber-700' :
                                        'text-red-700'
                                    }`}>{viewDetail.rekomendasi}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isNewOpen ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-10">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-bold text-slate-900">
                            Pengajuan Pinjaman Baru
                        </h2>
                        {/* Info bunga */}
                        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                            <strong>Tabel Bunga Otomatis:</strong> &lt;5 jt = 0% • 5–10 jt = 0,5% • 10–15 jt = 1% • 15–20 jt = 1,5% • &gt;20 jt = 2%
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault()
                                onSubmit()
                            }}
                            className="space-y-4"
                        >
                            {/* Section: Data Pribadi */}
                            <div>
                                <h3 className="mb-2 text-xs font-bold text-green-800 uppercase tracking-wide">1. Data Pribadi Peminjam</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {([
                                        ["nama", "Nama Lengkap *", "text"],
                                        ["nik", "NIK (16 digit) *", "text"],
                                        ["noHp", "No. HP *", "tel"],
                                        ["email", "Email", "email"],
                                        ["tanggalLahir", "Tanggal Lahir", "date"],
                                        ["alamat", "Alamat Lengkap", "text"],
                                        ["namaIbu", "Nama Ibu Kandung", "text"],
                                        ["tanggalLahirIbu", "Tanggal Lahir Ibu", "date"],
                                        ["alamatIbu", "Alamat Ibu Kandung", "text"],
                                    ] as Array<[keyof LoanForm, string, string]>).map(([key, label, type]) => (
                                        <label key={key} className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                            {label}
                                            <input
                                                type={type}
                                                required={["nama", "nik"].includes(key)}
                                                value={form[key]}
                                                onChange={(e) => onFormChange(key, e.target.value)}
                                                className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Data Finansial */}
                            <div className="border-t border-slate-100 pt-3">
                                <h3 className="mb-2 text-xs font-bold text-green-800 uppercase tracking-wide">2. Data Finansial</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                        Pekerjaan
                                        <select
                                            value={form.pekerjaan || "Wiraswasta"}
                                            onChange={(e) => onFormChange("pekerjaan", e.target.value)}
                                            className="rounded-md border border-slate-300 bg-white p-2.5 text-sm font-normal normal-case"
                                        >
                                            <option value="PNS">PNS / ASN</option>
                                            <option value="TNI/Polri">TNI / Polri</option>
                                            <option value="Pegawai BUMN">Pegawai BUMN</option>
                                            <option value="Karyawan Swasta">Karyawan Swasta</option>
                                            <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                                            <option value="Pedagang">Pedagang / UMKM</option>
                                            <option value="Petani">Petani / Peternak</option>
                                            <option value="Guru">Guru / Dosen</option>
                                            <option value="Tenaga Medis">Tenaga Medis / Perawat</option>
                                            <option value="Buruh Pabrik">Buruh / Karyawan Pabrik</option>
                                            <option value="Driver Ojol">Driver Ojek Online / Sopir</option>
                                            <option value="Pensiunan">Pensiunan</option>
                                            <option value="Profesional">Profesional</option>
                                        </select>
                                    </label>
                                    {([
                                        ["penghasilan", "Penghasilan per Bulan (Rp) *"],
                                        ["cicilan", "Cicilan Berjalan / Bln (Rp)"],
                                        ["estimasiPengeluaran", "Estimasi Pengeluaran / Bln (Rp)"],
                                    ] as Array<[keyof LoanForm, string]>).map(([key, label]) => (
                                        <label key={key} className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                            {label}
                                            <input
                                                type="number"
                                                min="0"
                                                required={key === "penghasilan"}
                                                value={form[key]}
                                                onChange={(e) => onFormChange(key, e.target.value)}
                                                className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Data Pinjaman */}
                            <div className="border-t border-slate-100 pt-3">
                                <h3 className="mb-2 text-xs font-bold text-green-800 uppercase tracking-wide">3. Data Pinjaman</h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                        Tanggal Pinjaman *
                                        <input
                                            type="date"
                                            required
                                            value={form.tanggalPinjaman}
                                            onChange={(e) => onFormChange("tanggalPinjaman", e.target.value)}
                                            className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                        Jumlah Pinjaman (Rp) *
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={form.jumlahPinjaman}
                                            onChange={(e) => onFormChange("jumlahPinjaman", e.target.value)}
                                            className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                        Tenor (Bulan) *
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={form.tenor}
                                            onChange={(e) => onFormChange("tenor", e.target.value)}
                                            className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase">
                                        Bunga per Tahun (Otomatis)
                                        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-100 p-2.5 text-sm font-semibold text-slate-800">
                                            <span>{bungaOtomatis}% per tahun</span>
                                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                Otomatis Sistem
                                            </span>
                                        </div>
                                    </label>
                                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase md:col-span-2">
                                        Tujuan Penggunaan Pinjaman
                                        <input
                                            type="text"
                                            value={form.tujuan}
                                            onChange={(e) => onFormChange("tujuan", e.target.value)}
                                            className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Estimasi Angsuran */}
                            {jumlahPinjamanNum > 0 && tenor > 0 && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="mb-2 text-xs font-bold text-emerald-800 uppercase">Estimasi Angsuran</p>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-xs text-slate-500">Cicilan / Bulan</p>
                                            <p className="text-sm font-bold text-emerald-700">{money(cicilanEstimasi)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Bunga / Thn</p>
                                            <p className="text-sm font-bold text-slate-900">{bungaOtomatis}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Total Bayar</p>
                                            <p className="text-sm font-bold text-slate-900">{money(totalBayar)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-[#128c7e] px-4 py-2 font-semibold text-white"
                                >
                                    Ajukan Pinjaman
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    )
}
