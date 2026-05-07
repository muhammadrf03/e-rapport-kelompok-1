"use client";
import React, { useEffect, useState, useOptimistic, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { z } from "zod";

// --- Zod Schema untuk Validasi Data Stats ---
const statsSchema = z.object({
  totalSantri: z.number(),
  totalMapel: z.number(),
  totalNilai: z.number(),
  kategoriMapel: z.array(z.object({
    nama: z.string(),
    jumlah: z.number()
  })),
  latestNilai: z.array(z.any())
});

type DashboardStats = z.infer<typeof statsSchema>;

export default function DashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSantri: 0,
    totalMapel: 0,
    totalNilai: 0,
    kategoriMapel: [],
    latestNilai: []
  });

  // Optimistic UI untuk Daftar Nilai
  const [optimisticLatestNilai, addOptimisticNilai] = useOptimistic(
    stats.latestNilai,
    (state, idToRemove) => state.filter(n => n.id !== idToRemove)
  );

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

      const { data: nilaiTerbaru } = await supabase
        .from('nilai')
        .select(`
          id,
          skor,
          created_at,
          santri:santri_id(nama_lengkap),
          mapel:mapel_id(nama_mapel)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const rawData = {
        totalSantri: santriCount || 0,
        totalMapel: mapelCount || 0,
        totalNilai: nilaiCount || 0,
        kategoriMapel: formatKategori,
        latestNilai: nilaiTerbaru || []
      };

      const validatedData = statsSchema.safeParse(rawData);
      if (validatedData.success) {
        setStats(validatedData.data);
      } else {
        setStats(rawData); 
      }
      
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Data untuk looping kartu stats agar tidak duplikasi kode manual
  const statsCards = [
    { label: "Total Santri", val: stats.totalSantri, icon: "bi-people", link: "/guru/data-santri", color: "#198754" },
    { label: "Mata Pelajaran", val: stats.totalMapel, icon: "bi-book", link: "/guru/mata-pelajaran", color: "#144520" },
    { label: "Total Nilai", val: stats.totalNilai, icon: "bi-graph-up-arrow", link: "/guru/input-nilai", color: "#198754" }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* CSS INTERNAL UNTUK MARQUEE */}
      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          padding: 15px 0;
        }
        .marquee-content {
          display: inline-flex;
          gap: 24px;
          animation: scroll-left 25s linear infinite;
        }
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .card-item {
          min-width: 320px;
        }
      `}</style>

      <header className="mb-4">
        <h2 className="fw-bold mb-0 text-dark">Dashboard Guru</h2>
        <p className="text-secondary small">Selamat datang kembali! Berikut ringkasan data E-Raport</p>
      </header>

      {/* STATS CARDS DENGAN ANIMASI BERGERAK */}
      <div className="marquee-container mb-4">
        <div className="marquee-content">
          {/* Loop Pertama */}
          {statsCards.map((item, idx) => (
            <div className="card-item" key={idx}>
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="text-white rounded-3 d-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '45px', height: '45px', backgroundColor: item.color }}>
                    <i className={`bi ${item.icon} fs-4`}></i>
                  </div>
                  <span className="badge rounded-pill bg-light text-secondary border px-3 py-2" style={{ fontSize: '10px' }}>AKTIF</span>
                </div>
                <div className="text-secondary small fw-bold text-uppercase mb-1">{item.label}</div>
                <h1 className="fw-bold mb-3">{item.val}</h1>
                <Link href={item.link} className="text-success fw-bold text-decoration-none small d-block">
                   Detail <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          ))}
          {/* Loop Kedua (Duplikasi untuk efek tanpa putus) */}
          {statsCards.map((item, idx) => (
            <div className="card-item" key={`dup-${idx}`}>
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="text-white rounded-3 d-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '45px', height: '45px', backgroundColor: item.color }}>
                    <i className={`bi ${item.icon} fs-4`}></i>
                  </div>
                  <span className="badge rounded-pill bg-light text-secondary border px-3 py-2" style={{ fontSize: '10px' }}>AKTIF</span>
                </div>
                <div className="text-secondary small fw-bold text-uppercase mb-1">{item.label}</div>
                <h1 className="fw-bold mb-3">{item.val}</h1>
                <Link href={item.link} className="text-success fw-bold text-decoration-none small d-block">
                   Detail <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-7">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ minHeight: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0">Nilai Terbaru</h5>
                <small className="text-muted">Ringkasan data nilai terakhir</small>
              </div>
              <Link href="/guru/input-nilai" className="btn btn-success btn-sm rounded-3 px-3 py-2" style={{ backgroundColor: '#1a5d2b', border: 'none' }}>
                  <i className="bi bi-plus-lg me-2"></i> Input Nilai
              </Link>
            </div>
            
            <div className="my-auto">
              {stats.totalNilai === 0 ? (
                <div className="text-center">
                  <i className="bi bi-pencil-square text-light display-1 d-block mb-3"></i>
                  <h6 className="fw-bold text-secondary">Belum ada nilai terinput</h6>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="small text-muted text-uppercase">
                      <tr>
                        <th>Santri</th>
                        <th>Mapel</th>
                        <th className="text-center">Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optimisticLatestNilai.map((n) => (
                        <tr key={n.id}>
                          <td className="small fw-bold">{n.santri?.nama_lengkap}</td>
                          <td className="small text-muted">{n.mapel?.nama_mapel}</td>
                          <td className="text-center"><span className="badge bg-success-subtle text-success rounded-pill">{n.skor}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
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
            )) : <p className="text-center text-muted small py-4">Belum ada data</p>}
            
            <Link href="/guru/mata-pelajaran" className="btn btn-outline-light text-secondary border w-100 rounded-3 mt-auto py-2">Kelola Mata Pelajaran</Link>
          </div>
        </div>
      </div>

      <div className="card border-0 rounded-4 p-4 text-white overflow-hidden position-relative shadow" style={{ backgroundColor: '#3d8c52' }}>
        <div className="position-relative z-1">
          <h4 className="fw-bold mb-1">Aksi Cepat</h4>
          <p className="small opacity-75 mb-4">Pilih aksi untuk memulai</p>
          <div className="d-flex gap-3">
            <Link href="/guru/data-santri" className="btn btn-light rounded-3 fw-bold px-4 py-2 text-dark text-decoration-none small">Kelola Santri</Link>
            <Link href="/guru/input-nilai" className="btn btn-outline-light border-2 rounded-3 fw-bold px-4 py-2 text-decoration-none small">Input Nilai</Link>
          </div>
        </div>
        <i className="bi bi-graph-up-arrow position-absolute" style={{ right: '-20px', bottom: '-40px', fontSize: '180px', opacity: '0.1', transform: 'rotate(15deg)' }}></i>
      </div>
    </div>
  );
}