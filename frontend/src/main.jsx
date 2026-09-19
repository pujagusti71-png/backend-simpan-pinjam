import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './styles.css';

const API_BASE = window.location.origin;
const STATUSES = ['pending', 'approved', 'active', 'completed', 'rejected'];
const JOB_MASTER_DATA = ['PNS', 'TNI/POLRI', 'Pegawai Negeri', 'Guru/Dosen', 'Tenaga Medis', 'Pegawai Bank', 'Karyawan Swasta Tetap', 'Karyawan Kontrak', 'Pegawai Honorer', 'Profesional', 'Sales/Marketing', 'Wirausaha/Pengusaha/UMKM/Pedagang', 'Petani/Pekebun/Peternak', 'Nelayan', 'Buruh Harian', 'Buruh Pabrik', 'Tukang Bangunan/Teknisi/Mekanik', 'Sopir', 'Driver Ojol', 'Kurir', 'Satpam', 'Cleaning Service', 'ART', 'Freelance', 'Pensiunan', 'Mahasiswa', 'Belum Bekerja'];

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : '-';
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NA';
const getLoanInterestRate = (amount) => {
  const value = Number(amount || 0);
  if (value >= 100000000) return 2;
  if (value >= 50000000) return 1.5;
  if (value >= 20000000) return 1;
  if (value >= 5000000) return 0.5;
  return 0;
};
const getLoanInterestAmount = (amount, rate) => Number(amount || 0) * Number(rate || 0) / 100;

async function api(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    throw new Error('Sesi login berakhir');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request gagal (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function Toast({ toast }) {
  return toast ? <div className={`toast ${toast.error ? 'error' : ''}`}>{toast.message}</div> : null;
}

function Login({ onLogin, onError }) {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('admin', JSON.stringify(result.admin));
      onLogin();
    } catch (error) { onError(error.message); } finally { setBusy(false); }
  };
  return <div className="login-overlay"><form className="login-panel" onSubmit={submit}><h1>Masuk ke Simpan Pinjam</h1><p>Gunakan akun admin untuk melihat data database.</p><label>Username<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label><label>Password<input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button className="btn-primary" disabled={busy}>{busy ? 'Memeriksa...' : 'Masuk'}</button></form></div>;
}

function Layout({ page, setPage, children, admin }) {
  const links = [['dashboard', 'Dashboard'], ['pinjaman', 'Pinjaman'], ['simpanan', 'Simpanan'], ['laporan', 'Laporan']];
  return <div className="app-shell"><aside className="sidebar"><div className="logo"><img className="logo-icon" src="/image.png" alt="SP" />Simpan Pinjam</div><nav>{links.map(([key, label]) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => { window.location.hash = key; setPage(key); }}>{label}</button>)}</nav><div className="user-profile"><div className="avatar">{initials(admin?.namaLengkap || admin?.username)}</div><div><strong>{admin?.namaLengkap || admin?.username || 'Admin'}</strong><small>{admin?.email || ''}</small></div></div></aside><main className="main-content">{children}</main></div>;
}

function Header({ eyebrow, title, description, action }) {
  return <header className="header"><div><small className="eyebrow">{eyebrow}</small><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function Dashboard({ onError }) {
  const [data, setData] = useState({ customers: [], loans: [], savings: [] });
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');
  useEffect(() => {
    Promise.all([api('/nasabah'), api('/pinjaman'), api('/simpanan')])
      .then(([customers, loans, savings]) => setData({
        customers: Array.isArray(customers) ? customers : [],
        loans: Array.isArray(loans) ? loans : [],
        savings: Array.isArray(savings) ? savings : [],
      }))
      .catch((error) => onError(error.message));
  }, [onError]);
  useEffect(() => {
    setChartLoading(true);
    setChartError('');
    api('/dashboard/chart')
      .then((result) => setChartData(Array.isArray(result) ? result : []))
      .catch((error) => setChartError(error.message))
      .finally(() => setChartLoading(false));
  }, []);

  const activeLoans = (Array.isArray(data.loans) ? data.loans : []).filter((item) => ['approved', 'active'].includes(item.status));
  const totalLoans = activeLoans.reduce((sum, item) => sum + Number(item.jumlahPinjaman || 0), 0);
  const latestBalances = new Map();
  (Array.isArray(data.savings) ? data.savings : []).filter((item) => item.status === 'aktif').forEach((item) => {
    const current = latestBalances.get(item.nasabahId);
    if (!current || new Date(item.tanggalSetoran) > new Date(current.tanggalSetoran)) latestBalances.set(item.nasabahId, item);
  });
  const totalSavings = [...latestBalances.values()].reduce((sum, item) => sum + Number(item.saldoAkhir || 0), 0);
  return <><Header eyebrow="Ringkasan Sistem" title="Dashboard Utama" description="Pantau kesehatan keuangan koperasi secara real-time" /><section className="stats-grid"><Stat label="Total Pinjaman" value={formatCurrency(totalLoans)} /><Stat label="Total Simpanan" value={formatCurrency(totalSavings)} /><Stat label="Total Nasabah" value={data.customers.length} /><Stat label="LDR Ratio" value={totalSavings ? `${((totalLoans / totalSavings) * 100).toFixed(1)}%` : '0%'} /></section><section className="card chart-card"><div className="chart-heading"><div><h2>Tren Pertumbuhan Simpanan vs Pinjaman</h2><p>Performa 6 Bulan Terakhir</p></div></div>{chartLoading ? <div className="chart-state">Memuat data grafik...</div> : chartError ? <div className="chart-state chart-error">{chartError}</div> : !chartData.length ? <div className="chart-state">Belum ada data transaksi</div> : <ResponsiveContainer width="100%" height={320}><LineChart data={chartData} margin={{ top: 12, right: 18, left: 12, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="bulan" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={92} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend align="right" verticalAlign="top" height={36} /><Line type="monotone" dataKey="simpanan" name="Simpanan" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="pinjaman" name="Pinjaman" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>}</section></>;
}

function Stat({ label, value }) { return <div className="stat-card"><small>{label}</small><strong>{value}</strong></div>; }

function Modal({ title, subtitle, onClose, children, wide = false }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal ${wide ? 'wide' : ''}`}><div className="modal-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="close-button" onClick={onClose} aria-label="Tutup">&times;</button></div>{children}</div></div>; }

function LoanForm({ onClose, onSaved, onError }) {
  const [form, setForm] = useState({ nama: '', nik: '', tanggalLahir: '', alamat: '', pekerjaan: '', jumlah: '', tenor: '', tujuan: '', penghasilan: '', cicilan: '0' });
  const [busy, setBusy] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await api('/pinjaman', { method: 'POST', body: JSON.stringify({ ...form, nama: form.nama.trim(), nik: form.nik.trim(), alamat: form.alamat.trim(), jumlah: Number(form.jumlah), tenor: Number(form.tenor), penghasilan: Number(form.penghasilan || 0), cicilan: Number(form.cicilan || 0) }) }); onSaved('Pengajuan pinjaman berhasil dibuat'); } catch (error) { onError(error.message); } finally { setBusy(false); } };
  return <>
    <Modal title="Pengajuan Pinjaman Baru" subtitle="Lengkapi identitas pemohon dan data pinjaman." onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <Field label="Nama Lengkap" name="nama" value={form.nama} onChange={change} required placeholder="Nama sesuai KTP" />
        <Field label="NIK" name="nik" value={form.nik} onChange={change} required minLength="16" maxLength="16" placeholder="16 digit NIK" />
        <Field label="Tanggal Lahir" name="tanggalLahir" type="date" value={form.tanggalLahir} onChange={change} required />
        <Field label="Alamat" name="alamat" value={form.alamat} onChange={change} required area placeholder="Alamat tempat tinggal" />
        <div className="field job-field">
          <label>Pekerjaan</label>
          <div className="job-field-row">
            <input name="pekerjaan" value={form.pekerjaan} onChange={change} required placeholder="Contoh: PNS, TNI/POLRI, Pegawai" />
            <button type="button" className="job-picker-button" onClick={() => setShowJobPicker(true)} aria-label="Lihat master data pekerjaan" title="Lihat master data pekerjaan">Pilih Master</button>
          </div>
          <div className="field-hint">Contoh: PNS, TNI/POLRI, Pegawai</div>
        </div>
        <Field label="Jumlah Pinjaman" name="jumlah" type="number" value={form.jumlah} onChange={change} required min="1" placeholder="Contoh: 10000000" />
        <Field label="Tenor (bulan)" name="tenor" type="number" value={form.tenor} onChange={change} required min="1" placeholder="12" />
        <Field label="Tujuan Pinjaman" name="tujuan" value={form.tujuan} onChange={change} required placeholder="Contoh: Modal usaha" />
        <Field label="Penghasilan Bulanan" name="penghasilan" type="number" value={form.penghasilan} onChange={change} min="0" placeholder="Contoh: 5000000" />
        <Field label="Cicilan Berjalan" name="cicilan" type="number" value={form.cicilan} onChange={change} min="0" />
        <div className="form-actions"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" disabled={busy}>{busy ? 'Memeriksa...' : 'Ajukan Pinjaman'}</button></div>
      </form>
    </Modal>
    {showJobPicker && <Modal title="Master Data Pekerjaan" subtitle="Klik salah satu pekerjaan untuk mengisi field otomatis" onClose={() => setShowJobPicker(false)}>
      <div className="job-picker-grid">
        {JOB_MASTER_DATA.map((job) => (
          <button key={job} type="button" className="job-picker-item" onClick={() => { setForm({ ...form, pekerjaan: job }); setShowJobPicker(false); }}>{job}</button>
        ))}
      </div>
    </Modal>}
  </>;
}

function Field({ label, area, ...props }) { return <label className="field">{label}{area ? <textarea {...props} rows="2" /> : <input {...props} />}</label>; }
function SelectField({ label, options, ...props }) { return <label className="field">{label}<select {...props}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }

function EditLoanForm({ loan, onClose, onSaved, onError }) {
  const [form, setForm] = useState({ status: loan.status || 'pending', tanggalAsetujuan: loan.tanggalAsetujuan ? new Date(loan.tanggalAsetujuan).toISOString().slice(0, 16) : '', tanggalSelesai: loan.tanggalSelesai ? new Date(loan.tanggalSelesai).toISOString().slice(0, 16) : '' });
  const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); const payload = { status: form.status }; if (form.tanggalAsetujuan) payload.tanggalAsetujuan = new Date(form.tanggalAsetujuan).toISOString(); if (form.tanggalSelesai) payload.tanggalSelesai = new Date(form.tanggalSelesai).toISOString(); try { await api(`/pinjaman/${loan.id}`, { method: 'PATCH', body: JSON.stringify(payload) }); onSaved('Pinjaman berhasil diperbarui'); } catch (error) { onError(error.message); } finally { setBusy(false); } };
  return <Modal title={`Edit Pinjaman #${loan.id}`} subtitle={loan.nasabah?.nama || `Nasabah #${loan.nasabahId}`} onClose={onClose}><form onSubmit={submit} className="form-grid"><SelectField label="Status Pengajuan" name="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={STATUSES} /><Field label="Tanggal Persetujuan" name="tanggalAsetujuan" type="datetime-local" value={form.tanggalAsetujuan} onChange={(event) => setForm({ ...form, tanggalAsetujuan: event.target.value })} /><Field label="Tanggal Selesai" name="tanggalSelesai" type="datetime-local" value={form.tanggalSelesai} onChange={(event) => setForm({ ...form, tanggalSelesai: event.target.value })} /><div className="form-actions"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Perubahan'}</button></div></form></Modal>;
}

function PayLoanForm({ loan, onClose, onSaved, onError }) {
  const [busy, setBusy] = useState(false);
  const [histories, setHistories] = useState([]);

  useEffect(() => {
    api(`/pembayaran/pinjaman/${loan.id}`)
      .then((items) => setHistories(Array.isArray(items) ? items : []))
      .catch(() => setHistories([]));
  }, [loan.id]);

  const totalBunga = Number(loan.totalBunga ?? (Number(loan.jumlahPinjaman || 0) * Number(loan.sukuBunga || 0) / 100));
  const tenor = Number(loan.tenor || 0);
  const nextIndex = (histories.length || 0) + 1;
  const pokok = tenor > 0 ? Number(loan.jumlahPinjaman || 0) / tenor : 0;
  const bunga = tenor > 0 ? totalBunga / tenor : 0;
  const totalBayar = pokok + bunga;
  const sisaPinjaman = Number(loan.jumlahPinjaman || 0) - histories.reduce((sum, payment) => sum + Number(payment.jumlahPokok || 0), 0);
  const sisaCicilan = Math.max(0, tenor - histories.length);
  const paymentDate = new Date();

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/pembayaran', {
        method: 'POST',
        body: JSON.stringify({
          pinjamanId: loan.id,
          nomorCicilan: nextIndex,
          jumlahPokok: pokok,
          jumlahBunga: bunga,
          jumlahBayar: totalBayar,
          tanggalPembayaran: paymentDate.toISOString(),
          statusBayar: 'lancar',
        }),
      });
      onSaved('Pembayaran cicilan berhasil dicatat');
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Pembayaran Cicilan" subtitle={`Nasabah ${loan.nasabah?.nama || `#${loan.nasabahId}`}`} onClose={onClose} wide>
      <div className="form-grid">
        <div className="field"><label>Nasabah</label><input value={loan.nasabah?.nama || `Nasabah #${loan.nasabahId}`} readOnly /></div>
        <div className="field"><label>ID Pinjaman</label><input value={`#${loan.id}`} readOnly /></div>
        <div className="field"><label>Jumlah Pinjaman</label><input value={formatCurrency(loan.jumlahPinjaman)} readOnly /></div>
        <div className="field"><label>Bunga</label><input value={`${loan.sukuBunga ?? getLoanInterestRate(loan.jumlahPinjaman)}%`} readOnly /></div>
        <div className="field"><label>Total Bunga</label><input value={formatCurrency(totalBunga)} readOnly /></div>
        <div className="field"><label>Tenor</label><input value={`${tenor} bulan`} readOnly /></div>
        <div className="field"><label>Cicilan ke</label><input value={`${nextIndex} / ${tenor}`} readOnly /></div>
        <div className="field"><label>Pokok Cicilan</label><input value={formatCurrency(pokok)} readOnly /></div>
        <div className="field"><label>Bunga Cicilan</label><input value={formatCurrency(bunga)} readOnly /></div>
        <div className="field"><label>Total Pembayaran Cicilan</label><input value={formatCurrency(totalBayar)} readOnly /></div>
        <div className="field"><label>Sisa Pinjaman</label><input value={formatCurrency(sisaPinjaman)} readOnly /></div>
        <div className="field"><label>Sisa Cicilan</label><input value={`${sisaCicilan} / ${tenor}`} readOnly /></div>
        <div className="field"><label>Tanggal Pembayaran</label><input value={formatDate(paymentDate.toISOString())} readOnly /></div>
      </div>

      <div className="card" style={{ marginTop: '18px' }}>
        <h3 style={{ marginTop: 0 }}>Riwayat Pembayaran</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>No</th><th>Cicilan</th><th>Tanggal</th><th>Pokok</th><th>Bunga</th><th>Total Bayar</th><th>Status</th></tr>
            </thead>
            <tbody>
              {histories.length ? histories.map((item, index) => (
                <tr key={item.id || `${item.nomorCicilan}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{item.nomorCicilan || index + 1}/{tenor}</td>
                  <td>{formatDate(item.tanggalPembayaran || item.tanggalBayar)}</td>
                  <td>{formatCurrency(item.jumlahPokok || 0)}</td>
                  <td>{formatCurrency(item.jumlahBunga || 0)}</td>
                  <td>{formatCurrency(item.jumlahBayar || 0)}</td>
                  <td><span className="badge active">Lunas</span></td>
                </tr>
              )) : <tr><td colSpan="7">Belum ada pembayaran.</td></tr>}
              {histories.length < tenor && (
                <tr>
                  <td>{histories.length + 1}</td>
                  <td>{nextIndex}/{tenor}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td><span className="badge pending">Belum Bayar</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '18px' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="button" className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Menyimpan...' : 'Simpan Pembayaran'}</button>
      </div>
    </Modal>
  );
}

function Loans({ onError, notify }) {
  const [loans, setLoans] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(null);

  const load = () => api('/pinjaman')
    .then((items) => setLoans(Array.isArray(items) ? items : []))
    .catch((error) => onError(error.message));

  useEffect(() => { load(); }, []);

  const filteredLoans = loans.filter((loan) =>
    (loan.nasabah?.nama || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const saved = (message) => {
    setEditing(null);
    setCreating(false);
    setPaying(null);
    notify(message);
    load();
  };

  return <>
    <Header
      eyebrow="Sistem / Pinjaman"
      title="Kelola Pinjaman"
      description="Analisis pengajuan, pantau tunggakan, dan kelola portofolio pinjaman"
      action={<button className="btn-primary" onClick={() => setCreating(true)}>+ Pengajuan Baru</button>}
    />

    <section className="card table-card">
      <div className="table-heading">
        <h2>Daftar Nasabah Pinjaman</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {searchOpen && <input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari nama nasabah" aria-label="Cari nama nasabah" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }} />}
          <button type="button" className="btn-secondary small" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchTerm(''); }} aria-label="Cari nama nasabah" title="Cari nama nasabah">🔍</button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="loan-table">
          <thead>
            <tr>
              <th>ID / Nasabah</th>
              <th>Pekerjaan</th>
              <th>Jumlah Pinjaman</th>
              <th>Bunga</th>
              <th>Tenor</th>
              <th>Status Pengajuan</th>
              <th>Tanggal Pengajuan</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredLoans.map((item) => {
              const rate = item.sukuBunga ?? getLoanInterestRate(item.jumlahPinjaman);
              const interestPerPeriod = item.tenor
                ? (item.totalBunga ?? getLoanInterestAmount(item.jumlahPinjaman, rate) * item.tenor) / item.tenor
                : 0;
              const totalInterest = item.totalBunga ?? getLoanInterestAmount(item.jumlahPinjaman, rate) * item.tenor;
              const paidInstallments = Array.isArray(item.pembayaran) ? item.pembayaran.length : 0;
              const lastPayment = Array.isArray(item.pembayaran) && item.pembayaran.length
                ? item.pembayaran[item.pembayaran.length - 1]
                : null;

              return <tr key={item.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar">{initials(item.nasabah?.nama)}</div>
                    <div>
                      <strong>{item.nasabah?.nama || `Nasabah #${item.nasabahId}`}</strong>
                      <small>ID pinjaman #{item.id} Â· {item.nasabah?.nik || '-'}</small>
                    </div>
                  </div>
                </td>
                <td>{item.nasabah?.pekerjaan || '-'}</td>
                <td><strong>{formatCurrency(item.jumlahPinjaman)}</strong></td>
                <td>
                  <strong>{formatCurrency(interestPerPeriod)}</strong>
                  <small className="table-subtext">{rate}% Â· Total {formatCurrency(totalInterest)}</small>
                </td>
                <td>{item.tenor} bln</td>
                <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                <td>{formatDate(item.tanggalPengajuan)}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary small" onClick={() => setPaying(item)}>Bayar</button>
                      <button className="btn-secondary small" onClick={() => setEditing(item)}>Edit</button>
                    </div>
                    <small className="table-subtext">
                      {paidInstallments > 0 ? `Pembayaran ${paidInstallments} / ${item.tenor}` : `0 / ${item.tenor}`}<br />
                      {lastPayment ? `Terakhir: ${formatDate(lastPayment.tanggalPembayaran || lastPayment.tanggalBayar)}` : 'Belum ada pembayaran'}
                    </small>
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>

        {!filteredLoans.length && <p>{searchTerm ? 'Nasabah tidak ditemukan.' : 'Belum ada data pinjaman.'}</p>}
      </div>
    </section>

    {creating && <LoanForm onClose={() => setCreating(false)} onSaved={saved} onError={onError} />}
    {editing && <EditLoanForm loan={editing} onClose={() => setEditing(null)} onSaved={saved} onError={onError} />}
    {paying && <PayLoanForm loan={paying} onClose={() => setPaying(null)} onSaved={saved} onError={onError} />}
  </>;
}

function Savings({ onError, notify }) {
  const [records, setRecords] = useState([]); const [customers, setCustomers] = useState([]); const [creating, setCreating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); const [searchTerm, setSearchTerm] = useState('');
  const load = () => Promise.all([api('/simpanan'), api('/nasabah')]).then(([items, people]) => {
    setRecords(Array.isArray(items) ? items.map((item) => ({
      ...item,
      potonganSimpanan: item.potonganSimpanan ?? item.bungaSimpanan,
    })) : []);
    setCustomers(Array.isArray(people) ? people : []);
  }).catch((error) => onError(error.message));
  useEffect(load, []);
  const filteredRecords = records.filter((record) => {
    const customer = customers.find((person) => person.id === record.nasabahId);
    return (customer?.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
  });
  return <><Header eyebrow="Sistem / Simpanan" title="Kelola Simpanan" description="Catat setoran dan penarikan saldo nasabah" action={<button className="btn-primary" onClick={() => setCreating(true)}>+ Transaksi Baru</button>} /><section className="card table-card"><div className="table-heading"><h2>Daftar Transaksi Simpanan</h2><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{searchOpen && <input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari nama nasabah" aria-label="Cari nama nasabah" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }} />}<button type="button" className="btn-secondary small" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchTerm(''); }} aria-label="Cari nama nasabah" title="Cari nama nasabah">🔍</button></div></div><div className="table-scroll"><table><thead><tr><th>Nasabah</th><th>ID</th><th>Tanggal</th><th>Setoran</th><th>Saldo</th><th>Potongan</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>{filteredRecords.map((item) => { const customer = customers.find((person) => person.id === item.nasabahId); const potongan = item.potonganSimpanan ?? item.bungaSimpanan; const nominalPotongan = potongan == null ? null : (Number(item.saldoAkhir || 0) * Number(potongan)) / 100; return <tr key={item.id}><td>{customer?.nama || `Nasabah #${item.nasabahId}`}</td><td>#{item.nasabahId}</td><td>{formatDate(item.tanggalSetoran)}</td><td>{formatCurrency(item.jumlahSetoran)}</td><td>{formatCurrency(item.saldoAkhir)}</td><td>{potongan == null ? '-' : <><div>{potongan}%</div><small className="table-subtext">{potongan}% = {formatCurrency(nominalPotongan)} per bulan</small></>}</td><td><span className="badge">{item.status}</span></td><td>{item.keterangan || '-'}</td></tr>; })}</tbody></table>{!filteredRecords.length && <p>{searchTerm ? 'Nasabah tidak ditemukan.' : 'Belum ada transaksi simpanan.'}</p>}</div></section>{creating && <SavingsForm customers={customers} onClose={() => setCreating(false)} onSaved={(message) => { setCreating(false); notify(message); load(); }} onError={onError} />}</>;
}

function SavingsForm({ customers, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    method: 'deposit',
    nasabahId: '',
    nama: '',
    nik: '',
    tanggalLahir: '',
    alamat: '',
    pekerjaan: '',
    penghasilan: '',
    amount: '',
    tanggalSetoran: '',
    keterangan: '',
  });
  const [busy, setBusy] = useState(false);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    const payload = form.method === 'withdraw'
      ? {
          nasabahId: form.nasabahId ? Number(form.nasabahId) : undefined,
          jumlahPenarikan: Number(form.amount),
          keterangan: form.keterangan || undefined,
        }
      : {
          nasabahId: form.nasabahId ? Number(form.nasabahId) : undefined,
          nama: form.nama || undefined,
          nik: form.nik || undefined,
          tanggalLahir: form.tanggalLahir || undefined,
          alamat: form.alamat || undefined,
          pekerjaan: form.pekerjaan || undefined,
          penghasilan: form.penghasilan ? Number(form.penghasilan) : undefined,
          jumlahSetoran: Number(form.amount),
          tanggalSetoran: form.tanggalSetoran || undefined,
          keterangan: form.keterangan || undefined,
        };

    try {
      await api(form.method === 'withdraw' ? '/simpanan/withdraw' : '/simpanan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(form.method === 'withdraw' ? 'Penarikan berhasil dicatat' : 'Setoran berhasil dicatat');
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <Modal title="Transaksi Simpanan" subtitle="Pilih nasabah yang sudah ada atau buat data nasabah baru." onClose={onClose}>
    <form onSubmit={submit} className="form-grid">
      <SelectField label="Metode" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} options={['deposit', 'withdraw']} />

      <label className="field">
        Nasabah
        <select value={form.nasabahId} onChange={(event) => setForm({ ...form, nasabahId: event.target.value })}>
          <option value="">Pilih nasabah / buat baru</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nama} - {customer.nik}</option>)}
        </select>
      </label>

      {!form.nasabahId && (
        <>
          <Field label="Nama Lengkap" name="nama" value={form.nama} onChange={change} placeholder="Nama sesuai KTP" required />
          <Field label="NIK" name="nik" value={form.nik} onChange={change} placeholder="16 digit NIK" required />
          <Field label="Tanggal Lahir" name="tanggalLahir" type="date" value={form.tanggalLahir} onChange={change} required />
          <Field label="Alamat" name="alamat" value={form.alamat} onChange={change} placeholder="Alamat tempat tinggal" required />
          <Field label="Pekerjaan" name="pekerjaan" value={form.pekerjaan} onChange={change} placeholder="Contoh: PNS, TNI/POLRI" required />
          <Field label="Penghasilan Bulanan" name="penghasilan" type="number" min="0" value={form.penghasilan} onChange={change} placeholder="Contoh: 5000000" required />
        </>
      )}

      <Field label={form.method === 'withdraw' ? 'Jumlah Penarikan' : 'Jumlah Setoran'} name="amount" type="number" min="1" value={form.amount} onChange={change} required />
      <Field label="Tanggal Setoran" name="tanggalSetoran" type="date" value={form.tanggalSetoran} onChange={change} />
      <Field label="Keterangan" name="keterangan" value={form.keterangan} onChange={change} />

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Data'}</button>
      </div>
    </form>
  </Modal>;
}

function Reports({ onError }) {
  const [data, setData] = useState({ customers: [], loans: [], savings: [] });
  useEffect(() => {
    Promise.all([api('/nasabah'), api('/pinjaman'), api('/simpanan')])
      .then(([customers, loans, savings]) => setData({
        customers: Array.isArray(customers) ? customers : [],
        loans: Array.isArray(loans) ? loans : [],
        savings: Array.isArray(savings) ? savings : [],
      }))
      .catch((error) => onError(error.message));
  }, [onError]);

  const payments = (Array.isArray(data.loans) ? data.loans : []).flatMap((loan) => loan.pembayaran || []);
  return <><Header eyebrow="Analitik Lanjutan" title="Laporan & Analitik" description="Pantau performa keuangan dan kesehatan portofolio secara real-time" /><section className="stats-grid"><Stat label="Portofolio Pinjaman" value={`${data.loans.length} transaksi`} /><Stat label="Pembayaran Terlambat" value={payments.filter((payment) => payment.statusBayar === 'telat').length} /><Stat label="Tren Simpanan" value={`${data.savings.length} transaksi`} /><Stat label="Total Nasabah" value={data.customers.length} /></section><section className="card"><h2>Nasabah Berdasarkan Pekerjaan</h2>{[...new Set(data.customers.map((customer) => customer.pekerjaan))].map((job) => <div className="list-row" key={job}><span>{job}</span><strong>{data.customers.filter((customer) => customer.pekerjaan === job).length} nasabah</strong></div>)}</section></>; }

function App() {
  const [page, setPage] = useState(window.location.hash.slice(1) || 'dashboard');
  const [auth, setAuth] = useState(Boolean(localStorage.getItem('access_token')));
  const [toast, setToast] = useState(null);
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  const notify = (message, error = false) => { setToast({ message, error }); window.setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const change = () => setPage(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  if (!auth) return <><Login onLogin={() => setAuth(true)} onError={(message) => notify(message, true)} /><Toast toast={toast} /></>;

  const content = (() => {
    switch (page) {
      case 'pinjaman':
        return <Loans onError={(message) => notify(message, true)} notify={notify} />;
      case 'simpanan':
        return <Savings onError={(message) => notify(message, true)} notify={notify} />;
      case 'laporan':
        return <Reports onError={(message) => notify(message, true)} />;
      default:
        return <Dashboard onError={(message) => notify(message, true)} />;
    }
  })();

  return <><Layout page={page} setPage={setPage} admin={admin}>{content}</Layout><Toast toast={toast} /></>;
}

createRoot(document.getElementById('root')).render(<App />);

