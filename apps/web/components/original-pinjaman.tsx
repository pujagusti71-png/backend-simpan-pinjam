"use client"

import { useState } from "react"

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
    noRekening: string
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
    riwayat: string
    slik: string
    jumlahLembaga: string
    totalHutangLain: string
    adaTunggakan: string
    catatan: string
    jumlahPinjaman: string
    tenor: string
    bunga: string
    tujuan: string
}
const money = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value)

export default function OriginalPinjaman({
    rows,
    onNew,
    onSelect,
    isNewOpen,
    form,
    onFormChange,
    onSubmit,
    onCancel,
}: {
    rows: Loan[]
    onNew: () => void
    onSelect: (id: number) => void
    isNewOpen: boolean
    form: LoanForm
    onFormChange: (key: keyof LoanForm, value: string) => void
    onSubmit: () => void
    onCancel: () => void
}) {
    const [risk, setRisk] = useState("Semua Risiko")
    const visibleRows = rows.filter(
        (row) => risk === "Semua Risiko" || row.risiko.toLowerCase() === risk.toLowerCase()
    )
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
    return (
        <>
            <main className="min-h-screen overflow-y-auto bg-[#f8f9fa] p-10 text-slate-900">
                <div className="mb-[30px] flex items-start justify-between gap-4">
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
                            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700"
                        >
                            Export Data
                        </button>
                        <button
                            type="button"
                            onClick={onNew}
                            className="rounded-md bg-[#128c7e] px-4 py-2.5 font-semibold text-white"
                        >
                            + Pengajuan Baru
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
                            <select className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case">
                                <option>Semua Status</option>
                            </select>
                        </label>
                        <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                            Tenor
                            <select className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case">
                                <option>Semua Tenor</option>
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
                                {visibleRows.slice(0, 5).map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onSelect(row.id)}
                                        className="cursor-pointer hover:bg-slate-50"
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
                                            <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                                                {row.rekomendasi}
                                            </span>
                                        </td>
                                        <td className="border-b border-slate-200 p-4">
                                            <button
                                                type="button"
                                                className="border-0 bg-transparent text-lg"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    onSelect(row.id)
                                                }}
                                            >
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
            {isNewOpen ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-10">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            onSubmit()
                        }}
                        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                    >
                        <h2 className="mb-6 text-lg font-bold text-slate-900">
                            Pengajuan Pinjaman Baru
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {(
                                [
                                    ["nama", "Nama Lengkap"],
                                    ["nik", "NIK (16 digit)"],
                                    ["noRekening", "No. Rekening"],
                                    ["noHp", "No. HP"],
                                    ["email", "Email"],
                                    ["tanggalLahir", "Tanggal Lahir"],
                                    ["alamat", "Alamat"],
                                    ["namaIbu", "Nama Ibu Kandung"],
                                    ["tanggalLahirIbu", "Tanggal Lahir Ibu"],
                                    ["alamatIbu", "Alamat Ibu Kandung"],
                                    ["penghasilan", "Penghasilan per Bulan"],
                                    ["cicilan", "Cicilan per Bulan"],
                                    ["jumlahLembaga", "Hutang di Berapa Tempat"],
                                    ["totalHutangLain", "Total Hutang di Tempat Lain"],
                                    ["jumlahPinjaman", "Jumlah Pinjaman"],
                                    ["bunga", "Bunga per Tahun %"],
                                    ["tujuan", "Tujuan Pinjaman"],
                                ] as Array<[keyof LoanForm, string]>
                            ).map(([key, label]) => (
                                <label
                                    key={key}
                                    className="flex flex-col gap-1 text-xs font-semibold text-slate-500 uppercase"
                                >
                                    {label}
                                    <input
                                        required={["nama", "jumlahPinjaman"].includes(key)}
                                        value={form[key]}
                                        onChange={(event) => onFormChange(key, event.target.value)}
                                        className="rounded-md border border-slate-300 p-2.5 text-sm font-normal normal-case"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
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
            ) : null}
        </>
    )
}
