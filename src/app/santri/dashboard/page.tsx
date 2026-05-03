"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DashboardSantri() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [dataSantri, setDataSantri] = useState<any>(null);
  const [nilai, setNilai] = useState<any[]>([]);
  const [stats, setStats] = useState({ rataRata: 0, semester: "-", tahunAjaran: "-" });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Ambil User Sesi yang sedang login
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 2. Ambil Profil Santri dari tabel santri
      const { data: profil } = await supabase
        .from("santri")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profil) {
        setDataSantri(profil);

        // 3. Ambil Nilai dan relasi Mapel
        const { data: listNilai } = await supabase
          .from("nilai")
          .select(`
            skor,
            semester,
            tahun_ajaran,
            mapel:mapel_id (nama_mapel, kategori)
          `)
          .eq("santri_id", user.id);

        if (listNilai && listNilai.length > 0) {
          setNilai(listNilai);
          
          // Kalkulasi Rata-rata
          const total = listNilai.reduce((acc, curr) => acc + curr.skor, 0);
          setStats({
            rataRata: parseFloat((total / listNilai.length).toFixed(1)),
            semester: listNilai[0].semester,
            tahunAjaran: listNilai[0].tahun_ajaran
          });
        }
      }
    }
    setLoading(false);
  };

  // Fungsi pembantu untuk menentukan Grade (A, B, C)
  const getGrade = (skor: number) => {
    if (skor >= 90) return "A";
    if (skor >= 80) return "B";
    return "C";
  };

  if (loading) return <div className="p-5 text-center">Memuat data...</div>;

  return (
    <div className="container-fluid p-0">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Dashboard Santri</h2>
          <p className="text-secondary">Selamat Datang, {dataSantri?.nama_lengkap}</p>
        </div>
        <div className="d-flex align-items-center gap-3 text-end">
          <div>
            <div className="fw-bold small text-dark">{dataSantri?.nama_lengkap}</div>
            <div className="text-secondary small">Nisn : {dataSantri?.nis}</div>
          </div>
          <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '45px', height: '45px' }}>
            {dataSantri?.nama_lengkap?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* TOP CARDS (Stats) */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-white" style={{ backgroundColor: '#316d3e' }}>
            <div className="d-flex justify-content-between mb-3">
              <i className="bi bi-award fs-4"></i>
              <span className="badge bg-white bg-opacity-25 rounded-pill px-3 py-2 small">Semester 1</span>
            </div>
            <div className="small opacity-75">Rata-rata Nilai</div>
            <h1 className="fw-bold mb-0" style={{ fontSize: '3rem' }}>{stats.rataRata}</h1>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
            <div className="mb-3">
              <div className="bg-success text-white rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-calendar-event"></i>
              </div>
            </div>
            <div className="small text-secondary">Semester Aktif</div>
            <h2 className="fw-bold mb-1">{stats.semester}</h2>
            <div className="small text-secondary">{stats.tahunAjaran}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="mb-3">
              <div className="bg-success text-white rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-book"></i>
              </div>
            </div>
            <div className="small text-secondary">Kelas</div>
            <h2 className="fw-bold mb-1">{dataSantri?.kelas}</h2>
            <div className="small text-secondary text-truncate">MA Islamic School</div>
          </div>
        </div>
      </div>

      {/* LIST NILAI */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">Nilai Semester</h5>
            <p className="text-secondary small mb-0">Daftar Nilai Semua Pelajaran</p>
          </div>
          <select className="form-select w-auto rounded-3 border-light bg-light small">
            <option>Semester Ganjil</option>
          </select>
        </div>

        <div className="d-flex flex-column gap-3">
          {nilai.map((item, idx) => (
            <div key={idx} className="d-flex align-items-center p-3 rounded-4" style={{ backgroundColor: item.mapel?.kategori === 'Agama' ? '#f0f9f1' : '#ffffff', border: '1px solid #f0f0f0' }}>
              <div className={`rounded-3 d-flex align-items-center justify-content-center me-3 ${item.mapel?.kategori === 'Agama' ? 'bg-success text-white' : 'bg-light text-success'}`} style={{ width: '50px', height: '50px' }}>
                <i className="bi bi-journal-text fs-5"></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold">{item.mapel?.nama_mapel}</div>
                <div className="text-secondary small">{item.mapel?.kategori}</div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <h4 className="fw-bold mb-0" style={{ color: '#316d3e' }}>{item.skor}</h4>
                <div className="bg-white border rounded-3 px-3 py-1 fw-bold text-success">{getGrade(item.skor)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-file-earmark-arrow-up"></i>
              </div>
              <div>
                <div className="fw-bold">Lihat Raport</div>
                <div className="text-secondary small">Raport Semester Lengkap</div>
              </div>
            </div>
            <button className="btn btn-success-subtle text-success w-100 rounded-3 py-2 fw-bold border-0" style={{ backgroundColor: '#dcfce7' }}>
              Buka Raport
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#215c2e' }}>
            <div className="d-flex align-items-center gap-3 mb-4 text-white">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-download"></i>
              </div>
              <div>
                <div className="fw-bold">Download Raport</div>
                <div className="opacity-75 small">Format PDF</div>
              </div>
            </div>
            <button className="btn btn-light w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-download"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}