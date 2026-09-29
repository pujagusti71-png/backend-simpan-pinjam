'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    HelpCircle,
    Info,
    Percent,
    PieChart,
    PlusCircle,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserPlus,
} from 'lucide-react'
import { api, apiFetch } from '@/lib/api'
import { hitungBunga } from '@/components/original-pinjaman'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)

export default function PengajuanPinjamanPage() {
    const router = useRouter()
    const [nasabahList, setNasabahList] = useState<any[]>([])
    const [loadingNasabah, setLoadingNasabah] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [successData, setSuccessData] = useState<any | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Mode: 'baru' vs 'terdaftar'
    const [mode, setMode] = useState<'baru' | 'terdaftar'>('baru')

    // Form state
    const [form, setForm] = useState({
        // Data Pemohon (jika baru)
        nama: '',
        nik: '',
        noHp: '',
        alamat: '',
        pekerjaan: 'Wiraswasta',
        penghasilan: '6000000',
        estimasiPengeluaran: '2500000',
        jumlahTanggungan: '2',

        // Data Pemohon (jika sudah terdaftar)
        nasabahId: '',

        // Data Pinjaman
        jumlahPinjaman: '10000000',
        tanggalPinjaman: new Date().toISOString().slice(0, 10),
        tenor: '12',
        jenisBunga: 'flat' as 'flat' | 'efektif',
        tujuan: 'Modal Usaha',
    })

    useEffect(() => {
        const fetchNasabah = async () => {
            try {
                setLoadingNasabah(true)
                const res = await api.getNasabah()
                if (Array.isArray(res)) {
                    setNasabahList(res)
                }
            } catch (err) {
                console.error('Gagal mengambil data anggota:', err)
            } finally {
                setLoadingNasabah(false)
            }
        }
        fetchNasabah()
    }, [])

    // Bunga otomatis sistem berdasarkan jumlah pinjaman
    const bungaOtomatis = hitungBunga(Number(form.jumlahPinjaman) || 0)

    // Simulasi Kalkulator Cicilan
    const simulation = useMemo(() => {
        const principal = Number(form.jumlahPinjaman) || 0
        const tenorMonths = Number(form.tenor) || 1
        const monthlyRate = bungaOtomatis / 100

        if (principal <= 0 || tenorMonths <= 0) {
            return {
                cicilanBulanan: 0,
                totalBunga: 0,
                totalBayar: 0,
                rasioCicilan: 0,
                riskCategory: 'Rendah',
            }
        }

        let cicilanBulanan = 0
        let totalBunga = 0

        if (form.jenisBunga === 'flat') {
            const pokokPerBulan = principal / tenorMonths
            const bungaPerBulan = principal * monthlyRate
            cicilanBulanan = Math.round(pokokPerBulan + bungaPerBulan)
            totalBunga = Math.round(bungaPerBulan * tenorMonths)
        } else {
            // Efektif (anuitas sederhana)
            if (monthlyRate === 0) {
                cicilanBulanan = Math.round(principal / tenorMonths)
                totalBunga = 0
            } else {
                const x = Math.pow(1 + monthlyRate, tenorMonths)
                cicilanBulanan = Math.round((principal * monthlyRate * x) / (x - 1))
                totalBunga = Math.round(cicilanBulanan * tenorMonths - principal)
            }
        }

        const totalBayar = principal + totalBunga

        // Ambil penghasilan
        let income = Number(form.penghasilan) || 0
        if (mode === 'terdaftar' && form.nasabahId) {
            const selected = nasabahList.find((n) => String(n.id) === String(form.nasabahId))
            if (selected) {
                income = Number(selected.penghasilan) || income
            }
        }

        const rasioCicilan = income > 0 ? (cicilanBulanan / income) * 100 : 0
        let riskCategory = 'Rendah'
        if (rasioCicilan > 50) riskCategory = 'Tinggi'
        else if (rasioCicilan > 30) riskCategory = 'Sedang'

        return {
            cicilanBulanan,
            totalBunga,
            totalBayar,
            rasioCicilan: Math.round(rasioCicilan),
            riskCategory,
        }
    }, [form.jumlahPinjaman, form.tenor, bungaOtomatis, form.jenisBunga, form.penghasilan, form.nasabahId, mode, nasabahList])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        const jumlah = Number(form.jumlahPinjaman)
        if (!jumlah || jumlah <= 0) {
            setErrorMessage('Jumlah pinjaman harus lebih besar dari 0')
            return
        }

        try {
            setSubmitting(true)

            if (mode === 'baru') {
                if (!form.nama.trim()) {
                    setErrorMessage('Nama pemohon pinjaman wajib diisi')
                    setSubmitting(false)
                    return
                }
                if (!form.nik.trim() || form.nik.length < 10) {
                    setErrorMessage('NIK pemohon wajib diisi minimal 10 digit')
                    setSubmitting(false)
                    return
                }

                // Kirim request ke backend untuk buat pinjaman + otomatis buat nasabah jika nasabahId kosong
                const payload = {
                    nama: form.nama.trim(),
                    nik: form.nik.trim(),
                    alamat: form.alamat.trim() || 'Alamat belum diisi',
                    pekerjaan: form.pekerjaan,
                    penghasilan: Number(form.penghasilan) || 4000000,
                    estimasiPengeluaran: Number(form.estimasiPengeluaran) || 0,
                    tanggalPinjaman: form.tanggalPinjaman,
                    jumlahPinjaman: jumlah,
                    tenor: Number(form.tenor),
                    sukuBunga: bungaOtomatis,
                    bunga: bungaOtomatis,
                    jenisBunga: form.jenisBunga,
                    tujuan: form.tujuan,
                    risiko: simulation.riskCategory,
                    rekomendasi: simulation.rasioCicilan > 50 ? 'Review Khusus' : 'Dapat Diproses',
                }

                const result = await api.createPinjaman(payload)
                setSuccessData({
                    nama: form.nama,
                    nik: form.nik,
                    jumlah: jumlah,
                    tenor: form.tenor,
                    cicilan: simulation.cicilanBulanan,
                    id: result?.id || '-',
                })
            } else {
                // Nasabah sudah terdaftar
                if (!form.nasabahId) {
                    setErrorMessage('Silakan pilih anggota terdaftar')
                    setSubmitting(false)
                    return
                }

                const selectedMember = nasabahList.find((n) => String(n.id) === String(form.nasabahId))

                const payload = {
                    nasabahId: Number(form.nasabahId),
                    tanggalPinjaman: form.tanggalPinjaman,
                    jumlahPinjaman: jumlah,
                    tenor: Number(form.tenor),
                    sukuBunga: bungaOtomatis,
                    bunga: bungaOtomatis,
                    jenisBunga: form.jenisBunga,
                    tujuan: form.tujuan,
                    risiko: simulation.riskCategory,
                    rekomendasi: simulation.rasioCicilan > 50 ? 'Review Khusus' : 'Dapat Diproses',
                }

                const result = await api.createPinjaman(payload)
                setSuccessData({
                    nama: selectedMember?.nama || 'Nasabah',
                    nik: selectedMember?.nik || '-',
                    jumlah: jumlah,
                    tenor: form.tenor,
                    cicilan: simulation.cicilanBulanan,
                    id: result?.id || '-',
                })
            }
        } catch (err: any) {
            console.error('Error pengajuan pinjaman:', err)
            setErrorMessage(err.message || 'Gagal menyimpan pengajuan pinjaman. Silakan coba lagi.')
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setSuccessData(null)
        setForm({
            nama: '',
            nik: '',
            noHp: '',
            alamat: '',
            pekerjaan: 'Wiraswasta',
            penghasilan: '6000000',
            estimasiPengeluaran: '2500000',
            jumlahTanggungan: '2',
            nasabahId: '',
            jumlahPinjaman: '10000000',
            tanggalPinjaman: new Date().toISOString().slice(0, 10),
            tenor: '12',
            jenisBunga: 'flat',
            tujuan: 'Modal Usaha',
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href="/dashboard" className="hover:text-emerald-700">Beranda</Link>
                            <span>/</span>
                            <span>Pengajuan</span>
                            <span>/</span>
                            <span className="font-medium text-slate-800">Pengajuan Pinjaman</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Form Pengajuan Pinjaman Baru
                        </h1>
                        <p className="text-sm text-slate-600">
                            Permohonan pinjaman dana anggota baru maupun lama dengan simulasi angsuran terintegrasi.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/pinjaman"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                            Semua Pinjaman
                        </Link>
                        <Link
                            href="/pinjaman/pre-loan-checking"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Pre-Loan Check
                        </Link>
                    </div>
                </div>

                {/* Success State */}
                {successData ? (
                    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-slate-900">
                                Pengajuan Pinjaman Berhasil Dikirim!
                            </h2>
                            <p className="mt-1 text-slate-600">
                                Berkas pengajuan atas nama <strong className="text-slate-900">{successData.nama}</strong> telah berhasil disimpan dengan status pending untuk proses verifikasi.
                            </p>

                            <div className="mt-6 w-full max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-sm">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-slate-500">Nama Pemohon:</div>
                                    <div className="font-semibold text-slate-800">{successData.nama}</div>
                                    <div className="text-slate-500">NIK:</div>
                                    <div className="font-mono text-slate-800">{successData.nik}</div>
                                    <div className="text-slate-500">Jumlah Pinjaman:</div>
                                    <div className="font-bold text-emerald-700">{formatCurrency(successData.jumlah)}</div>
                                    <div className="text-slate-500">Tenor:</div>
                                    <div className="font-semibold text-slate-800">{successData.tenor} Bulan</div>
                                    <div className="text-slate-500">Estimasi Cicilan:</div>
                                    <div className="font-bold text-slate-800">{formatCurrency(successData.cicilan)} / bln</div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={resetForm}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Buat Pengajuan Baru Lagi
                                </button>
                                <Link
                                    href="/pinjaman"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Lihat di Daftar Pinjaman
                                </Link>
                                <Link
                                    href="/simpanan/transaksi"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Halaman Transaksi
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Pilihan Mode Pendaftaran */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Langkah 1: Tentukan Status Pemohon Pinjaman
                            </span>
                            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                        mode === 'baru'
                                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/30'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="mode"
                                        checked={mode === 'baru'}
                                        onChange={() => setMode('baru')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                                            <UserPlus className="h-4 w-4 text-emerald-600" />
                                            Pemohon Baru (Belum Terdaftar)
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pemohon baru belum memiliki akun, form akan meminta data identitas diri dan penghasilan.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                        mode === 'terdaftar'
                                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/30'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="mode"
                                        checked={mode === 'terdaftar'}
                                        onChange={() => setMode('terdaftar')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                                            <UserCheck className="h-4 w-4 text-emerald-600" />
                                            Anggota Terdaftar (Sudah Ada di Sistem)
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pilih data anggota koperasi yang sudah terdaftar untuk mengajukan pinjaman baru.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Step 2: Data Pemohon */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Langkah 2: Data Diri Pemohon Pinjaman
                                </span>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {mode === 'baru' ? 'Isi Identitas Pemohon Baru' : 'Pilih Anggota Terdaftar'}
                                </h3>
                            </div>

                            {mode === 'baru' ? (
                                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Nama Lengkap <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.nama}
                                            onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                            placeholder="Contoh: Siti Rahmawati"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={16}
                                            value={form.nik}
                                            onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
                                            placeholder="16 digit NIK KTP"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Pekerjaan
                                        </label>
                                        <select
                                            value={form.pekerjaan}
                                            onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Penghasilan Bulanan (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={form.penghasilan}
                                            onChange={(e) => setForm({ ...form, penghasilan: e.target.value })}
                                            placeholder="6000000"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Estimasi Pengeluaran Bulanan (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.estimasiPengeluaran}
                                            onChange={(e) => setForm({ ...form, estimasiPengeluaran: e.target.value })}
                                            placeholder="2500000"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Alamat Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={form.alamat}
                                            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                                            placeholder="Contoh: Jl. Ahmad Yani No. 45, Kecamatan..."
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Pilih Anggota Terdaftar <span className="text-rose-500">*</span>
                                        </label>
                                        {loadingNasabah ? (
                                            <div className="mt-1.5 py-2 text-sm text-slate-500">Memuat data nasabah...</div>
                                        ) : nasabahList.length === 0 ? (
                                            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                Belum ada data anggota di database. Silakan pilih opsi <strong>Pemohon Baru</strong> di atas.
                                            </div>
                                        ) : (
                                            <select
                                                value={form.nasabahId}
                                                onChange={(e) => setForm({ ...form, nasabahId: e.target.value })}
                                                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                            >
                                                <option value="">-- Pilih Nama Anggota --</option>
                                                {nasabahList.map((n) => (
                                                    <option key={n.id} value={n.id}>
                                                        {n.nama} - NIK: {n.nik} (Gaji: {formatCurrency(n.penghasilan || 0)})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Detail Pinjaman & Simulasi Angsuran */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                                <div className="border-b border-slate-100 pb-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Langkah 3: Rincian Pinjaman
                                    </span>
                                    <h3 className="text-base font-semibold text-slate-900">
                                        Nominal, Tenor & Suku Bunga
                                    </h3>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Jumlah Pinjaman Yang Diajukan (Rp) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="500000"
                                            step="100000"
                                            required
                                            value={form.jumlahPinjaman}
                                            onChange={(e) => setForm({ ...form, jumlahPinjaman: e.target.value })}
                                            placeholder="10000000"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base font-bold text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">
                                            Terbilang: {formatCurrency(Number(form.jumlahPinjaman) || 0)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Jangka Waktu / Tenor <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.tenor}
                                            onChange={(e) => setForm({ ...form, tenor: e.target.value })}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="3">3 Bulan</option>
                                            <option value="6">6 Bulan</option>
                                            <option value="12">12 Bulan (1 Tahun)</option>
                                            <option value="18">18 Bulan</option>
                                            <option value="24">24 Bulan (2 Tahun)</option>
                                            <option value="36">36 Bulan (3 Tahun)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Tanggal Pinjaman <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={form.tanggalPinjaman}
                                            onChange={(e) => setForm({ ...form, tanggalPinjaman: e.target.value })}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Suku Bunga Pinjaman
                                        </label>
                                        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm">
                                            <span>{bungaOtomatis}% per Bulan</span>
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                Bunga Otomatis Sistem
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Tipe Perhitungan Bunga
                                        </label>
                                        <select
                                            value={form.jenisBunga}
                                            onChange={(e) => setForm({ ...form, jenisBunga: e.target.value as any })}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="flat">Bunga Flat (Tetap Tiap Bulan)</option>
                                            <option value="efektif">Bunga Efektif (Menurun Sesuai Sisa Pokok)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Tujuan Penggunaan Pinjaman <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.tujuan}
                                            onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="Modal Usaha">Modal Usaha / Kerja</option>
                                            <option value="Renovasi Rumah">Renovasi Rumah</option>
                                            <option value="Pendidikan">Biaya Pendidikan</option>
                                            <option value="Pengobatan">Kesehatan / Pengobatan</option>
                                            <option value="Konsumtif">Kebutuhan Konsumtif / Lainnya</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Simulasi Card */}
                            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                                    <PieChart className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-bold text-slate-900">Simulasi Cicilan</h3>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Estimasi Cicilan per Bulan
                                        </span>
                                        <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                                            {formatCurrency(simulation.cicilanBulanan)}
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Pokok Pinjaman:</span>
                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(Number(form.jumlahPinjaman) || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Estimasi Total Bunga:</span>
                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(simulation.totalBunga)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Total Pengembalian:</span>
                                            <span className="font-bold text-emerald-800">
                                                {formatCurrency(simulation.totalBayar)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Analisis Risiko Ringkas */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-600">Beban Cicilan (DSR):</span>
                                            <span className="font-bold text-slate-900">{simulation.rasioCicilan}%</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="font-medium text-slate-600">Kategori Risiko:</span>
                                            <span
                                                className={`rounded px-2 py-0.5 font-bold ${
                                                    simulation.riskCategory === 'Rendah'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : simulation.riskCategory === 'Sedang'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {simulation.riskCategory}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                                {errorMessage}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Link
                                href="/pinjaman"
                                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                <PlusCircle className="h-4 w-4" />
                                {submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Pinjaman'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
