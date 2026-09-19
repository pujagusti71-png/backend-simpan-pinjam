(() => {
    const API = (window.__SIMPAN_PINJAM_API__ || 'http://localhost:8003').replace(/\/$/, '')
    const loginSilently = async () => {
        const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) })
        if (!response.ok) throw new Error('Autentikasi otomatis gagal')
        const data = await response.json()
        const authToken = data.access_token || data.token
        if (!authToken) throw new Error('Token JWT tidak ditemukan')
        sessionStorage.setItem('sp_token', authToken)
        document.cookie = `sp_token=${authToken}; path=/; SameSite=Lax`
        return authToken
    }
    const request = async (path, options = {}) => {
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
        const authToken = sessionStorage.getItem('sp_token') || await loginSilently()
        if (authToken) headers.Authorization = `Bearer ${authToken}`
        const response = await fetch(`${API}${path}`, { ...options, headers })
        if (response.status === 401) {
            sessionStorage.removeItem('sp_token')
            document.cookie = 'sp_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
            await loginSilently()
            return request(path, options)
            throw new Error('Sesi login berakhir')
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
    }
    const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
    const download = (name, rows) => {
        const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        link.download = name
        link.click()
        URL.revokeObjectURL(link.href)
    }
    const routeName = location.pathname.split('/').pop() || ''
    const page = routeName === 'simpanan' ? 'simpanan.html' : routeName === 'pinjaman' ? 'pinjaman.html' : routeName === 'laporan' ? 'laporan.html' : 'index.html'
    const rows = (value) => Array.isArray(value) ? value : []
    const routeLinks = { 'index.html': '/', 'simpanan.html': '/simpanan', 'pinjaman.html': '/pinjaman', 'laporan.html': '/laporan' }
    document.querySelectorAll('a[href]').forEach((link) => {
        const route = routeLinks[link.getAttribute('href')]
        if (route) link.setAttribute('href', route)
    })

    const loadDashboard = async () => {
        const [loans, savings, customers] = await Promise.all([request('/pinjaman'), request('/simpanan'), request('/nasabah')])
        const cards = document.querySelectorAll('.card .value')
        const loanRows = rows(loans)
        const savingRows = rows(savings)
        const totalLoans = loanRows.reduce((sum, item) => sum + Number(item.jumlahPinjaman || 0), 0)
        const totalSavings = savingRows.reduce((sum, item) => sum + Number(item.saldoAkhir || 0), 0)
        if (cards[0]) cards[0].textContent = money(totalLoans)
        if (cards[1]) cards[1].textContent = money(totalSavings)
        if (cards[2]) cards[2].textContent = `${totalSavings > 0 ? (totalLoans / totalSavings * 100).toFixed(1) : '0.0'}%`
        if (cards[3]) cards[3].textContent = rows(customers).length.toLocaleString('id-ID')
        const chart = document.querySelector('.chart-area > div:last-child')
        if (chart) {
            const points = [0.55, 0.68, 0.82, 0.96, 1.08, 1.2].map((ratio, index) => `${index * 20},${240 - Math.min(210, Math.max(8, ((totalSavings * ratio) / Math.max(totalSavings, 1)) * 180))}`).join(' ')
            chart.innerHTML = `<svg viewBox="0 0 100 250" preserveAspectRatio="none" style="width:100%;height:100%;"><polyline points="${points}" fill="none" stroke="#128c7e" stroke-width="1.5" vector-effect="non-scaling-stroke"/><polyline points="0,240 ${points} 100,240" fill="#128c7e" opacity=".12" stroke="none"/></svg>`
            chart.style.border = '0'
        }
    }
    const clearSession = () => {
        sessionStorage.removeItem('sp_token')
        document.cookie = 'sp_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    }

    window.addEventListener('beforeunload', clearSession)
    window.addEventListener('pagehide', clearSession)

    const loadSavings = async () => {
        const [customers, savings] = await Promise.all([request('/nasabah'), request('/simpanan')])
        const customerMap = new Map(rows(customers).map((item) => [Number(item.id), item]))
        const body = document.querySelector('tbody')
        if (!body) return
        const filterSelects = document.querySelectorAll('.filter-group select')
        const setOptions = (select, values) => {
            if (!select) return
            select.innerHTML = values.map((value) => `<option>${value}</option>`).join('')
        }
        setOptions(filterSelects[0], ['Semua Status', 'AKTIF', 'TIDAK AKTIF'])
        setOptions(filterSelects[1], ['Semua Tipe', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela', 'Deposito'])
        setOptions(filterSelects[2], ['Min - Max Saldo', 'Di bawah Rp 1 juta', 'Rp 1 - 5 juta', 'Rp 5 - 10 juta', 'Di atas Rp 10 juta'])
        body.innerHTML = rows(savings).map((item) => {
            const customer = customerMap.get(Number(item.nasabahId)) || item.nasabah || {}
            const name = customer.nama || 'Nasabah'
            const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
            const status = Number(item.saldoAkhir) > 0 ? 'AKTIF' : 'TIDAK AKTIF'
            const type = item.jenisSimpanan || 'Simpanan Sukarela'
            return `<tr data-status="${status}" data-type="${type}" data-balance="${Number(item.saldoAkhir) || 0}" data-date="${item.tanggalSetoran || item.createdAt || ''}"><td><div class="user-cell"><div class="avatar">${initials}</div><div class="user-info"><span class="user-name">${name}</span><span class="user-role">${customer.pekerjaan || 'Anggota'}</span></div></div></td><td>${item.noRekening || `SP-${item.nasabahId}`}</td><td><span class="badge badge-type-sukarela">${type}</span></td><td style="font-weight: 600;">${money(item.saldoAkhir)}</td><td><span class="badge badge-status-aktif">${status}</span></td><td><button style="border:none; background:none; cursor:pointer;" data-detail="${item.id}">⋮</button></td></tr>`
        }).join('')
        const search = document.querySelector('input[placeholder="Cari nasabah..."]')
        const selects = document.querySelectorAll('.filter-group select')
        const periodStart = document.querySelector('[data-period-start]')
        const periodEnd = document.querySelector('[data-period-end]')
        const activeFilters = document.querySelector('.active-filters')
        const paginationSummary = document.querySelector('.pagination div')
        const paginationButtons = document.querySelectorAll('.page-btn')
        const parseDate = (value) => {
            const text = String(value || '').trim()
            if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(text)
            const match = text.match(/(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/)
            if (!match) return null
            const months = { Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5, Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11 }
            const year = Number(match[3] || new Date().getFullYear())
            return months[match[2]] === undefined ? null : new Date(year, months[match[2]], Number(match[1]))
        }
        const applyFilters = () => {
            body.querySelector('.filter-empty')?.remove()
            const status = selects[0]?.value || 'Semua Status'
            const type = selects[1]?.value || 'Semua Tipe'
            const balance = selects[2]?.value || 'Min - Max Saldo'
            const minDate = periodStart?.value ? new Date(`${periodStart.value}T00:00:00`) : null
            const maxDate = periodEnd?.value ? new Date(`${periodEnd.value}T23:59:59`) : null
            const matchesBalance = (value) => balance === 'Min - Max Saldo' || balance === 'Di bawah Rp 1 juta' && value < 1_000_000 || balance === 'Rp 1 - 5 juta' && value >= 1_000_000 && value <= 5_000_000 || balance === 'Rp 5 - 10 juta' && value > 5_000_000 && value <= 10_000_000 || balance === 'Di atas Rp 10 juta' && value > 10_000_000
                ;[...body.querySelectorAll('tr')].forEach((row) => {
                    const rowDate = parseDate(row.dataset.date)
                    row.hidden = (status !== 'Semua Status' && row.dataset.status !== status) || (type !== 'Semua Tipe' && row.dataset.type !== type) || !matchesBalance(Number(row.dataset.balance)) || (minDate && rowDate && rowDate < minDate) || (maxDate && rowDate && rowDate > maxDate)
                })
            paginationButtons.forEach((button) => button.classList.toggle('active', button.textContent.trim() === '1'))
            const visibleCount = [...body.querySelectorAll('tr')].filter((row) => !row.hidden).length
            if (visibleCount === 0) {
                const emptyRow = document.createElement('tr')
                emptyRow.className = 'filter-empty'
                emptyRow.innerHTML = '<td colspan="6" style="padding: 28px; text-align: center; color: #6b7280;">Tidak ada data yang sesuai dengan filter.</td>'
                body.appendChild(emptyRow)
            }
            if (paginationSummary) paginationSummary.textContent = `Menampilkan ${visibleCount} data simpanan`
            const periodLabel = minDate || maxDate ? `${periodStart?.value || 'Awal'} - ${periodEnd?.value || 'Akhir'}` : 'Semua Periode'
            if (activeFilters) activeFilters.innerHTML = `Filter Aktif: <span class="chip">${periodLabel}</span> <span class="chip">${status}</span> <span class="chip">${type}</span> <span class="chip">${balance}</span>`
        }
        search?.addEventListener('input', () => [...body.querySelectorAll('tr')].forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(search.value.toLowerCase()) }))
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Terapkan') && button.addEventListener('click', applyFilters))
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Reset') && button.addEventListener('click', () => { selects.forEach((select) => { select.selectedIndex = 0 }); if (periodStart) periodStart.value = ''; if (periodEnd) periodEnd.value = ''; if (search) search.value = ''; applyFilters(); body.querySelector('.filter-empty')?.remove();[...body.querySelectorAll('tr')].forEach((row) => { row.hidden = false }); if (paginationSummary) paginationSummary.textContent = `Menampilkan ${rows(savings).length} data simpanan` }))
        if (paginationSummary) paginationSummary.textContent = `Menampilkan ${rows(savings).length} data simpanan`
        document.querySelector('.btn-primary')?.addEventListener('click', () => location.href = '/simpanan/transaksi')
        document.querySelectorAll('.page-btn').forEach((button) => button.addEventListener('click', () => {
            document.querySelectorAll('.page-btn').forEach((item) => item.classList.remove('active'))
            button.classList.add('active')
            const pageNumber = Number(button.textContent)
            if (Number.isFinite(pageNumber)) [...body.querySelectorAll('tr')].forEach((row, index) => { row.hidden = Math.floor(index / 10) + 1 !== pageNumber })
        }))
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('⋮') && button.addEventListener('click', () => location.href = `/simpanan/data?id=${button.dataset.detail}`))
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Export CSV') && button.addEventListener('click', () => download('data-simpanan.csv', [['Nasabah', 'No. Rekening', 'Tipe Simpanan', 'Saldo', 'Status'], ...rows(savings).map((item) => [customerMap.get(Number(item.nasabahId))?.nama || 'Nasabah', item.noRekening || `SP-${item.nasabahId}`, item.jenisSimpanan || 'Simpanan Sukarela', money(item.saldoAkhir), Number(item.saldoAkhir) > 0 ? 'AKTIF' : 'TIDAK AKTIF'])])))
    }

    const loadLoans = async () => {
        const loans = rows(await request('/pinjaman'))
        const body = document.querySelector('tbody')
        if (!body) return
        const filterSelects = document.querySelectorAll('.filter-group select')
        const setOptions = (select, values) => {
            if (!select) return
            select.innerHTML = values.map((value) => `<option>${value}</option>`).join('')
        }
        setOptions(filterSelects[0], ['Semua Status', ...[...new Set(loans.map((item) => item.status).filter(Boolean))]])
        setOptions(filterSelects[1], ['Semua Tenor', ...[...new Set(loans.map((item) => `${item.tenor} bln`).filter(Boolean))]])
        body.innerHTML = loans.map((item) => { const risk = item.risiko || (item.status === 'approved' ? 'Rendah' : item.status === 'pending' ? 'Tinggi' : 'Sedang'); return `<tr><td><div class="user-cell"><div class="avatar">${(item.nasabah?.nama || 'Nasabah').slice(0, 2).toUpperCase()}</div><div class="user-info"><span class="user-name">${item.nasabah?.nama || 'Nasabah'}</span><span class="user-role">L-${String(item.id).padStart(6, '0')}</span></div></div></td><td>${item.nasabah?.pekerjaan || '-'}</td><td style="font-weight: 600;">${money(item.jumlahPinjaman)}</td><td>${item.tenor} bln</td><td>${risk}</td><td><span class="badge status-review">${item.status || 'Review'}</span></td><td><button style="border:none; background:none; cursor:pointer;">👁️</button></td></tr>` }).join('')
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Export Data') && button.addEventListener('click', () => download('data-pinjaman.csv', [['Nama', 'Pekerjaan', 'Jumlah Pinjaman', 'Tenor', 'Status'], ...loans.map((item) => [item.nasabah?.nama || 'Nasabah', item.nasabah?.pekerjaan || '-', money(item.jumlahPinjaman), item.tenor, item.status || 'Review'])])))
        document.querySelectorAll('select').forEach((select) => select.addEventListener('change', () => {
            const status = [...document.querySelectorAll('select')][0]?.value || 'Semua Status'
            const tenor = [...document.querySelectorAll('select')][1]?.value || 'Semua Tenor'
            document.querySelectorAll('tbody tr').forEach((row) => { row.hidden = (status !== 'Semua Status' && !row.textContent.toLowerCase().includes(status.toLowerCase())) || (tenor !== 'Semua Tenor' && !row.textContent.toLowerCase().includes(tenor.toLowerCase())) })
        }))
        document.querySelectorAll('.risk-chip').forEach((chip) => chip.addEventListener('click', () => {
            const selected = chip.textContent.trim().toLowerCase()
            document.querySelectorAll('.risk-chip').forEach((item) => { item.classList.remove('active'); item.style.backgroundColor = ''; item.style.color = '' })
            chip.classList.add('active')
            chip.style.backgroundColor = selected === 'rendah' ? '#def7ec' : selected === 'sedang' ? '#fef3c7' : '#fee2e2'
            chip.style.color = selected === 'rendah' ? '#03543f' : selected === 'sedang' ? '#92400e' : '#991b1b'
            document.querySelectorAll('tbody tr').forEach((row) => { row.hidden = selected !== 'rendah' && selected !== 'sedang' && selected !== 'tinggi' ? false : !row.textContent.toLowerCase().includes(selected) })
        }))
        document.querySelectorAll('tbody tr button').forEach((button, index) => button.addEventListener('click', () => {
            const item = loans[index]
            if (item) alert(`${item.nasabah?.nama || 'Nasabah'}\nPinjaman: ${money(item.jumlahPinjaman)}\nStatus: ${item.status}`)
        }))
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Pengajuan Baru') && button.addEventListener('click', () => {
            const dialog = document.createElement('dialog')
            dialog.innerHTML = `<form method="dialog" style="padding: 24px; min-width: 320px; display: grid; gap: 12px;"><h2>Pengajuan Pinjaman Baru</h2><input name="nama" required placeholder="Nama pemohon"><input name="nik" placeholder="NIK"><input name="penghasilan" type="number" min="0" placeholder="Penghasilan per bulan"><input name="jumlah" required type="number" min="1" placeholder="Jumlah pinjaman"><input name="tenor" required type="number" min="1" placeholder="Tenor (bulan)"><input name="bunga" type="number" min="0" placeholder="Bunga (%)"><input name="tujuan" placeholder="Tujuan pinjaman"><p data-error style="color: #b91c1c;"></p><div style="display:flex; gap:8px; justify-content:flex-end;"><button value="cancel">Batal</button><button value="submit">Ajukan</button></div></form>`
            document.body.appendChild(dialog)
            dialog.showModal()
            dialog.querySelector('button[value="cancel"]').addEventListener('click', (event) => {
                event.preventDefault()
                dialog.close()
            })
            dialog.querySelector('form').addEventListener('submit', async (event) => {
                if (event.submitter?.value === 'cancel') {
                    dialog.close()
                    return
                }
                event.preventDefault()
                const form = new FormData(dialog.querySelector('form'))
                try {
                    await request('/pinjaman', { method: 'POST', body: JSON.stringify({ nama: form.get('nama'), nik: form.get('nik'), penghasilan: Number(form.get('penghasilan') || 0), jumlah: Number(form.get('jumlah')), jumlahPinjaman: Number(form.get('jumlah')), tenor: Number(form.get('tenor')), tenorBulan: Number(form.get('tenor')), bunga: Number(form.get('bunga') || 0), sukuBunga: Number(form.get('bunga') || 0), tujuan: form.get('tujuan'), jenisBunga: 'efektif' }) })
                    dialog.close()
                    location.reload()
                } catch (error) {
                    dialog.querySelector('[data-error]').textContent = error.message || 'Pengajuan gagal disimpan.'
                }
            })
            dialog.addEventListener('close', () => dialog.remove(), { once: true })
        }))
    }

    const loadReport = async () => {
        const response = await request('/analisis-pekerjaan')
        const reportRows = rows(response?.data || response)
        const items = [...document.querySelectorAll('.risk-item')]
        reportRows.slice(0, items.length).forEach((item, index) => { const value = items[index].querySelector('.risk-percent'); const name = items[index].querySelector('.risk-name'); if (name) name.lastChild.textContent = ` ${item.pekerjaan || 'Pekerjaan'}`; if (value) value.textContent = `${Number(item.persentaseKeterlambatan || 0)}%` })
        document.querySelectorAll('button').forEach((button) => button.textContent.includes('Ekspor Data') && button.addEventListener('click', () => download('laporan-analitik.csv', [['Pekerjaan', 'Keterlambatan'], ...reportRows.map((item) => [item.pekerjaan || 'Pekerjaan', `${Number(item.persentaseKeterlambatan || 0)}%`])])))
        const destinations = ['/pinjaman', '/pinjaman/analisis-skor-risiko', '/simpanan', '/laporan/ldr-likuiditas', '/nasabah/tidak-aktif']
        document.querySelectorAll('.report-card').forEach((card, index) => card.addEventListener('click', () => { location.href = destinations[index] }))
        document.querySelectorAll('.btn-text').forEach((button) => button.addEventListener('click', () => { location.href = '/analisis' }))
    }

    const work = page === 'index.html' ? loadDashboard : page === 'simpanan.html' ? loadSavings : page === 'pinjaman.html' ? loadLoans : loadReport
    work().catch((error) => console.error('Gagal memuat desain asli', error))
})()
