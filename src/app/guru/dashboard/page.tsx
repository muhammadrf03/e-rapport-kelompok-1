"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [stats, setStats] = useState({
    totalSantri: 0,
    totalMapel: 0,
    totalNilai: 0,
    kategoriMapel: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { count: santriCount } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true });

      const { count: mapelCount } = await supabase
        .from('mapel')
        .select('*', { count: 'exact', head: true });

      const { count: nilaiCount } = await supabase
        .from('nilai')
        .select('*', { count: 'exact', head: true });

      const { data: mapelData } = await supabase
        .from('mapel')
        .select('kategori');
      
      const kelompok = mapelData?.reduce((acc: any, curr: any) => {
        acc[curr.kategori] = (acc[curr.kategori] || 0) + 1;
        return acc;
      }, {});

      const formatKategori = kelompok ? Object.keys(kelompok).map(key => ({
        nama: key,
        jumlah: kelompok[key]
      })) : [];

      setStats({
        totalSantri: santriCount || 0,
        totalMapel: mapelCount || 0,
        totalNilai: nilaiCount || 0,
        kategoriMapel: formatKategori
      });
      
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div>
    <header className="mb-4">
      <h2 className="fw-bold mb-0 text-dark">Dashboard Guru</h2>
      <p className="text-secondary small">Selamat datang kembali! Berikut ringkasan data E-Raport</p>
    </header>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-start">
              <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-people fs-4"></i>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border px-3 py-2" style={{ fontSize: '10px' }}>AKTIF</span>
            </div>
            <div className="text-secondary small fw-bold text-uppercase mb-1">Total Santri</div>
            <h1 className="fw-black mb-3">{stats.totalSantri}</h1>
            <a href="/guru/santri" className="text-success fw-bold text-decoration-none small text-center d-block">Kelola Santri <i className="bi bi-arrow-right ms-1"></i></a>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
             <div className="bg-success-dark text-white rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '45px', height: '45px', backgroundColor: '#144520' }}>
                <i className="bi bi-book fs-4"></i>
              </div>
            <div className="text-secondary small fw-bold text-uppercase mb-1">Mata Pelajaran</div>
            <h1 className="fw-black mb-3">{stats.totalMapel}</h1>
            <a href="/guru/mapel" className="text-success fw-bold text-decoration-none small text-center d-block">Kelola Mapel <i className="bi bi-arrow-right ms-1"></i></a>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-graph-up-arrow fs-4"></i>
            </div>
            <div className="text-secondary small fw-bold text-uppercase mb-1">Total Nilai Terinput</div>
            <h1 className="fw-black mb-3">{stats.totalNilai}</h1>
            <a href="/guru/nilai" className="text-success fw-bold text-decoration-none small text-center d-block">Input Nilai <i className="bi bi-arrow-right ms-1"></i></a>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-7">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ minHeight: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-5">
              <div>
                <h5 className="fw-bold mb-0">Nilai Terbaru</h5>
                <small className="text-muted">Ringkasan data nilai terakhir</small>
              </div>
              <button className="btn btn-success btn-sm rounded-3 px-3 py-2" style={{ backgroundColor: '#1a5d2b' }}>
                <i className="bi bi-plus-lg me-2"></i> Input Nilai
              </button>
            </div>
            
            <div className="text-center my-auto">
                <i className="bi bi-pencil-square text-light display-1 d-block mb-3"></i>
                <h6 className="fw-bold text-secondary">Status Input Nilai</h6>
                <p className="small text-muted mb-4">
                  {stats.totalNilai === 0 ? "Belum ada nilai terinput untuk santri" : `Terdapat ${stats.totalNilai} data nilai terinput`}
                </p>
                {stats.totalNilai === 0 && (
                  <button className="btn btn-success rounded-3 px-4" style={{ backgroundColor: '#4caf50', border: 'none' }}>+ Input Nilai Sekarang</button>
                )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-1">Kategori Mata Pelajaran</h5>
            <p className="small text-muted mb-4">Distribusi berdasarkan kategori</p>

            {stats.kategoriMapel.length > 0 ? stats.kategoriMapel.map((kat, i) => (
              <div className="d-flex align-items-center mb-4" key={i}>
                <div className="bg-light rounded-3 d-flex align-items-center justify-content-center text-success me-3" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-journal-text"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between small fw-bold mb-1">
                    <span>{kat.nama}</span>
                    <span>{kat.jumlah}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${(kat.jumlah / stats.totalMapel) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-muted small py-4">Belum ada kategori ditemukan</p>}
            
            <a href="/guru/mapel" className="btn btn-outline-light text-secondary border w-100 rounded-3 mt-2 py-2 text-decoration-none text-center d-block">Kelola Mata Pelajaran</a>
          </div>
        </div>
      </div>

      <div className="card border-0 rounded-4 p-4 text-white overflow-hidden position-relative shadow" style={{ backgroundColor: '#3d8c52' }}>
        <div className="position-relative z-1">
          <h4 className="fw-bold mb-1">Aksi Cepat</h4>
          <p className="small opacity-75 mb-4">Pilih aksi untuk memulai</p>
          <div className="d-flex gap-3">
            <a href="/guru/data-santri" className="btn btn-light rounded-3 fw-bold px-4 py-2 text-dark text-decoration-none small"><i className="bi bi-people me-2"></i> Kelola Santri</a>
            <a href="/guru/input-nilai" className="btn btn-outline-light border-2 rounded-3 fw-bold px-4 py-2 text-decoration-none small"><i className="bi bi-pencil-square me-2"></i> Input Nilai</a>
          </div>
        </div>
        <i className="bi bi-graph-up-arrow position-absolute" style={{ right: '-20px', bottom: '-40px', fontSize: '180px', opacity: '0.1', transform: 'rotate(15deg)' }}></i>
      </div>
    </div>
  );
}