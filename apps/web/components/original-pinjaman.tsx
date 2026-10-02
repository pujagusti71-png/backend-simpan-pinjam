"use client"

import { useState } from "react"
import { Eye, Banknote, CheckCircle2, Clock, Calendar, Check, AlertCircle, Info, Sparkles } from "lucide-react"
import { api } from "@/lib/api"

export type PaymentRecord = {
    id: number
    nomorCicilan?: number
    jumlahPokok?: number
    jumlahBunga?: number
    jumlahBayar: number
    tanggalPembayaran?: string
    tanggalBayar?: string
    statusBayar?: string
}

export type Loan = {
    id: number
    nama: string
    pekerjaan: string
    jumlah: number
    tenor: number
    risiko: string
    rekomendasi: string
    status?: string
    pembayaran?: PaymentRecord[]
    paidCount?: number
    isLunas?: boolean
    cicilanBulanan?: number
    totalPembayaran?: number
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
    }).format(value || 0)

export type LoanDetail = Loan & {
    nik?: string
    hp?: string
    email?: string
    alamat?: string
    bunga?: number | string
    tujuan?: string
    tanggalPinjaman?: string
    penghasilan?: number
    estimasiPengeluaran?: number
    cicilan?: number
    cicilanBulanan?: number
    totalPembayaran?: number
    totalPaid?: number
    paidCount?: number
    isLunas?: boolean
    pembayaran?: PaymentRecord[]
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
    onPaymentSuccess,
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
    onPaymentSuccess?: () => void | Promise<void>
}) {
    const [risk, setRisk] = useState("Semua Risiko")
    const [statusFilter, setStatusFilter] = useState("Semua Status")
    const [tenorFilter, setTenorFilter] = useState("Semua Tenor")
    const [viewDetail, setViewDetail] = useState<LoanDetail | null>(null)
    const [payModalLoan, setPayModalLoan] = useState<LoanDetail | null>(null)
    const [payAmount, setPayAmount] = useState<string>('')
    const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0] ?? '')
    const [payStatus, setPayStatus] = useState<string>('lancar')
    const [paySubmitting, setPaySubmitting] = useState<boolean>(false)
    const [payError, setPayError] = useState<string | null>(null)

    const openPayModal = (loan: LoanDetail) => {
        setPayModalLoan(loan)
        const tenor = loan.tenor || 12
        const defaultAmount = loan.cicilanBulanan && loan.cicilanBulanan > 0
            ? Math.round(loan.cicilanBulanan)
            : Math.round(loan.jumlah / tenor)
        setPayAmount(String(defaultAmount))
        setPayDate(new Date().toISOString().split('T')[0] ?? '')
        setPayStatus('lancar')
        setPayError(null)
    }

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!payModalLoan) return

        const amount = Number(payAmount)
        if (!amount || amount <= 0) {
            setPayError('Nominal pembayaran cicilan harus lebih dari 0.')
            return
        }

        const paidCount = payModalLoan.paidCount ?? payModalLoan.pembayaran?.length ?? 0
        const nextNomor = paidCount + 1
        const tenor = payModalLoan.tenor || 12

        setPaySubmitting(true)
        setPayError(null)

        try {
            await api.createPembayaran({
                pinjamanId: payModalLoan.id,
                jumlahBayar: amount,
                nomorCicilan: nextNomor,
                tanggalBayar: new Date(`${payDate}T00:00:00`).toISOString(),
                statusBayar: payStatus,
            })

            const isNowDone = nextNomor >= tenor
            alert(
                `Pembayaran cicilan ke-${nextNomor} dari ${tenor} bulan berhasil dicatat!` +
                (isNowDone ? '\n\nSELAMAT! Seluruh cicilan telah genap dibayar (LUNAS - DONE)!' : '')
            )

            setPayModalLoan(null)
            if (viewDetail && viewDetail.id === payModalLoan.id) {
                setViewDetail(null)
            }
            if (onPaymentSuccess) {
                await onPaymentSuccess()
            }
        } catch (err: any) {
            console.error('Gagal mencatat pembayaran:', err)
            setPayError(err.message || 'Gagal mencatat pembayaran cicilan.')
        } finally {
            setPaySubmitting(false)
        }
    }

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
                                        "Cicilan Terbayar",
                                        "Status Pinjaman",
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
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            Belum ada data pinjaman.
                                        </td>
                                    </tr>
                                ) : visibleRows.map((row) => {
                                    const paidCount = row.paidCount ?? row.pembayaran?.length ?? 0
                                    const tenor = row.tenor || 12
                                    const isDone = row.isLunas || row.status === 'lunas' || row.status === 'completed' || (tenor > 0 && paidCount >= tenor)
                                    const percent = Math.min(100, Math.round((paidCount / tenor) * 100))

                                    return (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="border-b border-slate-200 p-4 font-semibold text-slate-900">
                                                {row.nama}
                                                <span className="block text-xs font-normal text-slate-500">
                                                    L-{String(row.id).padStart(6, "0")}
                                                </span>
                                            </td>
                                            <td className="border-b border-slate-200 p-4 text-slate-700">
                                                {row.pekerjaan}
                                            </td>
                                            <td className="border-b border-slate-200 p-4 font-semibold text-slate-900">
                                                {money(row.jumlah)}
                                            </td>
                                            <td className="border-b border-slate-200 p-4 text-slate-700">
                                                {row.tenor} bln
                                            </td>
                                            <td className="border-b border-slate-200 p-4">
                                                <div className="flex flex-col gap-1 min-w-[110px]">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-800">{paidCount} / {tenor}</span>
                                                        <span className="text-[11px] font-semibold text-slate-500">{percent}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-600' : 'bg-sky-600'}`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">
                                                        {isDone ? 'Lunas seluruh cicilan' : `Sisa ${Math.max(0, tenor - paidCount)} cicilan`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-200 p-4">
                                                {isDone ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                        DONE (Lunas)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                        <Clock className="h-3 w-3 text-blue-500" />
                                                        Cicilan ke-{paidCount + 1}
                                                    </span>
                                                )}
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
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                                                        onClick={() => {
                                                            const detail = detailRows?.find(d => d.id === row.id) ?? row
                                                            setViewDetail(detail)
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                                                        Detail
                                                    </button>
                                                    {!isDone ? (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                                            onClick={() => {
                                                                const detail = detailRows?.find(d => d.id === row.id) ?? row
                                                                openPayModal(detail)
                                                            }}
                                                            title={`Bayar cicilan ke-${paidCount + 1} dari ${tenor}`}
                                                        >
                                                            <Banknote className="h-3.5 w-3.5" />
                                                            Bayar Cicilan
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            Lunas
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Modal View Detail Pinjaman */}
            {viewDetail && (() => {
                const detailPaidCount = viewDetail.paidCount ?? viewDetail.pembayaran?.length ?? 0
                const detailTenor = viewDetail.tenor || 12
                const detailIsDone = viewDetail.isLunas || viewDetail.status === 'lunas' || viewDetail.status === 'completed' || (detailTenor > 0 && detailPaidCount >= detailTenor)
                const detailPercent = Math.min(100, Math.round((detailPaidCount / detailTenor) * 100))
                const detailCicilanBulanan = viewDetail.cicilanBulanan || (viewDetail.jumlah ? Math.round(viewDetail.jumlah / detailTenor) : 0)
                const detailTotalKewajiban = viewDetail.totalPembayaran || (detailCicilanBulanan * detailTenor) || viewDetail.jumlah
                const detailTotalPaid = viewDetail.totalPaid ?? (viewDetail.pembayaran?.reduce((acc, p) => acc + Number(p.jumlahBayar || 0), 0) ?? (detailPaidCount * detailCicilanBulanan))
                const detailSisa = Math.max(0, detailTotalKewajiban - detailTotalPaid)
                const paymentRecords = Array.isArray(viewDetail.pembayaran) ? viewDetail.pembayaran : []

                return (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-xs">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900">Detail Pinjaman</h3>
                                        {detailIsDone ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                DONE (LUNAS)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                                Cicilan ke-{detailPaidCount + 1} dari {detailTenor}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">ID Berkas: L-{String(viewDetail.id).padStart(6, "0")}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewDetail(null)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                                >
                                    <span className="text-lg leading-none">✕</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Banner Status Pelunasan */}
                                {detailIsDone ? (
                                    <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4 flex items-center gap-3 text-emerald-950">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-2xl shadow-sm">
                                            ✓
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-base text-emerald-900">PINJAMAN SUDAH LUNAS (DONE)</h4>
                                                <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                                    Selesai 100%
                                                </span>
                                            </div>
                                            <p className="text-xs text-emerald-800 mt-0.5">
                                                Nasabah telah membayar sebanyak {detailPaidCount} dari {detailTenor} kali cicilan. Seluruh kewajiban pembayaran pinjaman ini telah terpenuhi secara tuntas.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4 flex items-center gap-3 text-sky-950">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-lg shadow-sm">
                                            {detailPaidCount + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-sky-900">Pinjaman Aktif (Sedang Berjalan)</h4>
                                                <span className="rounded-full bg-sky-600 text-white text-[11px] font-bold px-2.5 py-0.5">
                                                    Cicilan ke-{detailPaidCount + 1} dari {detailTenor}
                                                </span>
                                            </div>
                                            <p className="text-xs text-sky-800 mt-0.5">
                                                Sudah membayar {detailPaidCount} kali cicilan. Tersisa {Math.max(0, detailTenor - detailPaidCount)} bulan lagi sampai lunas.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Identifikasi & Progres Cicilan */}
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            <Clock className="h-4 w-4 text-sky-600" />
                                            Identifikasi Pembayaran Cicilan
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${detailIsDone ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                                            {detailIsDone ? 'LUNAS (DONE)' : `Cicilan Berjalan: ke-${detailPaidCount + 1} / ${detailTenor}`}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-600">Progres Pembayaran Cicilan:</span>
                                            <span className="font-bold text-slate-900">{detailPaidCount} dari {detailTenor} kali ({detailPercent}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${detailIsDone ? 'bg-emerald-600' : 'bg-gradient-to-r from-sky-500 to-emerald-500'}`}
                                                style={{ width: `${detailPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stat Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                        <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                                            <span className="text-[11px] text-slate-500 block">Sudah Dibayar</span>
                                            <span className="text-sm font-bold text-slate-900">{detailPaidCount}x</span>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                                            <span className="text-[11px] text-slate-500 block">Sisa Cicilan</span>
                                            <span className={`text-sm font-bold ${detailIsDone ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {Math.max(0, detailTenor - detailPaidCount)}x
                                            </span>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                                            <span className="text-[11px] text-slate-500 block">Total Terbayar</span>
                                            <span className="text-xs font-bold text-emerald-700 block truncate" title={money(detailTotalPaid)}>
                                                {money(detailTotalPaid)}
                                            </span>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                                            <span className="text-[11px] text-slate-500 block">Sisa Kewajiban</span>
                                            <span className="text-xs font-bold text-rose-600 block truncate" title={money(detailSisa)}>
                                                {money(detailSisa)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Nasabah & Pinjaman */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
                                    <div>
                                        <span className="text-xs text-slate-400">Nama Nasabah</span>
                                        <p className="font-bold text-slate-900">{viewDetail.nama}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400">Pekerjaan</span>
                                        <p className="font-semibold text-slate-800">{viewDetail.pekerjaan}</p>
                                    </div>
                                    {viewDetail.nik && (
                                        <div>
                                            <span className="text-xs text-slate-400">NIK</span>
                                            <p className="font-semibold text-slate-800">{viewDetail.nik}</p>
                                        </div>
                                    )}
                                    {viewDetail.tanggalPinjaman && (
                                        <div>
                                            <span className="text-xs text-slate-400">Tanggal Pengajuan</span>
                                            <p className="font-semibold text-slate-800">{viewDetail.tanggalPinjaman}</p>
                                        </div>
                                    )}
                                    {viewDetail.tujuan && (
                                        <div className="sm:col-span-2">
                                            <span className="text-xs text-slate-400">Tujuan Pinjaman</span>
                                            <p className="font-semibold text-slate-800">{viewDetail.tujuan}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Ringkasan Nilai Pinjaman */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-slate-200 p-3 text-center bg-white shadow-xs">
                                        <span className="text-xs text-slate-400 block">Jumlah Pinjaman</span>
                                        <p className="font-bold text-emerald-700 text-sm mt-1">{money(viewDetail.jumlah)}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-3 text-center bg-white shadow-xs">
                                        <span className="text-xs text-slate-400 block">Tenor</span>
                                        <p className="font-bold text-slate-900 text-sm mt-1">{detailTenor} Bulan</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-3 text-center bg-white shadow-xs">
                                        <span className="text-xs text-slate-400 block">Cicilan / Bulan</span>
                                        <p className="font-bold text-slate-900 text-sm mt-1">
                                            {money(detailCicilanBulanan)}
                                        </p>
                                    </div>
                                </div>

                                {/* Riwayat Pembayaran Cicilan */}
                                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            Riwayat Setoran Cicilan ({paymentRecords.length} Transaksi)
                                        </h4>
                                        <span className="text-xs text-slate-500">
                                            {paymentRecords.length > 0 ? `${paymentRecords.length} kali dibayar` : 'Belum ada pembayaran'}
                                        </span>
                                    </div>

                                    {paymentRecords.length === 0 ? (
                                        <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500 border border-slate-100">
                                            Belum ada catatan setoran cicilan untuk pinjaman ini.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto max-h-48 overflow-y-auto">
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                                        <th className="p-2">Cicilan Ke-</th>
                                                        <th className="p-2">Tanggal Bayar</th>
                                                        <th className="p-2">Jumlah</th>
                                                        <th className="p-2">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentRecords.map((pay, pIdx) => {
                                                        const cicilanNum = pay.nomorCicilan ?? (pIdx + 1)
                                                        const isTelat = pay.statusBayar?.toLowerCase() === 'telat'
                                                        return (
                                                            <tr key={pay.id ?? pIdx} className="border-b border-slate-100 hover:bg-slate-50">
                                                                <td className="p-2 font-bold text-slate-800">
                                                                    Cicilan ke-{cicilanNum}
                                                                </td>
                                                                <td className="p-2 text-slate-600">
                                                                    {pay.tanggalBayar || pay.tanggalPembayaran
                                                                        ? new Date(pay.tanggalBayar || pay.tanggalPembayaran || '').toLocaleDateString('id-ID', {
                                                                              day: '2-digit',
                                                                              month: 'short',
                                                                              year: 'numeric',
                                                                          })
                                                                        : '-'}
                                                                </td>
                                                                <td className="p-2 font-semibold text-emerald-700">
                                                                    {money(pay.jumlahBayar)}
                                                                </td>
                                                                <td className="p-2">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        isTelat ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                                    }`}>
                                                                        {isTelat ? 'Telat' : 'Lancar'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
                                <div>
                                    {detailIsDone ? (
                                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Pinjaman telah Lunas (Done)
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-500">
                                            Cicilan selanjutnya: <strong className="text-slate-800">Ke-{detailPaidCount + 1} dari {detailTenor}</strong>
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewDetail(null)}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                                    >
                                        Tutup
                                    </button>
                                    {!detailIsDone && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = viewDetail
                                                setViewDetail(null)
                                                openPayModal(target)
                                            }}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                                        >
                                            <Banknote className="h-4 w-4" />
                                            Bayar Cicilan ke-{detailPaidCount + 1}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Modal Bayar Cicilan Otomatis */}
            {payModalLoan && (() => {
                const paidCount = payModalLoan.paidCount ?? payModalLoan.pembayaran?.length ?? 0
                const nextNomor = paidCount + 1
                const tenor = payModalLoan.tenor || 12
                const isLast = nextNomor === tenor

                return (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 px-4 py-10 backdrop-blur-xs">
                        <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Bayar Cicilan Pinjaman</h3>
                                    <p className="text-xs text-slate-500">
                                        {payModalLoan.nama} (ID: L-{String(payModalLoan.id).padStart(6, "0")})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPayModalLoan(null)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                                >
                                    <span className="text-lg leading-none">✕</span>
                                </button>
                            </div>

                            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                                {/* Banner Identifikasi Cicilan Otomatis */}
                                <div className="rounded-xl border border-sky-300 bg-sky-50/90 p-4 text-sky-950">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                                            Identifikasi Angsuran Otomatis
                                        </span>
                                        <span className="rounded-full bg-sky-600 px-3 py-0.5 text-xs font-extrabold text-white shadow-xs">
                                            Cicilan ke-{nextNomor} dari {tenor}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm font-semibold text-sky-950">
                                        Ini adalah pembayaran untuk <strong className="text-sky-900 underline underline-offset-2">cicilan yang ke-{nextNomor}</strong>.
                                    </p>
                                    <p className="text-xs text-sky-800 mt-0.5">
                                        Nasabah telah membayar sebanyak {paidCount} kali cicilan sebelumnya.
                                    </p>

                                    {isLast && (
                                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100/90 border border-emerald-300 p-2.5 text-xs font-bold text-emerald-900">
                                            <Sparkles className="h-4 w-4 shrink-0 text-emerald-700" />
                                            <span>
                                                Perhatian: Ini adalah cicilan terakhir (ke-{tenor}). Setelah setoran ini tersimpan, pinjaman akan otomatis dinyatakan LUNAS (DONE)!
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Nomor Cicilan
                                    </label>
                                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-900">
                                        <span>Cicilan Ke-{nextNomor}</span>
                                        <span className="text-xs font-normal text-slate-500">
                                            (Tersisa {Math.max(0, tenor - nextNomor)} cicilan setelah ini)
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Jumlah Pembayaran (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600"
                                        placeholder="1000000"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Terbilang: {money(Number(payAmount) || 0)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Tanggal Pembayaran *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={payDate}
                                        onChange={(e) => setPayDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Status Pembayaran
                                    </label>
                                    <select
                                        value={payStatus}
                                        onChange={(e) => setPayStatus(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                                    >
                                        <option value="lancar">Lancar (Tepat Waktu)</option>
                                        <option value="telat">Telat (Terlambat)</option>
                                    </select>
                                </div>

                                {payError && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                                        {payError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setPayModalLoan(null)}
                                        disabled={paySubmitting}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={paySubmitting}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300 transition shadow-sm"
                                    >
                                        <Banknote className="h-4 w-4" />
                                        {paySubmitting ? 'Menyimpan...' : `Konfirmasi Bayar Cicilan ke-${nextNomor}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            })()}

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
