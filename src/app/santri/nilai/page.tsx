"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ================== TYPE ==================
type Nilai = {
  id: string;
  skor: number;
  semester: string;
  tahun_ajaran: string;
  mapel: {
    nama_mapel: string;
    nama_pengajar: string | null;
  } | null;
};

type Santri = {
  id: string;
  nisn: string;
  nama_lengkap: string;
  email: string;
};

export default function NilaiSantriPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [data, setData] = useState<Nilai[]>([]);
  const [santri, setSantri] = useState<Santri | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("Semester I - 2024/2025");

  useEffect(() => {
    fetchNilaiByUser();
  }, []);

  const fetchNilaiByUser = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: santriData } = await supabase
      .from("santri")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!santriData) return;
    setSantri(santriData);

    const { data: nilai } = await supabase
      .from("nilai")
      .select(`
        id, skor, semester, tahun_ajaran,
        mapel:mapel_id (nama_mapel, nama_pengajar)
      `)
      .eq("santri_id", santriData.id)
      .order("created_at", { ascending: false });

    setData((nilai as any) || []);
    setLoading(false);
  };

  // ================== LOGIC ==================
  const rataRata = data.length > 0
    ? (data.reduce((acc, item) => acc + item.skor, 0) / data.length).toFixed(1)
    : "0";

  const totalA = data.filter((d) => d.skor >= 90).length;
  const totalB = data.filter((d) => d.skor >= 80 && d.skor < 90).length;

  const getPredikat = (nilai: number) => {
    if (nilai >= 90) return { label: "A", class: "bg-success" };
    if (nilai >= 80) return { label: "B", class: "bg-primary" };
    if (nilai >= 70) return { label: "C", class: "bg-warning text-dark" };
    return { label: "D", class: "bg-danger" };
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length >= 2 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Nilai Santri</h2>
          <p className="text-muted small">Lihat Nilai Akademik Per-Semester</p>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-sm-block">
            <div className="fw-bold small text-dark">{santri?.nama_lengkap}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>NISN: {santri?.nisn || "1112233"}</div>
          </div>
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center bg-success text-white fw-bold"
            style={{ width: '42px', height: '42px' }}
          >
            {santri?.nama_lengkap ? getInitials(santri.nama_lengkap) : "MR"}
          </div>
        </div>
      </div>

    {/* SUMMARY CARDS */}
    <div className="row g-3 mb-4">
    {/* Rata-rata */}
    <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm p-3 h-100">
        <div className="d-flex align-items-center gap-2 mb-2">
            <div className="bg-success-subtle rounded-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-graph-up-arrow text-success"></i>
            </div>
            <span className="text-muted small fw-medium">Rata-rata</span>
        </div>
        <div className="h3 fw-bold text-success mb-0">{rataRata}</div>
        </div>
    </div>

    {/* Grade A */}
    <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm p-3 h-100">
        <div className="d-flex align-items-center gap-2 mb-2">
            <div className="bg-warning-subtle rounded-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-star-fill text-warning"></i>
            </div>
            <span className="text-muted small fw-medium">Grade A</span>
        </div>
        <div className="h3 fw-bold mb-0 text-dark">{totalA}</div>
        </div>
    </div>

    {/* Grade B */}
    <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm p-3 h-100">
        <div className="d-flex align-items-center gap-2 mb-2">
            <div className="bg-primary-subtle rounded-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-award text-primary"></i>
            </div>
            <span className="text-muted small fw-medium">Grade B</span>
        </div>
        <div className="h3 fw-bold mb-0 text-dark">{totalB}</div>
        </div>
    </div>

    {/* Total Mapel */}
    <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm p-3 h-100">
        <div className="d-flex align-items-center gap-2 mb-2">
            <div className="bg-info-subtle rounded-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-book text-info"></i>
            </div>
            <span className="text-muted small fw-medium">Total Mapel</span>
        </div>
        <div className="h3 fw-bold mb-0 text-dark">{data.length}</div>
        </div>
    </div>
    </div>
      {/* FILTER BOX */}
      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h6 className="mb-0 fw-bold">Filter Semester</h6>
            <p className="text-muted small mb-md-0">Pilih semester untuk melihat nilai</p>
          </div>
          <div className="col-md-4">
            <select 
              className="form-select form-select-sm"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option>Semester I - 2024/2025</option>
              <option>Semester II - 2024/2025</option>
            </select>
          </div>
        </div>
      </div>

        {/* TABLE CARD */}
        <div className="card border-0 shadow-sm overflow-hidden mt-4">
        <div className="card-header bg-white py-3 border-bottom-0">
            <h6 className="mb-0 fw-bold">Daftar Nilai</h6>
            <p className="text-muted small mb-0">{selectedSemester}</p>
        </div>
        <div className="table-responsive">
            <table className="table align-middle mb-0">
            <thead className="table-light">
                <tr style={{ fontSize: '11px' }}>
                <th className="px-4 py-3 text-uppercase text-muted" style={{ width: '80px' }}>NO</th>
                <th className="py-3 text-uppercase text-muted">MATA PELAJARAN</th>
                <th className="py-3 text-uppercase text-muted">PENGAJAR</th>
                <th className="py-3 text-uppercase text-muted text-center" style={{ width: '120px' }}>NILAI</th>
                <th className="py-3 text-uppercase text-muted text-center px-4" style={{ width: '120px' }}>PREDIKAT</th>
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                <>
                    {/* List Nilai Mapel */}
                    {data.map((item, i) => {
                    const predikat = getPredikat(item.skor);
                    return (
                        <tr key={item.id}>
                        <td className="px-4 text-muted small">{i + 1}</td>
                        <td className="fw-bold small">{item.mapel?.nama_mapel || "-"}</td>
                        <td className="text-muted small">{item.mapel?.nama_pengajar || "-"}</td>
                        <td className="text-center fw-bold text-success small">{item.skor}</td>
                        <td className="text-center px-4">
                            <span className={`badge rounded-circle d-inline-flex align-items-center justify-content-center ${predikat.class}`} style={{ width: '28px', height: '28px' }}>
                            {predikat.label}
                            </span>
                        </td>
                        </tr>
                    );
                    })}
                    
                    {/* BARIS TOTAL (Sesuai image_04557b.png) */}
                    <tr className="border-top" style={{ backgroundColor: '#fdfdfd' }}>
                    <td colSpan={3} className="px-4 py-3 fw-bold small text-secondary">
                        Rata-rata Nilai Keseluruhan
                    </td>
                    <td className="text-center">
                        <span className="badge bg-success-subtle text-success px-3 py-2 fw-bold" style={{ fontSize: '13px' }}>
                        {rataRata}
                        </span>
                    </td>
                    <td className="text-center px-4">
                        {(() => {
                        const avg = parseFloat(rataRata);
                        let config = { label: "D", class: "bg-danger" };
                        if (avg >= 90) config = { label: "A", class: "bg-success" };
                        else if (avg >= 80) config = { label: "B", class: "bg-primary" };
                        else if (avg >= 70) config = { label: "C", class: "bg-warning text-dark" };

                        return (
                            <span 
                            className={`badge rounded-circle d-inline-flex align-items-center justify-content-center fw-bold ${config.class}`}
                            style={{ width: '28px', height: '28px', fontSize: '11px' }}
                            >
                            {config.label}
                            </span>
                        );
                        })()}
                    </td>
                    </tr>
                </>
                ) : (
                <tr>
                    <td colSpan={5} className="text-center py-5 text-muted small">
                    Tidak ada data nilai tersedia
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    </div>
  );
}