'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    HelpCircle,
    PiggyBank,
    PlusCircle,
    Shield,
    Sparkles,
    UserCheck,
    UserPlus,
    Wallet,
} from 'lucide-react'
import { api, apiFetch } from '@/lib/api'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)

export default function PengajuanSimpananPage() {
    const router = useRouter()
    const [nasabahList, setNasabahList] = useState<any[]>([])
    const [loadingNasabah, setLoadingNasabah] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [successData, setSuccessData] = useState<any | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Mode: 'baru' (isi nama, nik, dll) vs 'terdaftar' (pilih nasabah yang sudah ada)
    const [mode, setMode] = useState<'baru' | 'terdaftar'>('baru')

    // Form state
    const [form, setForm] = useState({
        // Data Nasabah (jika baru)
        nama: '',
        nik: '',
        noHp: '',
        alamat: '',
        pekerjaan: 'Wiraswasta',
        penghasilan: '5000000',

        // Data Nasabah (jika sudah terdaftar)
        nasabahId: '',

        // Data Simpanan
        jenisSimpanan: 'Simpanan Sukarela',
        setoranAwal: '500000',
        tanggal: new Date().toISOString().slice(0, 10),
        keterangan: 'Pembukaan rekening simpanan baru',
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

    const calculatedBunga = () => {
        const nominal = Number(form.setoranAwal || 0)
        if (nominal < 5_000_000) return 0
        if (nominal < 10_000_000) return 0.5
        if (nominal < 15_000_000) return 1
        if (nominal < 20_000_000) return 1.5
        return 2
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        const nominal = Number(form.setoranAwal)
        if (!nominal || nominal <= 0) {
            setErrorMessage('Nominal setoran awal harus lebih besar dari 0')
            return
        }

        try {
            setSubmitting(true)

            if (mode === 'baru') {
                if (!form.nama.trim()) {
                    setErrorMessage('Nama lengkap pemohon wajib diisi')
                    setSubmitting(false)
                    return
                }
                if (!form.nik.trim() || form.nik.length < 10) {
                    setErrorMessage('NIK pemohon wajib diisi minimal 10 digit angka')
                    setSubmitting(false)
                    return
                }

                // Kirim request ke backend untuk buat simpanan + otomatis buat nasabah baru jika nasabahId tidak diisi
                const payload = {
                    nama: form.nama.trim(),
                    nik: form.nik.trim(),
                    alamat: form.alamat.trim() || 'Alamat belum diisi',
                    pekerjaan: form.pekerjaan,
                    penghasilan: Number(form.penghasilan) || 3000000,
                    jumlahSetoran: nominal,
                    bungaSimpanan: calculatedBunga(),
                    jenisInterest: 'flat',
                    tanggalSetoran: new Date(`${form.tanggal}T00:00:00`).toISOString(),
                    keterangan: `${form.jenisSimpanan} - ${form.keterangan || 'Setoran awal pembukaan simpanan'}`,
                }

                const result = await api.createSimpanan(payload)
                setSuccessData({
                    nama: form.nama,
                    nik: form.nik,
                    jenis: form.jenisSimpanan,
                    nominal: nominal,
                    id: result?.id || '-',
                })
            } else {
                // Nasabah sudah terdaftar
                if (!form.nasabahId) {
                    setErrorMessage('Silakan pilih nasabah yang terdaftar')
                    setSubmitting(false)
                    return
                }

                const selectedMember = nasabahList.find((n) => String(n.id) === String(form.nasabahId))

                const payload = {
                    nasabahId: Number(form.nasabahId),
                    jumlahSetoran: nominal,
                    bungaSimpanan: calculatedBunga(),
                    jenisInterest: 'flat',
                    tanggalSetoran: new Date(`${form.tanggal}T00:00:00`).toISOString(),
                    keterangan: `${form.jenisSimpanan} - ${form.keterangan || 'Pembukaan simpanan baru'}`,
                }

                const result = await api.createSimpanan(payload)
                setSuccessData({
                    nama: selectedMember?.nama || 'Nasabah',
                    nik: selectedMember?.nik || '-',
                    jenis: form.jenisSimpanan,
                    nominal: nominal,
                    id: result?.id || '-',
                })
            }
        } catch (err: any) {
            console.error('Error pengajuan simpanan:', err)
            setErrorMessage(err.message || 'Gagal menyimpan pengajuan simpanan. Silakan coba lagi.')
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
            penghasilan: '5000000',
            nasabahId: '',
            jenisSimpanan: 'Simpanan Sukarela',
            setoranAwal: '500000',
            tanggal: new Date().toISOString().slice(0, 10),
            keterangan: 'Pembukaan rekening simpanan baru',
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href="/dashboard" className="hover:text-emerald-700">Beranda</Link>
                            <span>/</span>
                            <span>Pengajuan</span>
                            <span>/</span>
                            <span className="font-medium text-slate-800">Pengajuan Simpanan</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Form Pengajuan Simpanan Baru
                        </h1>
                        <p className="text-sm text-slate-600">
                            Buka rekening tabungan/simpanan koperasi untuk anggota baru maupun yang sudah terdaftar.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/simpanan/transaksi"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Data Transaksi
                        </Link>
                        <Link
                            href="/simpanan/data"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <PiggyBank className="h-4 w-4" />
                            Data Simpanan
                        </Link>
                    </div>
                </div>

                {/* Success Card */}
                {successData ? (
                    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-slate-900">
                                Pengajuan Simpanan Berhasil Dicatat!
                            </h2>
                            <p className="mt-1 text-slate-600">
                                Rekening simpanan atas nama <strong className="text-slate-900">{successData.nama}</strong> telah berhasil dibuat dan disimpan ke database.
                            </p>

                            <div className="mt-6 w-full max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-sm">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-slate-500">Nama Nasabah:</div>
                                    <div className="font-semibold text-slate-800">{successData.nama}</div>
                                    <div className="text-slate-500">NIK:</div>
                                    <div className="font-mono text-slate-800">{successData.nik}</div>
                                    <div className="text-slate-500">Jenis Simpanan:</div>
                                    <div className="font-semibold text-emerald-700">{successData.jenis}</div>
                                    <div className="text-slate-500">Setoran Awal:</div>
                                    <div className="font-bold text-emerald-700">{formatCurrency(successData.nominal)}</div>
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
                                    href="/simpanan/transaksi"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Lihat di Transaksi Simpanan
                                </Link>
                                <Link
                                    href="/simpanan/data"
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    Lihat Data Simpanan
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Pilihan Mode Pendaftaran */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Langkah 1: Tentukan Status Pemohon
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
                                            Nasabah Baru (Belum Terdaftar)
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pemohon baru pertama kali mendaftar, form akan meminta data identitas diri (Nama, NIK, No HP, Alamat).
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
                                            Nasabah Terdaftar (Anggota Koperasi)
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pilih anggota yang sudah terdaftar di sistem untuk membuka rekening simpanan baru.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Step 2: Form Data Pemohon */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Langkah 2: Data Pemohon Simpanan
                                </span>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {mode === 'baru' ? 'Isi Identitas Nasabah Baru' : 'Pilih Anggota Terdaftar'}
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
                                            placeholder="Contoh: Budi Santoso"
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
                                            placeholder="16 digit nomor KTP"
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
                                            <option value="Profesional">Profesional (Dokter, Pengacara, dll)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Penghasilan Bulanan (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.penghasilan}
                                            onChange={(e) => setForm({ ...form, penghasilan: e.target.value })}
                                            placeholder="5000000"
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Alamat Tempat Tinggal
                                        </label>
                                        <input
                                            type="text"
                                            value={form.alamat}
                                            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                                            placeholder="Contoh: Jl. Diponegoro No. 12, RT 02/04, Kelurahan..."
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">
                                            Pilih Anggota Koperasi <span className="text-rose-500">*</span>
                                        </label>
                                        {loadingNasabah ? (
                                            <div className="mt-1.5 py-2 text-sm text-slate-500">Memuat data nasabah...</div>
                                        ) : nasabahList.length === 0 ? (
                                            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                Belum ada data anggota di database. Silakan pilih opsi <strong>Nasabah Baru</strong> di atas untuk mendaftarkan anggota pertama.
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
                                                        {n.nama} - NIK: {n.nik} ({n.pekerjaan || 'Anggota'})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Detail Simpanan */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Langkah 3: Rincian Simpanan & Setoran Awal
                                </span>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Rencana Pembukaan Simpanan
                                </h3>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Jenis Produk Simpanan <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={form.jenisSimpanan}
                                        onChange={(e) => setForm({ ...form, jenisSimpanan: e.target.value })}
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                        <option value="Simpanan Sukarela">Simpanan Sukarela (Bebas setor & tarik)</option>
                                        <option value="Simpanan Pokok">Simpanan Pokok (Setoran awal keanggotaan)</option>
                                        <option value="Simpanan Wajib">Simpanan Wajib (Setoran rutin bulanan)</option>
                                        <option value="Deposito Berjangka">Deposito Berjangka (Bunga kompetitif)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Nominal Setoran Awal (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="10000"
                                        step="1000"
                                        required
                                        value={form.setoranAwal}
                                        onChange={(e) => setForm({ ...form, setoranAwal: e.target.value })}
                                        placeholder="500000"
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Terbilang: {formatCurrency(Number(form.setoranAwal) || 0)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Tanggal Pembukaan / Setoran
                                    </label>
                                    <input
                                        type="date"
                                        value={form.tanggal}
                                        onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Estimasi Bunga Simpanan
                                    </label>
                                    <div className="mt-1.5 flex h-[42px] items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 text-sm font-semibold text-emerald-800">
                                        <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
                                        {calculatedBunga()}% per bulan ({calculatedBunga() > 0 ? 'Bunga Otomatis Aktif' : 'Saldo di bawah Rp 5 Jt'})
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Keterangan Tambahan
                                    </label>
                                    <input
                                        type="text"
                                        value={form.keterangan}
                                        onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                                        placeholder="Catatan buku tabungan / tujuan menabung..."
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
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
                                href="/simpanan/transaksi"
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
                                {submitting ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Simpanan'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
