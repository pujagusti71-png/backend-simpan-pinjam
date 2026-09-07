const API_BASE = window.location.origin;

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
  : '-';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NA';

const escapeHtml = (value) => String(value ?? '-').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

async function api(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    showLogin();
    throw new Error('Sesi login berakhir');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request gagal (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function showToast(message, isError = false) {
  let toast = document.querySelector('#app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:20;padding:14px 18px;border-radius:8px;color:#fff;font:600 14px Segoe UI, sans-serif;box-shadow:0 8px 24px #0002;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? '#b42318' : '#087f5b';
  toast.hidden = false;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => { toast.hidden = true; }, 4000);
}

function showLogin() {
  if (document.querySelector('#login-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'login-panel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:10;display:grid;place-items:center;background:#0b3b36ee;font-family:Segoe UI,sans-serif;';
  panel.innerHTML = `<form style="width:min(390px,calc(100% - 32px));padding:32px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><h1 style="margin:0 0 8px;color:#123b36">Masuk ke Simpan Pinjam</h1><p style="color:#667085;margin:0 0 24px">Gunakan akun admin untuk melihat data database.</p><label style="display:block;margin:12px 0 6px;font-weight:600">Username</label><input name="username" required value="admin" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:12px 0 6px;font-weight:600">Password</label><input name="password" type="password" required value="admin123" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><button style="width:100%;margin-top:20px;padding:12px;border:0;border-radius:6px;background:#128c7e;color:#fff;font-weight:700;cursor:pointer">Masuk</button><p data-error style="color:#b42318;min-height:20px;margin:12px 0 0"></p></form>`;
  panel.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const error = panel.querySelector('[data-error]');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) });
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('admin', JSON.stringify(result.admin));
      panel.remove();
      window.location.reload();
    } catch (loginError) {
      error.textContent = loginError.message;
    }
  });
  document.body.appendChild(panel);
}

function requireAuth() {
  if (!localStorage.getItem('access_token')) showLogin();
}

function updateAdminProfile() {
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  if (!admin) return;
  document.querySelectorAll('[data-admin-name]').forEach((element) => { element.textContent = admin.namaLengkap || admin.username; });
  document.querySelectorAll('[data-admin-email]').forEach((element) => { element.textContent = admin.email || ''; });
}

async function loadDashboard() {
  const [nasabah, pinjaman, simpanan] = await Promise.all([api('/nasabah'), api('/pinjaman'), api('/simpanan')]);
  const activeLoans = pinjaman.filter((item) => ['approved', 'active'].includes(item.status));
  const totalLoans = activeLoans.reduce((sum, item) => sum + Number(item.jumlahPinjaman || 0), 0);
  const latestBalances = new Map();
  simpanan.filter((item) => item.status === 'aktif').forEach((item) => {
    const current = latestBalances.get(item.nasabahId);
    if (!current || new Date(item.tanggalSetoran) > new Date(current.tanggalSetoran)) latestBalances.set(item.nasabahId, item);
  });
  const totalSavings = [...latestBalances.values()].reduce((sum, item) => sum + Number(item.saldoAkhir || 0), 0);
  const cards = { totalLoans, totalSavings, totalCustomers: nasabah.length };
  Object.entries(cards).forEach(([key, value]) => { const element = document.querySelector(`[data-stat="${key}"]`); if (element) element.textContent = key.includes('Customers') ? value : formatCurrency(value); });
  const customerCount = document.querySelector('[data-stat="totalCustomers"]');
  if (customerCount) customerCount.textContent = String(nasabah.length);
  const ldr = document.querySelector('[data-stat="ldr"]');
  if (ldr) ldr.textContent = totalSavings ? `${((totalLoans / totalSavings) * 100).toFixed(1)}%` : '0%';
  const chart = document.querySelector('[data-dashboard-list]');
  if (chart) chart.innerHTML = pinjaman.slice(0, 8).map((item) => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee"><span>${escapeHtml(item.nasabah?.nama || `Nasabah #${item.nasabahId}`)}</span><strong>${formatCurrency(item.jumlahPinjaman)}</strong></div>`).join('') || '<p>Belum ada data pinjaman.</p>';
}

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

async function setupLoanEdit(loan) {
  const modal = document.createElement('div');
  modal.id = 'loan-edit-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif;';
  modal.innerHTML = `<form style="width:min(520px,100%);box-sizing:border-box;padding:28px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><div><h2 style="margin:0;color:#123b36">Edit Pinjaman #${loan.id}</h2><p style="margin:6px 0 0;color:#667085">${escapeHtml(loan.nasabah?.nama || `Nasabah #${loan.nasabahId}`)}</p></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;cursor:pointer;color:#667085" aria-label="Tutup">&times;</button></div><label style="display:block;margin:20px 0 6px;font-weight:600">Status Pengajuan</label><select name="status" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="pending">Pending</option><option value="approved">Disetujui</option><option value="active">Aktif</option><option value="completed">Selesai</option><option value="rejected">Ditolak</option></select><label style="display:block;margin:14px 0 6px;font-weight:600">Tanggal Persetujuan</label><input name="tanggalAsetujuan" type="datetime-local" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:14px 0 6px;font-weight:600">Tanggal Selesai</label><input name="tanggalSelesai" type="datetime-local" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><p data-form-error style="color:#b42318;min-height:20px;margin:12px 0 0"></p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px"><button type="button" data-close class="btn-secondary">Batal</button><button type="submit" class="btn-primary">Simpan Perubahan</button></div></form>`;
  const formElement = modal.querySelector('form');
  formElement.status.value = loan.status || 'pending';
  formElement.tanggalAsetujuan.value = toDateTimeLocal(loan.tanggalAsetujuan);
  formElement.tanggalSelesai.value = toDateTimeLocal(loan.tanggalSelesai);
  modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(formElement);
    const payload = { status: form.get('status') };
    const approvedDate = form.get('tanggalAsetujuan');
    const completedDate = form.get('tanggalSelesai');
    if (approvedDate) payload.tanggalAsetujuan = new Date(approvedDate).toISOString();
    if (completedDate) payload.tanggalSelesai = new Date(completedDate).toISOString();
    const submitButton = formElement.querySelector('button[type="submit"]');
    const error = formElement.querySelector('[data-form-error]');
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    try {
      await api(`/pinjaman/${loan.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      modal.remove();
      showToast('Pinjaman berhasil diperbarui');
      await loadLoans();
    } catch (saveError) {
      error.textContent = saveError.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan Perubahan';
    }
  });
  document.body.appendChild(modal);
}

async function loadLoans() {
  const loans = await api('/pinjaman');
  const body = document.querySelector('[data-loans-body]');
  if (!body) return;
  body.innerHTML = loans.map((item) => { const risk = item.nasabah?.risikoNasabah?.kategoriRisiko || 'belum dianalisis'; return `<tr><td><div class="user-cell"><div class="avatar">${initials(item.nasabah?.nama)}</div><div class="user-info"><span class="user-name">${escapeHtml(item.nasabah?.nama || `Nasabah #${item.nasabahId}`)}</span><span class="user-role">ID pinjaman #${item.id} · ${escapeHtml(item.nasabah?.nik || '-')}</span></div></div></td><td>${escapeHtml(item.nasabah?.pekerjaan || '-')}</td><td style="font-weight:600">${formatCurrency(item.jumlahPinjaman)}</td><td>${item.tenor} bln</td><td class="text-${escapeHtml(risk)}">${escapeHtml(risk)}</td><td><span class="badge status-${item.status === 'rejected' ? 'reject' : item.status === 'pending' ? 'review' : 'approve'}">${escapeHtml(item.status)}</span></td><td>${formatDate(item.tanggalPengajuan)}</td><td><button type="button" class="btn-secondary" data-edit-loan="${item.id}" title="Edit pinjaman">Edit</button></td></tr>`; }).join('') || '<tr><td colspan="8">Belum ada data pinjaman.</td></tr>';
  body.querySelectorAll('[data-edit-loan]').forEach((button) => button.addEventListener('click', () => {
    const loan = loans.find((item) => item.id === Number(button.dataset.editLoan));
    if (loan) setupLoanEdit(loan);
  }));
  const count = document.querySelector('[data-loan-count]');
  if (count) count.textContent = `Menampilkan ${loans.length} data dari database`;
  await loadPaymentOverview();
}

async function loadPaymentOverview() {
  const loans = await api('/pinjaman');
  const allPayments = loans.flatMap((loan) => (loan.pembayaran || []).map((payment) => ({
    ...payment,
    nasabah: loan.nasabah,
    pinjamanId: loan.id,
    jumlahPinjaman: loan.jumlahPinjaman,
  })));
  const paymentSummary = document.querySelector('[data-payment-summary]');
  if (paymentSummary) {
    const lancar = allPayments.filter((payment) => payment.statusBayar === 'lancar').length;
    const telat = allPayments.filter((payment) => payment.statusBayar === 'telat').length;
    const total = allPayments.reduce((sum, payment) => sum + Number(payment.jumlahBayar || 0), 0);
    paymentSummary.innerHTML = `
      <div style="padding:18px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
        <div style="font-size:0.78rem; color:#6b7280; text-transform:uppercase; font-weight:700;">Pembayaran lancar</div>
        <div style="margin-top:8px; font-size:1.6rem; font-weight:700; color:#087f5b;">${lancar}</div>
      </div>
      <div style="padding:18px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
        <div style="font-size:0.78rem; color:#6b7280; text-transform:uppercase; font-weight:700;">Terlambat</div>
        <div style="margin-top:8px; font-size:1.6rem; font-weight:700; color:#b42318;">${telat}</div>
      </div>
      <div style="padding:18px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
        <div style="font-size:0.78rem; color:#6b7280; text-transform:uppercase; font-weight:700;">Total nominal</div>
        <div style="margin-top:8px; font-size:1.1rem; font-weight:700; color:#123b36;">${formatCurrency(total)}</div>
      </div>
    `;
  }
  const paymentBody = document.querySelector('[data-payments-body]');
  if (paymentBody) {
    paymentBody.innerHTML = allPayments.length
      ? allPayments.slice(0, 6).map((payment) => `<tr><td><div class="user-cell"><div class="avatar">${initials(payment.nasabah?.nama)}</div><div class="user-info"><span class="user-name">${escapeHtml(payment.nasabah?.nama || `Nasabah #${payment.nasabahId}`)}</span><span class="user-role">ID pinjaman #${payment.pinjamanId}</span></div></div></td><td>${formatCurrency(payment.jumlahPinjaman)}</td><td>${formatCurrency(payment.jumlahBayar)}</td><td>${formatDate(payment.dariTanggalSeharusnya)}</td><td><span class="badge status-${payment.statusBayar === 'telat' ? 'reject' : 'approve'}">${escapeHtml(payment.statusBayar || 'lancar')}</span></td></tr>`).join('')
      : '<tr><td colspan="5">Belum ada data pembayaran.</td></tr>';
  }
}

function setupPaymentPicker() {
  const button = document.querySelector('#payment-button');
  if (!button) return;

  api('/pinjaman')
    .then((loans) => {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif;';
      modal.innerHTML = `<div style="width:min(500px,100%);box-sizing:border-box;padding:28px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><div><h2 style="margin:0;color:#123b36">Pilih Pinjaman</h2><p style="margin:6px 0 0;color:#667085">Pilih pinjaman yang akan dibayar cicilannya.</p></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;cursor:pointer;color:#667085" aria-label="Tutup">&times;</button></div><div style="display:grid;gap:10px;margin-top:20px">${loans.map((loan) => `<button type="button" data-loan-select="${loan.id}" style="padding:12px 14px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;text-align:left;font-weight:600;color:#111;cursor:pointer">${escapeHtml(loan.nasabah?.nama || `Nasabah #${loan.nasabahId}`)} · ${formatCurrency(loan.jumlahPinjaman)}</button>`).join('') || '<p>Belum ada data pinjaman.</p>'}</div></div>`;
      modal.querySelectorAll('[data-close]').forEach((closeButton) => closeButton.addEventListener('click', () => modal.remove()));
      modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
      modal.querySelectorAll('[data-loan-select]').forEach((selectButton) => {
        selectButton.addEventListener('click', () => {
          const selectedLoan = loans.find((loan) => loan.id === Number(selectButton.dataset.loanSelect));
          modal.remove();
          if (selectedLoan) setupPaymentForm(selectedLoan);
        });
      });
      document.body.appendChild(modal);
    })
    .catch((error) => showToast(error.message, true));
}

function setupPaymentForm(loan) {
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif;';
  const defaultAmount = Number(loan.cicilanBulanan || loan.cicilan || 0);
  modal.innerHTML = `<form style="width:min(480px,100%);box-sizing:border-box;padding:28px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><div><h2 style="margin:0;color:#123b36">Bayar Cicilan</h2><p style="margin:6px 0 0;color:#667085">Pinjaman #${loan.id} · ${escapeHtml(loan.nasabah?.nama || `Nasabah #${loan.nasabahId}`)}</p></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;cursor:pointer;color:#667085" aria-label="Tutup">&times;</button></div><label style="display:block;margin:20px 0 6px;font-weight:600">Jumlah Bayar</label><input name="jumlahBayar" type="number" min="1" step="1000" value="${defaultAmount}" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:14px 0 6px;font-weight:600">Status Pembayaran</label><select name="statusBayar" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="lancar">Lancar</option><option value="telat">Terlambat</option></select><label style="display:block;margin:14px 0 6px;font-weight:600">Tanggal Jatuh Tempo</label><input name="dariTanggalSeharusnya" type="date" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><p data-form-error style="color:#b42318;min-height:20px;margin:12px 0 0"></p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px"><button type="button" data-close class="btn-secondary">Batal</button><button type="submit" class="btn-primary">Simpan Pembayaran</button></div></form>`;
  const formElement = modal.querySelector('form');
  const amountLabel = [...formElement.querySelectorAll('label')].find((label) => label.textContent.trim() === 'Jumlah Pinjaman');
  const jobField = document.createElement('div');
  jobField.style.cssText = 'margin-top:14px';
  jobField.innerHTML = '<label style="display:block;margin-bottom:6px;font-weight:600">Pekerjaan</label><div style="display:flex;gap:8px"><input name="pekerjaan" required placeholder="Contoh: PNS, TNI/POLRI" style="flex:1;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><button type="button" data-job-master style="padding:0 12px;border:1px solid #d0d5dd;border-radius:6px;background:#f8fafc;color:#128c7e;font-weight:700;cursor:pointer">Pilih Master</button></div>';
  if (amountLabel) amountLabel.parentNode.insertBefore(jobField, amountLabel);
  jobField.querySelector('[data-job-master]').addEventListener('click', () => {
    const jobs = ['PNS', 'TNI/POLRI', 'Pegawai Negeri', 'Guru/Dosen', 'Tenaga Medis', 'Pegawai Bank', 'Karyawan Swasta', 'Wirausaha/Pengusaha/UMKM/Pedagang', 'Petani/Pekebun/Peternak', 'Nelayan', 'Buruh Harian', 'Sopir', 'Satpam', 'Cleaning Service', 'Freelance', 'Pensiunan', 'Mahasiswa', 'Belum Bekerja'];
    const picker = document.createElement('div');
    picker.style.cssText = 'position:fixed;inset:0;z-index:6;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif';
    picker.innerHTML = '<div style="width:min(520px,100%);max-height:80vh;overflow:auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;color:#123b36">Master Data Pekerjaan</h2><button type="button" data-job-close style="border:0;background:transparent;font-size:24px;cursor:pointer">&times;</button></div><div data-job-list style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"></div></div>';
    picker.querySelector('[data-job-list]').innerHTML = jobs.map((job) => `<button type="button" data-job="${escapeHtml(job)}" style="padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;text-align:left;cursor:pointer">${escapeHtml(job)}</button>`).join('');
    picker.querySelector('[data-job-close]').addEventListener('click', () => picker.remove());
    picker.addEventListener('click', (event) => { if (event.target === picker) picker.remove(); });
    picker.querySelectorAll('[data-job]').forEach((jobButton) => jobButton.addEventListener('click', () => { formElement.pekerjaan.value = jobButton.dataset.job; picker.remove(); }));
    document.body.appendChild(picker);
  });
  modal.querySelectorAll('[data-close]').forEach((closeButton) => closeButton.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(formElement);
    const payload = {
      pinjamanId: loan.id,
      jumlahBayar: Number(form.get('jumlahBayar')),
      statusBayar: form.get('statusBayar'),
    };
    if (form.get('dariTanggalSeharusnya')) {
      payload.dariTanggalSeharusnya = new Date(`${form.get('dariTanggalSeharusnya')}T00:00:00`).toISOString();
    }
    const submitButton = formElement.querySelector('button[type="submit"]');
    const error = formElement.querySelector('[data-form-error]');
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    try {
      await api('/pembayaran', { method: 'POST', body: JSON.stringify(payload) });
      modal.remove();
      showToast('Pembayaran cicilan berhasil dicatat');
      await loadLoans();
      await loadPaymentOverview();
    } catch (saveError) {
      error.textContent = saveError.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan Pembayaran';
    }
  });
  document.body.appendChild(modal);
}

async function setupLoanForm() {
  const button = document.querySelector('#new-loan-button');
  if (!button) return;

  const modal = document.createElement('div');
  modal.id = 'loan-create-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif;';
  modal.innerHTML = `<form style="width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:28px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><div><h2 style="margin:0;color:#123b36">Pengajuan Pinjaman Baru</h2><p style="margin:6px 0 0;color:#667085">Lengkapi identitas pemohon dan data pinjaman.</p></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;cursor:pointer;color:#667085" aria-label="Tutup">&times;</button></div><label style="display:block;margin:20px 0 6px;font-weight:600">Nama Lengkap</label><input name="nama" required placeholder="Nama sesuai KTP" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:14px 0 6px;font-weight:600">NIK</label><input name="nik" required minlength="16" maxlength="16" inputmode="numeric" placeholder="16 digit NIK" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:14px 0 6px;font-weight:600">Tanggal Lahir</label><input name="tanggalLahir" type="date" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><label style="display:block;margin:14px 0 6px;font-weight:600">Alamat</label><textarea name="alamat" required rows="2" placeholder="Alamat tempat tinggal" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px;resize:vertical"></textarea><label style="display:block;margin:14px 0 6px;font-weight:600">Jumlah Pinjaman</label><input name="jumlah" type="number" min="1" step="1" required placeholder="Contoh: 10000000" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label style="display:block;margin:14px 0 6px;font-weight:600">Tenor (bulan)</label><input name="tenor" type="number" min="1" required placeholder="12" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"></div><div><label style="display:block;margin:14px 0 6px;font-weight:600">Bunga (%)</label><input name="bunga" type="number" min="0.01" step="0.01" value="5" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"></div></div><label style="display:block;margin:14px 0 6px;font-weight:600">Tujuan Pinjaman</label><input name="tujuan" required placeholder="Contoh: Modal usaha" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label style="display:block;margin:14px 0 6px;font-weight:600">Penghasilan Bulanan</label><input name="penghasilan" type="number" min="0" step="1" placeholder="Contoh: 5000000" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"></div><div><label style="display:block;margin:14px 0 6px;font-weight:600">Cicilan Berjalan</label><input name="cicilan" type="number" min="0" step="1" value="0" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label style="display:block;margin:14px 0 6px;font-weight:600">Risiko</label><select name="risiko" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="Rendah">Rendah</option><option value="Sedang" selected>Sedang</option><option value="Tinggi">Tinggi</option></select></div><div><label style="display:block;margin:14px 0 6px;font-weight:600">Rekomendasi</label><select name="rekomendasi" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="Review" selected>Review</option><option value="Approve">Approve</option><option value="Reject">Reject</option></select></div></div><p data-form-error style="color:#b42318;min-height:20px;margin:12px 0 0"></p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px"><button type="button" data-close class="btn-secondary">Batal</button><button type="submit" class="btn-primary">Simpan Pengajuan</button></div></form>`;
  const formElement = modal.querySelector('form');
  modal.querySelectorAll('[data-close]').forEach((closeButton) => closeButton.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(formElement);
    const payload = {
      nama: form.get('nama').trim(),
      nik: form.get('nik').trim(),
      tanggalLahir: form.get('tanggalLahir'),
      alamat: form.get('alamat').trim(),
      pekerjaan: form.get('pekerjaan').trim(),
      jumlah: Number(form.get('jumlah')),
      tenor: Number(form.get('tenor')),
      bunga: Number(form.get('bunga')),
      tujuan: form.get('tujuan'),
      penghasilan: Number(form.get('penghasilan') || 0),
      cicilan: Number(form.get('cicilan') || 0),
      risiko: form.get('risiko'),
      rekomendasi: form.get('rekomendasi'),
    };
    const submitButton = formElement.querySelector('button[type="submit"]');
    const error = formElement.querySelector('[data-form-error]');
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    try {
      await api('/pinjaman', { method: 'POST', body: JSON.stringify(payload) });
      modal.remove();
      showToast('Pengajuan pinjaman berhasil dibuat');
      await loadLoans();
    } catch (saveError) {
      error.textContent = saveError.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan Pengajuan';
    }
  });
  document.body.appendChild(modal);
}

async function loadSavings() {
  const [records, customers] = await Promise.all([api('/simpanan'), api('/nasabah')]);
  const names = new Map(customers.map((customer) => [customer.id, customer]));
  const body = document.querySelector('[data-savings-body]');
  if (!body) return;
  body.innerHTML = records.map((item) => { const customer = names.get(item.nasabahId); const interestRate = item.bungaSimpanan === null || item.bungaSimpanan === undefined ? '-' : `${Number(item.bungaSimpanan).toLocaleString('id-ID')}% / tahun`; return `<tr><td><div class="user-cell"><div class="avatar">${initials(customer?.nama)}</div><div class="user-info"><span class="user-name">${escapeHtml(customer?.nama || `Nasabah #${item.nasabahId}`)}</span><span class="user-role">NIK ${escapeHtml(customer?.nik || '-')}</span></div></div></td><td>#${item.nasabahId}</td><td>${formatDate(item.tanggalSetoran)}</td><td>${formatCurrency(item.jumlahSetoran)}</td><td style="font-weight:600">${formatCurrency(item.saldoAkhir)}</td><td>${escapeHtml(interestRate)}</td><td><span class="badge badge-status-${item.status === 'aktif' ? 'aktif' : 'tidak'}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.keterangan || '-')}</td></tr>`; }).join('') || '<tr><td colspan="8">Belum ada data simpanan.</td></tr>';
  const count = document.querySelector('[data-savings-count]');
  if (count) count.textContent = `Menampilkan ${records.length} transaksi dari database`;
}

async function setupSavingsForm() {
  const button = document.querySelector('#new-savings-button');
  if (!button) return;

  const customers = await api('/nasabah');
  const modal = document.createElement('div');
  modal.id = 'savings-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif;';
  modal.innerHTML = `<form style="width:min(520px,100%);box-sizing:border-box;padding:28px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><div><h2 style="margin:0;color:#123b36">Transaksi Simpanan</h2><p style="margin:6px 0 0;color:#667085">Pilih metode transaksi sesuai kebutuhan.</p></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;cursor:pointer;color:#667085" aria-label="Tutup">&times;</button></div><label style="display:block;margin:20px 0 6px;font-weight:600">Metode</label><select name="method" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="deposit">Setor</option><option value="withdraw">Penarikan</option></select><label style="display:block;margin:14px 0 6px;font-weight:600">Nasabah</label><select name="nasabahId" required style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><option value="">Pilih nasabah</option>${customers.map((customer) => `<option value="${customer.id}">${escapeHtml(customer.nama)} - ${escapeHtml(customer.nik)}</option>`).join('')}</select><label data-amount-label style="display:block;margin:14px 0 6px;font-weight:600">Jumlah Setoran</label><input name="amount" type="number" min="1" step="0.01" required placeholder="Contoh: 100000" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><small data-balance-help style="display:block;margin-top:6px;color:#667085">Setoran akan menambah saldo nasabah.</small><div data-date-field><label style="display:block;margin:14px 0 6px;font-weight:600">Tanggal Setoran</label><input name="tanggalSetoran" type="date" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"></div><label style="display:block;margin:14px 0 6px;font-weight:600">Keterangan</label><textarea name="keterangan" rows="3" placeholder="Contoh: Setoran bulanan" style="width:100%;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px;resize:vertical"></textarea><p data-form-error style="min-height:20px;margin:12px 0 0;color:#b42318"></p><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px"><button type="button" data-close style="padding:10px 16px;border:1px solid #d0d5dd;background:#fff;border-radius:6px;font-weight:600;cursor:pointer">Batal</button><button type="submit" style="padding:10px 16px;border:0;background:#128c7e;color:#fff;border-radius:6px;font-weight:600;cursor:pointer">Simpan Data</button></div></form>`;

  modal.querySelectorAll('[data-close]').forEach((closeButton) => closeButton.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  const formElement = modal.querySelector('form');
  const methodField = formElement.querySelector('[name="method"]');
  const amountLabel = formElement.querySelector('[data-amount-label]');
  const amountField = formElement.querySelector('[name="amount"]');
  const balanceHelp = formElement.querySelector('[data-balance-help]');
  const dateField = formElement.querySelector('[data-date-field]');
  const jobField = document.createElement('div');
  jobField.style.cssText = 'margin-top:14px';
  jobField.innerHTML = '<label style="display:block;margin-bottom:6px;font-weight:600">Pekerjaan</label><div style="display:flex;gap:8px"><input name="pekerjaan" placeholder="Contoh: PNS, TNI/POLRI" style="flex:1;box-sizing:border-box;padding:11px;border:1px solid #d0d5dd;border-radius:6px"><button type="button" data-job-master style="padding:0 12px;border:1px solid #d0d5dd;border-radius:6px;background:#f8fafc;color:#128c7e;font-weight:700;cursor:pointer">Pilih Master</button></div>';
  if (amountLabel) amountLabel.parentNode.insertBefore(jobField, amountLabel);
  jobField.querySelector('[data-job-master]').addEventListener('click', () => {
    const jobs = ['PNS', 'TNI/POLRI', 'Pegawai Negeri', 'Guru/Dosen', 'Tenaga Medis', 'Pegawai Bank', 'Karyawan Swasta', 'Wirausaha/Pengusaha/UMKM/Pedagang', 'Petani/Pekebun/Peternak', 'Nelayan', 'Buruh Harian', 'Sopir', 'Satpam', 'Cleaning Service', 'Freelance', 'Pensiunan', 'Mahasiswa', 'Belum Bekerja'];
    const picker = document.createElement('div');
    picker.style.cssText = 'position:fixed;inset:0;z-index:6;display:grid;place-items:center;background:#0b3b3666;padding:20px;font-family:Segoe UI,sans-serif';
    picker.innerHTML = '<div style="width:min(520px,100%);max-height:80vh;overflow:auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 20px 60px #0004"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;color:#123b36">Master Data Pekerjaan</h2><button type="button" data-job-close style="border:0;background:transparent;font-size:24px;cursor:pointer">&times;</button></div><div data-job-list style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"></div></div>';
    picker.querySelector('[data-job-list]').innerHTML = jobs.map((job) => `<button type="button" data-job="${escapeHtml(job)}" style="padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;text-align:left;cursor:pointer">${escapeHtml(job)}</button>`).join('');
    picker.querySelector('[data-job-close]').addEventListener('click', () => picker.remove());
    picker.addEventListener('click', (event) => { if (event.target === picker) picker.remove(); });
    picker.querySelectorAll('[data-job]').forEach((jobButton) => jobButton.addEventListener('click', () => { formElement.pekerjaan.value = jobButton.dataset.job; picker.remove(); }));
    document.body.appendChild(picker);
  });
  methodField.addEventListener('change', () => {
    const isWithdrawal = methodField.value === 'withdraw';
    amountLabel.textContent = isWithdrawal ? 'Jumlah Penarikan' : 'Jumlah Setoran';
    amountField.placeholder = isWithdrawal ? 'Contoh: 50000' : 'Contoh: 100000';
    balanceHelp.textContent = isWithdrawal ? 'Penarikan melebihi saldo akan ditolak oleh server.' : 'Setoran akan menambah saldo nasabah.';
    dateField.hidden = isWithdrawal;
  });
  modal.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const error = modal.querySelector('[data-form-error]');
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Menyimpan...';
    try {
      const isWithdrawal = form.get('method') === 'withdraw';
      const payload = isWithdrawal
        ? {
          nasabahId: Number(form.get('nasabahId')),
          jumlahPenarikan: Number(form.get('amount')),
          keterangan: form.get('keterangan') || undefined,
        }
        : {
          nasabahId: Number(form.get('nasabahId')),
          pekerjaan: form.get('pekerjaan') || undefined,
          jumlahSetoran: Number(form.get('amount')),
          tanggalSetoran: form.get('tanggalSetoran') || undefined,
          keterangan: form.get('keterangan') || undefined,
        };
      await api(isWithdrawal ? '/simpanan/withdraw' : '/simpanan', { method: 'POST', body: JSON.stringify(payload) });
      modal.remove();
      showToast(isWithdrawal ? 'Penarikan berhasil dicatat' : 'Setoran berhasil dicatat');
      await loadSavings();
    } catch (saveError) {
      error.textContent = saveError.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan Data';
    }
  });
  document.body.appendChild(modal);
}

async function loadReports() {
  const [customers, loans, savings] = await Promise.all([api('/nasabah'), api('/pinjaman'), api('/simpanan')]);
  const payments = loans.flatMap((loan) => loan.pembayaran || []);
  const totals = { customers: customers.length, loans: loans.length, savings: savings.length, overdue: payments.filter((payment) => payment.statusBayar === 'telat').length };
  Object.entries(totals).forEach(([key, value]) => { const element = document.querySelector(`[data-report-stat="${key}"]`); if (element) element.textContent = String(value); });
  const jobs = [...new Set(customers.map((customer) => customer.pekerjaan))].map((job) => ({ job, total: customers.filter((customer) => customer.pekerjaan === job).length }));
  const list = document.querySelector('[data-risk-list]');
  if (list) list.innerHTML = jobs.sort((a, b) => b.total - a.total).slice(0, 5).map(({ job, total }) => `<div class="risk-item"><div class="risk-name"><div class="risk-bar" style="background-color:#128c7e"></div>${escapeHtml(job)}</div><div class="risk-percent">${total} nasabah</div></div>`).join('') || '<p>Belum ada data pekerjaan.</p>';
  const paymentSummary = document.querySelector('[data-payment-summary]');
  if (paymentSummary) paymentSummary.innerHTML = `<div><strong style="display:block;font-size:1.6rem;color:#087f5b">${payments.filter((payment) => payment.statusBayar === 'lancar').length}</strong><span>Pembayaran lancar</span></div><div><strong style="display:block;font-size:1.6rem;color:#b42318">${totals.overdue}</strong><span>Pembayaran terlambat</span></div><div><strong style="display:block;font-size:1.6rem;color:#123b36">${formatCurrency(payments.reduce((sum, payment) => sum + Number(payment.jumlahBayar || 0), 0))}</strong><span>Total nominal dibayar</span></div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  updateAdminProfile();
  try {
    if (document.querySelector('[data-dashboard]')) await loadDashboard();
    if (document.querySelector('[data-loans-body]')) await loadLoans();
    if (document.querySelector('[data-payments-body]')) await loadPaymentOverview();
    document.querySelector('#new-loan-button')?.addEventListener('click', setupLoanForm);
    document.querySelector('#payment-button')?.addEventListener('click', setupPaymentPicker);
  } catch (error) {
    console.error('Gagal memuat data aplikasi:', error);
    showToast('Gagal memuat data aplikasi', true);
  }
});
