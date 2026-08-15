// ============================================================
// ============ FUNGSI MODUL ORANG TUA (ORTU ONLY) ============
// ============================================================

function renderOrangTua() {
  const profil = App.user.profil;
  const roleLower = App.user.role ? App.user.role.toLowerCase() : '';
  if (roleLower !== 'ortu' && roleLower !== 'orang_tua' && roleLower !== 'orangtua' && roleLower !== 'orang tua') {
    document.getElementById('orang_tua').innerHTML = '<div class="form-section"><p>Menu ini hanya untuk Orang Tua.</p></div>';
    return;
  }

  const html = `
<div class="form-section">
  <h3>👋 HALO, BAPAK/IBU WALI DARI ${profil.nama}</h3>
  <p style="margin-bottom: 20px; color: #555; font-size: 14px;">Selamat datang di portal informasi siswa.</p>
  
  <div style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 20px;">
    <h4 style="color:#1565c0; margin-bottom:15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">📋 Profil Siswa</h4>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666; font-weight: 500;">Nama Lengkap:</span>
        <span style="font-weight: bold; color: #333;">${profil.nama}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666; font-weight: 500;">NIS:</span>
        <span style="font-weight: bold; color: #333;">${profil.nis}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #666; font-weight: 500;">Kelas:</span>
        <span style="font-weight: bold; color: #333;">${profil.kelas}</span>
      </div>
    </div>
  </div>

  <div class="form-grid">
    <div class="form-group">
      <label>Bulan:</label>
      <select id="ortuBulan" class="form-control">
        <option value="ALL">Semua Bulan</option>
        <option value="1">Januari</option>
        <option value="2">Februari</option>
        <option value="3">Maret</option>
        <option value="4">April</option>
        <option value="5">Mei</option>
        <option value="6">Juni</option>
        <option value="7">Juli</option>
        <option value="8">Agustus</option>
        <option value="9">September</option>
        <option value="10">Oktober</option>
        <option value="11">November</option>
        <option value="12">Desember</option>
      </select>
    </div>
    <div class="form-group">
      <label>Tahun:</label>
      <select id="ortuTahun" class="form-control">
        <option value="ALL">Semua Tahun</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
        <option value="2027">2027</option>
      </select>
    </div>
  </div>
  
  <div style="display:flex; gap:10px; margin-bottom:20px;">
    <button id="btnPreviewOrtu" class="btn btn-primary" onclick="previewLaporanOrtu(true)">🔍 TAMPILKAN LAPORAN</button>
    <button id="btnDownloadOrtu" class="btn btn-secondary" onclick="downloadLaporanOrtu()">📥 CETAK PDF</button>
  </div>

  <div id="ortuPreviewContainer" style="display: none; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow-x: auto;">
    <div id="ortuPreviewContent"></div>
  </div>
</div>
  `;

  document.getElementById('orang_tua').innerHTML = html;
  
  const now = new Date();
  document.getElementById('ortuBulan').value = now.getMonth() + 1;
  document.getElementById('ortuTahun').value = now.getFullYear();
}

async function fetchOrtuData(nis, kelas, bulan, tahun) {
  let walasData = { nama: '-' };
  let resWali = await supaClient.from('data_guru').select('nama').eq('wali_kelas', kelas).limit(1);
  if (resWali.data && resWali.data.length > 0) walasData = resWali.data[0];

  let startDate = '2000-01-01';
  let endDate = '2100-12-31';
  if (bulan !== 'ALL' && tahun !== 'ALL') {
    const y = parseInt(tahun);
    const m = parseInt(bulan);
    startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  } else if (tahun !== 'ALL') {
    startDate = `${tahun}-01-01`;
    endDate = `${tahun}-12-31`;
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  let d = new Date(today);
  const day = d.getDay() || 7; 
  if (day !== 1) d.setHours(-24 * (day - 1));
  const weekStartStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monthStartStr = `${yyyy}-${mm}-01`;

  const absenQueryAll = supaClient.from('absensi').select('tanggal, status').eq('nis', nis);
  const shalatQueryAll = supaClient.from('shalat').select('tanggal, status').eq('nis', nis);
  const sikapQueryAll = supaClient.from('catatan').select('tanggal, poin, jenis, detail').eq('nis', nis);
  const pelanggaranQueryAll = supaClient.from('pelanggaran').select('tanggal, poin, jenis, detail').eq('nis', nis);
  const pembinaanQueryAll = supaClient.from('pembinaan_wali').select('tanggal, topik, masalah, isi, tindak_lanjut').eq('nis', nis);
  const nilaiQueryAll = supaClient.from('nilai').select('*').eq('nis', nis);
  
  const [resAbsen, resShalat, resSikap, resPelanggaran, resPembinaan, resNilai] = await Promise.all([
    absenQueryAll, shalatQueryAll, sikapQueryAll, pelanggaranQueryAll, pembinaanQueryAll, nilaiQueryAll
  ]);

  const absenRealtime = {
    hariIni: {H:0,I:0,S:0,A:0,C:0,T:0},
    mingguIni: {H:0,I:0,S:0,A:0,C:0,T:0},
    bulanIni: {H:0,I:0,S:0,A:0,C:0,T:0}
  };
  
  const absenFiltered = {H:0,I:0,S:0,A:0,B:0,C:0}; 
  const shalatFiltered = {Y:0,T:0,H:0};
  let sikapFiltered = [];
  let pembinaanFiltered = [];
  
  const stsMap = (s) => (s === 'H' || s === 'I' || s === 'S' || s === 'A' || s === 'C' || s === 'T') ? s : 'H';
  
  if (resAbsen.data) {
    const getPrioritasStatus = (s) => {
      switch (s) {
        case 'C': return 6;
        case 'A': return 5;
        case 'S': return 4;
        case 'I': return 3;
        case 'T': return 2;
        case 'H': return 1;
        default: return 0;
      }
    };

    const statusHarianAll = {};
    resAbsen.data.forEach(r => {
      const s = stsMap(r.status);
      const prev = statusHarianAll[r.tanggal];
      if (!prev || getPrioritasStatus(s) > getPrioritasStatus(prev)) {
        statusHarianAll[r.tanggal] = s;
      }
    });

    for (const tgl in statusHarianAll) {
      const s = statusHarianAll[tgl];
      if (tgl === todayStr) absenRealtime.hariIni[s]++;
      if (tgl >= weekStartStr) absenRealtime.mingguIni[s]++;
      if (tgl >= monthStartStr) absenRealtime.bulanIni[s]++;
      
      if (bulan === 'ALL' && tahun === 'ALL') {
        if (s === 'C') absenFiltered['B']++; 
        else if (s === 'T') absenFiltered['C']++; 
        else if (absenFiltered[s] !== undefined) absenFiltered[s]++;
      } else if (tgl >= startDate && tgl <= endDate) {
        if (s === 'C') absenFiltered['B']++;
        else if (s === 'T') absenFiltered['C']++;
        else if (absenFiltered[s] !== undefined) absenFiltered[s]++;
      }
    }
  }

  if (resShalat.data) {
    resShalat.data.forEach(r => {
      if ((bulan === 'ALL' && tahun === 'ALL') || (r.tanggal >= startDate && r.tanggal <= endDate)) {
        if (r.status === 'Y' || r.status === 'T' || r.status === 'H') shalatFiltered[r.status]++;
      }
    });
  }
  
  let totalBobot = 0;
  let allSikap = [];
  if (resSikap.data) allSikap = allSikap.concat(resSikap.data);
  if (resPelanggaran.data) allSikap = allSikap.concat(resPelanggaran.data);
  
  allSikap.forEach(r => {
    if ((bulan === 'ALL' && tahun === 'ALL') || (r.tanggal >= startDate && r.tanggal <= endDate)) {
      sikapFiltered.push(r);
      totalBobot += (r.poin || 0);
    }
  });
  sikapFiltered.sort((a,b) => (a.tanggal < b.tanggal ? 1 : -1));

  if (resPembinaan.data) {
    resPembinaan.data.forEach(r => {
      if ((bulan === 'ALL' && tahun === 'ALL') || (r.tanggal >= startDate && r.tanggal <= endDate)) {
        pembinaanFiltered.push({
          tanggal: r.tanggal, topik: r.topik, masalah: r.masalah, isi: r.isi, tindakLanjut: r.tindak_lanjut
        });
      }
    });
    pembinaanFiltered.sort((a,b) => (a.tanggal < b.tanggal ? 1 : -1));
  }

  const mapelNilaiMap = {};
  if (resNilai.data) {
    resNilai.data.forEach(r => {
      if ((bulan === 'ALL' && tahun === 'ALL') || (r.tanggal >= startDate && r.tanggal <= endDate) || !r.tanggal) {
        if (!mapelNilaiMap[r.matapelajaran]) {
          mapelNilaiMap[r.matapelajaran] = {};
        }
        mapelNilaiMap[r.matapelajaran][r.jenistugas + ' ' + r.nopenilaian] = r.nilai;
      }
    });
  }
  
  const formattedNilai = [];
  const nilaiBelumLengkap = [];
  
  for (const mapel in mapelNilaiMap) {
    const vals = mapelNilaiMap[mapel];
    let sum = 0; let count = 0;
    const missing = [];
    
    for (const k in vals) {
      if (vals[k] === null || vals[k] === 0 || vals[k] === '0' || vals[k] === '') {
        missing.push(k);
      } else {
        sum += parseFloat(vals[k]) || 0;
        count++;
      }
    }
    
    formattedNilai.push({
      mapel: mapel,
      nilai: vals,
      rataRata: count > 0 ? (sum/count).toFixed(1) : 0
    });
    
    if (missing.length > 0) {
      nilaiBelumLengkap.push({ mapel, missing });
    }
  }

  let periodeStr = "Semua Waktu";
  if (bulan !== 'ALL' && tahun !== 'ALL') {
     const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
     periodeStr = `${monthNames[parseInt(bulan)-1]} ${tahun}`;
  } else if (tahun !== 'ALL') {
     periodeStr = `Tahun ${tahun}`;
  } else if (bulan !== 'ALL') {
     const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
     periodeStr = `${monthNames[parseInt(bulan)-1]} (Semua Tahun)`;
  }

  return {
    siswa: { nama: App.user.profil.nama },
    kelas: kelas,
    walas: { nama: walasData.nama },
    periode: periodeStr,
    absenRealtime: absenRealtime,
    absen: absenFiltered,
    shalat: shalatFiltered,
    sikap: sikapFiltered,
    totalBobot: totalBobot,
    wali: pembinaanFiltered,
    nilai: formattedNilai,
    nilaiBelumLengkap: nilaiBelumLengkap
  };
}

async function previewLaporanOrtu(forceRefresh = false) {
  const profil = App.user.profil;
  const nis = profil.nis;
  const kelas = profil.kelas;
  const bulan = document.getElementById('ortuBulan').value;
  const tahun = document.getElementById('ortuTahun').value;

  const btn = document.getElementById('btnPreviewOrtu');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ MENYIAPKAN...';
  } else {
    showLoading(true, 'Sedang menyiapkan preview...');
  }

  try {
    const data = await fetchOrtuData(nis, kelas, bulan, tahun);
    document.getElementById('ortuPreviewContainer').style.display = 'block';
    document.getElementById('ortuPreviewContent').innerHTML = buildOrtuDashboardHTML(data);
  } catch(err) {
    showError("Gagal mengambil data: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🔍 TAMPILKAN LAPORAN';
    } else {
      showLoading(false);
    }
  }
}

async function downloadLaporanOrtu() {
  const profil = App.user.profil;
  const nis = profil.nis;
  const kelas = profil.kelas;
  const bulan = document.getElementById('ortuBulan').value;
  const tahun = document.getElementById('ortuTahun').value;

  const btn = document.getElementById('btnDownloadOrtu');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ SEDANG MEMPROSES...';
  } else {
    showLoading(true, 'Sedang menyiapkan PDF...');
  }

  try {
    const data = await fetchOrtuData(nis, kelas, bulan, tahun);
    const htmlContent = buildOrtuDashboardHTML(data);
    
    let signatureDate = new Date();
    if (bulan !== 'ALL' && tahun !== 'ALL') {
      signatureDate = new Date(parseInt(tahun), parseInt(bulan), 0);
    }
    const signatureStr = signatureDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
    
    const printHtml = `
      <html>
      <head>
        <title>Rapor Orang Tua - ${data.siswa.nama}</title>
        <style>
          @page { size: A4 portrait; margin: 1.5cm; }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body { font-family: Arial, sans-serif; font-size: 12px; margin:0; padding:0; }
        </style>
      </head>
      <body>
        ${typeof KOP_SURAT_LAPORAN !== 'undefined' ? KOP_SURAT_LAPORAN : ''}
        <h3 style="text-align:center; text-transform:uppercase; margin-bottom:20px;">LAPORAN PERKEMBANGAN SISWA</h3>
        ${htmlContent}
        <div style="margin-top: 50px; text-align: right;">
          <p>Silayang, ${signatureStr}</p>
          <p>Wali Kelas</p>
          <div style="margin-top: 60px;">
            <b><u>${data.walas.nama}</u></b>
          </div>
        </div>
      </body>
      </html>
    `;
    
    openReportAndPrint(printHtml);
  } catch(err) {
    showError("Gagal membuat laporan: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '📥 CETAK PDF';
    } else {
      showLoading(false);
    }
  }
}

    function buildOrtuDashboardHTML(data) {
      const siswa = data.siswa;
      const absenR = data.absenRealtime || { 
        hariIni: {H:0,I:0,S:0,A:0,C:0,T:0}, 
        mingguIni: {H:0,I:0,S:0,A:0,C:0,T:0}, 
        bulanIni: {H:0,I:0,S:0,A:0,C:0,T:0} 
      };
      const sikapList = data.sikap || data.catatan || [];
      const totalBobot = data.totalBobot !== undefined ? data.totalBobot : null;
      
      let html = `
      <div style="margin-bottom:20px; padding-bottom:10px; border-bottom:2px solid #2e7d32; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="margin:0; color:#2e7d32; font-size:18px;">Dasbor Siswa</h3>
          <p style="margin:5px 0 0 0; color:#666; font-size:14px;">${siswa.nama} | Kelas ${data.kelas}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:#666;">Wali Kelas</div>
          <div style="font-weight:bold; color:#333;">${data.walas.nama}</div>
        </div>
      </div>
      
      <h4 style="margin:0 0 15px 0; color:#333;">Statistik Kehadiran (Sekolah)</h4>
      <div class="form-grid" style="margin-bottom: 20px;">
        <!-- Hari Ini -->
        <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-radius: 8px;">
          <h5 style="margin:0 0 10px 0; color:#333; text-align:center; border-bottom:1px solid #ddd; padding-bottom:8px; font-size:14px;">Hari Ini</h5>
          <div style="display:flex; justify-content:space-between; gap:2px;">
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Hadir</div><div style="font-size:16px; font-weight:bold; color:#43a047;">${absenR.hariIni.H || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Izin</div><div style="font-size:16px; font-weight:bold; color:#fbc02d;">${absenR.hariIni.I || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Sakit</div><div style="font-size:16px; font-weight:bold; color:#1e88e5;">${absenR.hariIni.S || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Cabut</div><div style="font-size:16px; font-weight:bold; color:#fb8c00;">${absenR.hariIni.C || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Telat</div><div style="font-size:16px; font-weight:bold; color:#8e24aa;">${absenR.hariIni.T || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Alpa</div><div style="font-size:16px; font-weight:bold; color:#e53935;">${absenR.hariIni.A || 0}</div></div>
          </div>
        </div>
        <!-- Minggu Ini -->
        <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-radius: 8px;">
          <h5 style="margin:0 0 10px 0; color:#333; text-align:center; border-bottom:1px solid #ddd; padding-bottom:8px; font-size:14px;">Minggu Ini</h5>
          <div style="display:flex; justify-content:space-between; gap:2px;">
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Hadir</div><div style="font-size:16px; font-weight:bold; color:#43a047;">${absenR.mingguIni.H || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Izin</div><div style="font-size:16px; font-weight:bold; color:#fbc02d;">${absenR.mingguIni.I || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Sakit</div><div style="font-size:16px; font-weight:bold; color:#1e88e5;">${absenR.mingguIni.S || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Cabut</div><div style="font-size:16px; font-weight:bold; color:#fb8c00;">${absenR.mingguIni.C || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Telat</div><div style="font-size:16px; font-weight:bold; color:#8e24aa;">${absenR.mingguIni.T || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Alpa</div><div style="font-size:16px; font-weight:bold; color:#e53935;">${absenR.mingguIni.A || 0}</div></div>
          </div>
        </div>
        <!-- Bulan Ini -->
        <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-radius: 8px;">
          <h5 style="margin:0 0 10px 0; color:#333; text-align:center; border-bottom:1px solid #ddd; padding-bottom:8px; font-size:14px;">Bulan Ini</h5>
          <div style="display:flex; justify-content:space-between; gap:2px;">
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Hadir</div><div style="font-size:16px; font-weight:bold; color:#43a047;">${absenR.bulanIni.H || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Izin</div><div style="font-size:16px; font-weight:bold; color:#fbc02d;">${absenR.bulanIni.I || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Sakit</div><div style="font-size:16px; font-weight:bold; color:#1e88e5;">${absenR.bulanIni.S || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Cabut</div><div style="font-size:16px; font-weight:bold; color:#fb8c00;">${absenR.bulanIni.C || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Telat</div><div style="font-size:16px; font-weight:bold; color:#8e24aa;">${absenR.bulanIni.T || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Alpa</div><div style="font-size:16px; font-weight:bold; color:#e53935;">${absenR.bulanIni.A || 0}</div></div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom:20px; padding:10px; background:#fff3e0; border-left:4px solid #ff9800; border-radius:4px; font-size:13px; color:#e65100;">
        <strong>Catatan:</strong> Data detail di bawah ini difilter berdasarkan periode: <strong>${data.periode}</strong>
      </div>

      <div class="form-grid" style="margin-bottom: 20px;">
        <!-- REKAP KEHADIRAN (FILTERED) -->
        <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-left: 4px solid #43a047; border-radius: 8px;">
          <h4 style="margin:0 0 10px 0; color:#43a047; font-size:14px;">Rekap Kehadiran (${data.periode})</h4>
          <div style="display:flex; justify-content:space-between; gap:2px;">
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Hadir</div><div style="font-size:16px; font-weight:bold; color:#43a047;">${data.absen.H || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Izin</div><div style="font-size:16px; font-weight:bold; color:#fbc02d;">${data.absen.I || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Sakit</div><div style="font-size:16px; font-weight:bold; color:#1e88e5;">${data.absen.S || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Cabut</div><div style="font-size:16px; font-weight:bold; color:#fb8c00;">${data.absen.B || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Telat</div><div style="font-size:16px; font-weight:bold; color:#8e24aa;">${data.absen.C || 0}</div></div>
            <div style="text-align:center;"><div style="font-size:11px; color:#666;">Alpa</div><div style="font-size:16px; font-weight:bold; color:#e53935;">${data.absen.A || 0}</div></div>
          </div>
        </div>

        <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-left: 4px solid #8e24aa; border-radius: 8px;">
          <h4 style="margin:0 0 10px 0; color:#8e24aa; font-size:14px;">Total Shalat (${data.periode})</h4>
          <div style="display:flex; gap:15px; align-items:center;">
            <div style="flex:1; text-align:center; background:#f3e5f5; padding:10px; border-radius:8px;">
              <div style="font-size:12px; color:#666;">Ya</div>
              <div style="font-size:20px; font-weight:bold; color:#8e24aa;">${data.shalat.Y}</div>
            </div>
            <div style="flex:1; text-align:center; background:#ffebee; padding:10px; border-radius:8px;">
              <div style="font-size:12px; color:#666;">Tidak</div>
              <div style="font-size:20px; font-weight:bold; color:#d32f2f;">${data.shalat.T}</div>
            </div>
            <div style="flex:1; text-align:center; background:#e0f2f1; padding:10px; border-radius:8px;">
              <div style="font-size:12px; color:#666;">Haid</div>
              <div style="font-size:20px; font-weight:bold; color:#00897b;">${data.shalat.H}</div>
            </div>
          </div>
        </div>
      </div>
      `;
      
      let totalBobotColor = totalBobot >= 0 ? '#2e7d32' : '#c62828';
      let totalBobotBg = totalBobot >= 0 ? '#e8f5e9' : '#ffebee';
      let totalBobotBorder = totalBobot >= 0 ? '#43a047' : '#d32f2f';
      let totalBobotText = totalBobot > 0 ? '+' + totalBobot : totalBobot;

      html += `
      <div style="display:flex; justify-content:space-between; align-items:center; margin: 0 0 10px 0;">
        <h4 style="margin:0; color:#333;">Catatan Sikap & Pelanggaran</h4>
        ${totalBobot !== null ? `<div style="background:${totalBobotBg}; color:${totalBobotColor}; padding:4px 12px; border-radius:15px; font-weight:bold; font-size:14px; border:1px solid ${totalBobotBorder};">Total Bobot: ${totalBobotText}</div>` : ''}
      </div>
      <div class="form-section" style="padding:0; margin-bottom: 20px; overflow:hidden; border:1px solid #eee;">
      `;
      
      if (sikapList.length === 0) {
        html += `<p style="padding:15px; color:#666; font-size:13px; text-align:center; margin:0;">Belum ada catatan sikap/pelanggaran pada periode ini.</p>`;
      } else {
        sikapList.forEach(s => {
          const isPelanggaran = s.jenis.toLowerCase().includes('pelanggaran');
          const colorClass = isPelanggaran ? '#d32f2f' : '#43a047';
          const bgClass = isPelanggaran ? '#ffebee' : '#e8f5e9';
          html += `
          <div style="padding: 12px 15px; border-bottom: 1px solid #eee; display:flex; gap:10px; align-items:flex-start;">
            <div style="background:${bgClass}; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; color:${colorClass}; white-space:nowrap; min-width:100px; text-align:center;">
              ${s.tanggal}
            </div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <div style="font-weight:bold; font-size:13px; color:${colorClass};">${s.jenis}</div>
                <div style="font-weight:bold; font-size:12px; color:${colorClass}; background:${bgClass}; padding:2px 6px; border-radius:4px;">
                  Bobot: ${s.poin > 0 ? '+' + s.poin : s.poin}
                </div>
              </div>
              <div style="font-size:13px; color:#555; line-height:1.4;">${s.detail}</div>
            </div>
          </div>
          `;
        });
      }
      html += `</div>`;
      
      html += `<h4 style="margin:0 0 10px 0; color:#333;">Catatan Pembinaan Wali</h4>`;
      
      if (data.wali.length === 0) {
        html += `<div class="form-section" style="padding:15px; margin-bottom: 20px; border:1px solid #eee;">
          <p style="color:#666; font-size:13px; text-align:center; margin:0;">Belum ada catatan pembinaan dari Wali pada periode ini.</p>
        </div>`;
      } else {
        html += `<div style="display:flex; flex-direction:column; gap:15px; margin-bottom: 20px;">`;
        data.wali.forEach(w => {
          html += `
          <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-radius: 8px; display:flex; flex-wrap:wrap; gap:15px; align-items:flex-start;">
            <div style="flex: 0 0 auto;">
              <span style="display:inline-block; background:#e3f2fd; color:#1565c0; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:12px;">
                ${w.tanggal}
              </span>
            </div>
            <div style="flex: 1 1 120px; font-size:14px; font-weight:bold; color:#333;">
              ${w.topik}
            </div>
            <div style="flex: 2 1 200px; font-size:13px; color:#555; line-height:1.4;">
              <span style="font-weight:600; color:#d32f2f;">Masalah:</span> ${w.masalah}
            </div>
            <div style="flex: 2 1 200px; font-size:13px; color:#555; line-height:1.4;">
              <span style="font-weight:600; color:#43a047;">Isi Nasihat:</span> ${w.isi}
            </div>
            <div style="flex: 2 1 200px; font-size:13px; color:#555; line-height:1.4;">
              <span style="font-weight:600; color:#1e88e5;">Tindak Lanjut:</span> ${w.tindakLanjut}
            </div>
          </div>
          `;
        });
        html += `</div>`;
      }
      
      html += `<h4 style="margin:0 0 10px 0; color:#333;">Rekapitulasi Nilai</h4>`;
      
      if (data.nilai.length === 0) {
        html += `<div class="form-section" style="padding:15px; margin-bottom: 20px; border:1px solid #eee;">
          <p style="color:#666; font-size:13px; text-align:center; margin:0;">Belum ada data nilai yang diinput pada periode ini.</p>
        </div>`;
      } else {
        html += `<div style="display:flex; flex-direction:column; gap:15px; margin-bottom: 20px;">`;
        data.nilai.forEach(n => {
          let rincianHTML = '';
          for (const [jenis, val] of Object.entries(n.nilai)) {
            let displayVal = val;
            if (val === 0 || val === '0' || val === '' || val === null || val === undefined) {
              displayVal = '<span style="color:#d32f2f; font-weight:bold;">Belum Lengkap</span>';
            }
            rincianHTML += `<span style="display:inline-block; margin-right:15px;"><strong style="color:#555;">${jenis}:</strong> ${displayVal}</span>`;
          }

          html += `
          <div class="form-section" style="padding: 15px; margin-bottom:0; border: 1px solid #ddd; border-left: 4px solid #1e88e5; border-radius: 8px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;">
            <div style="flex: 1 1 150px; font-size:15px; font-weight:bold; color:#1565c0;">
              ${n.mapel}
            </div>
            <div style="flex: 3 1 300px; font-size:13px; color:#333;">
              ${rincianHTML}
            </div>
            <div style="flex: 0 0 auto; background:#e3f2fd; padding:5px 12px; border-radius:15px; font-weight:bold; color:#1565c0; font-size:13px;">
              Rata-rata: ${n.rataRata}
            </div>
          </div>
          `;
        });
        html += `</div>`;
      }
      
      if (data.nilaiBelumLengkap && data.nilaiBelumLengkap.length > 0) {
        let listItems = '';
        data.nilaiBelumLengkap.forEach(item => {
           listItems += `<li style="margin-bottom: 5px;"><b>${item.mapel}</b>: ${item.missing.join(', ')}</li>`;
        });
        html += `
        <div class="form-section" style="padding: 15px; margin-bottom: 20px; border: 1px solid #ffb74d; background-color: #fff3e0; border-radius: 8px;">
          <h4 style="margin:0 0 10px 0; color:#e65100; font-size:14px;">⚠️ Daftar Nilai Belum Lengkap</h4>
          <p style="margin:0 0 10px 0; color:#e65100; font-size:13px;">Anak Anda belum memiliki nilai pada penugasan berikut:</p>
          <ul style="margin: 0; padding-left: 20px; color: #e65100; font-size:13px;">
            ${listItems}
          </ul>
        </div>
        `;
      }
      
      return html;
    }
