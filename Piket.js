// Script khusus untuk fungsionalitas Guru Piket
// Dimuat melalui <script src="Piket.js"></script> di Index.html

let allGuruData = [];

// Membantu untuk meng-override render absen reguler jika usernya piket
async function renderAbsensiPiket() {
  const container = document.getElementById('absenRegulerContainer');
  container.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:20px;border:1px solid #e0e0e0;">
      <h3 style="margin-top:0;margin-bottom:15px;color:#1e88e5;display:flex;align-items:center;gap:8px;">
        <span>👨‍🏫</span> Input Absensi oleh Guru Piket
      </h3>
      <p style="font-size:13px;color:#666;margin-bottom:15px;">
        Silakan pilih guru yang berhalangan hadir. Sistem otomatis menampilkan Mapel dan Kelas yang diajar oleh guru tersebut.
      </p>

      <div class="form-grid">
        <div class="form-group">
          <label>Pilih Guru yang Digantikan</label>
          <select id="piketGuruSelect" onchange="onPiketGuruSelected()" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ccc;">
            <option value="">⏳ Memuat daftar guru...</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" id="absenTanggal" value="${new Date().toISOString().split('T')[0]}" onchange="document.getElementById('absenContainer').style.display='none'">
        </div>

        <div class="form-group">
          <label>Kelas</label>
          <select id="absenKelas" onchange="loadPiketMapel()"><option value="">Pilih Guru Terlebih Dahulu</option></select>
        </div>

        <div class="form-group">
          <label>Mapel</label>
          <select id="absenMapel" onchange="loadPiketJam()"><option value="">Pilih Kelas Terlebih Dahulu</option></select>
        </div>

        <div class="form-group">
          <label>Jam Ke-</label>
          <select id="absenJam" onchange="loadSiswa()">
            <option value="">Pilih Jam</option>
            ${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    
    <div id="absenContainer" style="display:none;background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div style="overflow-x:auto;">
        <table class="data-table" style="width:100%;margin-bottom:20px;">
          <thead>
            <tr>
              <th width="40">No</th>
              <th width="100">NIS</th>
              <th>Nama Siswa</th>
              <th width="260">Status Kehadiran</th>
              <th id="thAbsenShalatSt" width="130">Status Shalat</th>
              <th id="thAbsenShalatJml" width="90">Rakaat</th>
            </tr>
          </thead>
          <tbody id="absenTbody"></tbody>
        </table>
      </div>
      <button class="btn btn-primary" onclick="simpanAbsensi()" style="width:100%;padding:12px;font-size:16px;">
        💾 Simpan Absensi Piket
      </button>
    </div>
  `;

  // Hide the "Edit Data Lampau" toggle because Piket shouldn't edit
  const toggleBtn = document.querySelector('button[onclick="toggleEditMode()"]');
  if (toggleBtn) toggleBtn.style.display = 'none';

  // Fetch semua data guru dari supabase
  try {
    const { data: guruData, error } = await supaClient
      .from('data_guru')
      .select('username, nama, mapel, kelas_yang_diajar')
      .neq('username', 'piket')
      .order('nama');
      
    if (error) throw error;
    allGuruData = guruData || [];
    
    let guruOptions = '<option value="">- Pilih Guru -</option>';
    allGuruData.forEach(g => {
      guruOptions += `<option value="${g.username}">${g.nama}</option>`;
    });
    
    document.getElementById('piketGuruSelect').innerHTML = guruOptions;
  } catch (err) {
    console.error('Error fetching guru:', err);
    document.getElementById('piketGuruSelect').innerHTML = '<option value="">Gagal memuat guru</option>';
  }
}

// Terpicu ketika Piket memilih Guru
function onPiketGuruSelected() {
  document.getElementById('absenContainer').style.display = 'none';
  const username = document.getElementById('piketGuruSelect').value;
  const kelasSelect = document.getElementById('absenKelas');
  const mapelSelect = document.getElementById('absenMapel');
  
  if (!username) {
    kelasSelect.innerHTML = '<option value="">Pilih Guru Terlebih Dahulu</option>';
    mapelSelect.innerHTML = '<option value="">Pilih Kelas Terlebih Dahulu</option>';
    return;
  }
  
  const selectedGuru = allGuruData.find(g => g.username === username);
  if (!selectedGuru) return;
  
  // Set Kelas Options
  let kelasArr = [];
  if (selectedGuru.kelas_yang_diajar && selectedGuru.kelas_yang_diajar !== '-' && selectedGuru.kelas_yang_diajar !== '') {
      kelasArr = selectedGuru.kelas_yang_diajar.split(',').map(s => s.trim());
  }
  
  if (kelasArr.length === 0) {
      kelasSelect.innerHTML = '<option value="">Tidak ada kelas</option>';
  } else {
      let opt = '<option value="">Pilih Kelas</option>';
      kelasArr.forEach(k => opt += `<option value="${k}">${k}</option>`);
      kelasSelect.innerHTML = opt;
  }
  
  // Set Mapel Options based on guru
  let mapelArr = [];
  if (selectedGuru.mapel && selectedGuru.mapel !== '-' && selectedGuru.mapel !== '') {
      mapelArr = selectedGuru.mapel.split(',').map(s => s.trim());
  }
  
  if (mapelArr.length === 0) {
      mapelSelect.innerHTML = '<option value="">Tidak ada mapel</option>';
  } else {
      let opt = '<option value="">Pilih Mapel</option>';
      mapelArr.forEach(m => opt += `<option value="${m}">${m}</option>`);
      mapelSelect.innerHTML = opt;
  }
}

function loadPiketMapel() {
    document.getElementById('absenContainer').style.display = 'none';
    const kelas = document.getElementById('absenKelas').value;
    if(!kelas) {
        document.getElementById('absenMapel').value = "";
    }
}

function loadPiketJam() {
    document.getElementById('absenContainer').style.display = 'none';
    const mapel = document.getElementById('absenMapel').value;
    if(!mapel) {
        document.getElementById('absenJam').value = "";
    }
}
