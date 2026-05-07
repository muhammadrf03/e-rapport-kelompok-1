"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ================== TYPES ==================
type Nilai = {
  id: string;
  skor: number;
  semester: string;
  tahun_ajaran: string;
  mapel: {
    nama_mapel: string;
  } | null;
};

type Santri = {
  id: string;
  nis: string;
  nama_lengkap: string;
  email: string;
  kelas: string;
};

export default function RaportSantriPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [santri, setSantri] = useState<Santri | null>(null);
  const [allNilai, setAllNilai] = useState<Nilai[]>([]);
  const [filteredNilai, setFilteredNilai] = useState<Nilai[]>([]);
  
  // Default filter disesuaikan dengan data INSERT kamu (Ganjil - 2024/2025)
  const [selectedFilter, setSelectedFilter] = useState("Ganjil - 2024/2025");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, allNilai]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Ambil Data Santri
      const { data: sData, error: sError } = await supabase
        .from("santri")
        .select("id, nama_lengkap, nis, kelas, email")
        .eq("email", user.email)
        .single();

      if (sError) throw sError;
      setSantri(sData);

      // 2. Ambil Semua Data Nilai join ke Mapel
      const { data: nData, error: nError } = await supabase
        .from("nilai")
        .select(`
          id, 
          skor, 
          semester, 
          tahun_ajaran,
          mapel:mapel_id (nama_mapel)
        `)
        .eq("santri_id", sData.id);

      if (nError) throw nError;
      setAllNilai((nData as any) || []);

    } catch (error: any) {
      console.error("Gagal memuat data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const parts = selectedFilter.split(" - ");
    const semFilter = parts[0].trim();
    const tahFilter = parts[1].trim();

    const filtered = allNilai.filter(item => 
      item.semester === semFilter && item.tahun_ajaran === tahFilter
    );
    setFilteredNilai(filtered);
  };

  const rataRata = filteredNilai.length > 0 
    ? (filteredNilai.reduce((acc, curr) => acc + curr.skor, 0) / filteredNilai.length).toFixed(1)
    : "0";

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="spinner-border text-success" role="status"></div>
    </div>
  );

  return (
    <div className="p-4" style={{ backgroundColor: "#f3f6f4", minHeight: "100vh", fontSize: '0.9rem' }}>
      
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <div className="d-flex justify-content-between align-items-start mb-4 no-print">
        <div>
          <h3 className="fw-bold mb-1 text-dark">E-Raport Santri</h3>
          <p className="text-secondary small">Pantau perkembangan akademik Anda</p>
        </div>
        <div className="text-end d-flex align-items-center gap-3">
          <div className="small">
             <div className="fw-bold text-dark">{santri?.nama_lengkap}</div>
             <div className="text-muted" style={{ fontSize: '11px' }}>NIS: {santri?.nis}</div>
          </div>
          <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '42px', height: '42px' }}>
             {santri?.nama_lengkap?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* FILTER BOX (HIDDEN ON PRINT) */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 no-print">
        <div className="d-flex justify-content-between align-items-center">
          <div className="ps-2">
            <div className="fw-bold small">Periode Akademik</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>Pilih semester untuk melihat laporan</div>
          </div>
          <select 
            className="form-select form-select-sm rounded-3 border-0 bg-light fw-bold px-3" 
            style={{ width: '250px', height: '40px' }}
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="Ganjil - 2024/2025">Semester Ganjil - 2024/2025</option>
            <option value="Genap - 2024/2025">Semester Genap - 2024/2025</option>
            <option value="Ganjil - 2025/2026">Semester Ganjil - 2025/2026</option>
          </select>
        </div>
      </div>

      {/* STAT CARDS (HIDDEN ON PRINT) */}
      <div className="row g-4 mb-4 no-print">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center bg-white">
            <div className="rounded-4 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '50px', height: '50px', backgroundColor: '#10b98115', color: '#10b981' }}>
              <i className="bi bi-building fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-bold" style={{ fontSize: '11px' }}>KELAS</div>
              <h4 className="fw-bold mb-0 text-dark">{santri?.kelas || '-'}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center bg-white">
            <div className="rounded-4 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '50px', height: '50px', backgroundColor: '#6366f115', color: '#6366f1' }}>
              <i className="bi bi-graph-up-arrow fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-bold" style={{ fontSize: '11px' }}>RATA-RATA</div>
              <h4 className="fw-bold mb-0 text-dark">{rataRata}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center bg-white">
            <div className="rounded-4 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '50px', height: '50px', backgroundColor: '#8b5cf615', color: '#8b5cf6' }}>
              <i className="bi bi-journal-text fs-4"></i>
            </div>
            <div>
              <div className="text-muted fw-bold" style={{ fontSize: '11px' }}>MATA PELAJARAN</div>
              <h4 className="fw-bold mb-0 text-dark">{filteredNilai.length}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW (PRINTABLE AREA) */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-white print-container">
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light no-print">
           <span className="fw-bold small text-secondary">PREVIEW RAPORT DIGITAL</span>
           <span className="badge bg-success">Status: Terverifikasi</span>
        </div>
        
        <div className="p-md-5 p-4">
          {/* Header Raport (Muncul di Print) */}
          <div className="text-center mb-5">
             <h4 className="fw-bold text-uppercase mb-1">Laporan Hasil Belajar Santri</h4>
             <p className="text-muted small">Tahun Ajaran {selectedFilter.split(" - ")[1]}</p>
          </div>

          <div className="row mb-5 g-4 border-start border-4 border-success ps-4">
            <div className="col-md-6 mb-3">
               <div className="text-muted small mb-1 uppercase">Nama Lengkap</div>
               <div className="fw-bold fs-5 text-dark">{santri?.nama_lengkap}</div>
            </div>
            <div className="col-md-6 mb-3">
               <div className="text-muted small mb-1">Nomor Induk Santri (NIS)</div>
               <div className="fw-bold fs-5 text-dark">{santri?.nis}</div>
            </div>
            <div className="col-md-6">
               <div className="text-muted small mb-1">Kelas</div>
               <div className="fw-bold fs-5 text-dark">{santri?.kelas}</div>
            </div>
            <div className="col-md-6">
               <div className="text-muted small mb-1">Semester</div>
               <div className="fw-bold fs-5 text-dark">{selectedFilter.split(" - ")[0]}</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
               <thead className="bg-light text-center small fw-bold">
                  <tr>
                     <th className="py-3" style={{ width: '80px' }}>NO</th>
                     <th className="py-3 text-start ps-4">MATA PELAJARAN</th>
                     <th className="py-3" style={{ width: '150px' }}>NILAI AKHIR</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredNilai.length > 0 ? (
                    filteredNilai.map((item, index) => (
                      <tr key={item.id}>
                         <td className="py-3 text-center text-muted">{index + 1}</td>
                         <td className="py-3 ps-4 fw-bold text-dark">
                           {item.mapel?.nama_mapel || "Mata Pelajaran (ID: " + item.id.substring(0,5) + "...)"}
                         </td>
                         <td className="py-3 text-center">
                            <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                               {item.skor}
                            </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-5 text-muted">
                         <div className="mb-2">Data nilai tidak ditemukan untuk periode ini.</div>
                         <small className="no-print">Pastikan filter sesuai dengan data di database (Ganjil/Genap)</small>
                      </td>
                    </tr>
                  )}
               </tbody>
               {filteredNilai.length > 0 && (
                 <tfoot className="bg-light fw-bold">
                    <tr>
                       <td colSpan={2} className="py-3 ps-4 text-end">RATA-RATA NILAI KESELURUHAN</td>
                       <td className="py-3 text-center text-success" style={{ fontSize: '1.1rem' }}>{rataRata}</td>
                    </tr>
                 </tfoot>
               )}
            </table>
          </div>

          {/* Action Buttons (HIDDEN ON PRINT) */}
          <div className="mt-5 d-flex justify-content-end gap-2 no-print">
             <button onClick={() => window.print()} className="btn btn-dark rounded-pill px-5 py-2 fw-bold shadow-sm">
                <i className="bi bi-printer me-2"></i> Cetak Dokumen
             </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; padding: 0 !important; }
          .print-container { border: none !important; box-shadow: none !important; margin: 0 !important; }
          .p-4 { padding: 0 !important; }
          .table { border: 1px solid #dee2e6 !important; }
        }
      `}</style>
    </div>
  );
}