"use client";
import React, { useEffect, useState, useOptimistic, useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";
// Import SweetAlert2 (Pastikan sudah install: npm install sweetalert2)
import Swal from "sweetalert2";

// --- TASK 2: ZOD SCHEMA ---
const nilaiSchema = z.object({
  santri_id: z.string().min(1, "Pilih santri terlebih dahulu"),
  mapel_id: z.string().min(1, "Pilih mata pelajaran"),
  skor: z.number().min(0, "Skor minimal 0").max(100, "Skor maksimal 100"),
  semester: z.string().min(1, "Pilih semester"),
  tahun_ajaran: z.string().min(1, "Tahun ajaran harus diisi")
});

export default function InputNilaiPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const querySearch = searchParams.get("search") || "";

  const [santri, setSantri] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    santri_id: "",
    mapel_id: "",
    skor: "",
    semester: "",
    tahun_ajaran: "2024/2025"
  });

  // --- TASK 4: OPTIMISTIC UI ---
  const [optimisticNilai, addOptimisticNilai] = useOptimistic(
    nilaiList,
    (state, idHapus) => state.filter((n) => n.id !== idHapus)
  );

  // Helper untuk Alert (seperti di data-santri)
  const showAlert = (icon: 'success' | 'error' | 'warning', title: string) => {
    Swal.fire({
      icon,
      title,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [resSantri, resMapel, resNilai] = await Promise.all([
      supabase.from("santri").select("id, nama_lengkap"),
      supabase.from("mapel").select("id, nama_mapel"),
      supabase.from("nilai").select(`
        id, skor, semester, tahun_ajaran, santri_id, mapel_id,
        santri(nama_lengkap),
        mapel(nama_mapel)
      `).order("created_at", { ascending: false })
    ]);

    if (resSantri.data) setSantri(resSantri.data);
    if (resMapel.data) setMapel(resMapel.data);
    if (resNilai.data) setNilaiList(resNilai.data);
    setLoading(false);
  };

  const handleSearch = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set("search", val);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredNilai = optimisticNilai.filter(n => 
    n.santri?.nama_lengkap?.toLowerCase().includes(querySearch.toLowerCase()) ||
    n.mapel?.nama_mapel?.toLowerCase().includes(querySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    const validation = nilaiSchema.safeParse({
      ...formData,
      skor: parseInt(formData.skor)
    });

    if (!validation.success) {
      setFormErrors(validation.error.flatten().fieldErrors);
      setIsSubmitting(false);
      return;
    }

    const payload = validation.data;

    if (editingId) {
      const { error } = await supabase.from("nilai").update(payload).eq("id", editingId);
      if (!error) {
        showAlert("success", "Nilai berhasil diperbarui");
        resetForm();
        fetchInitialData();
      }
    } else {
      const { error } = await supabase.from("nilai").insert([payload]);
      if (!error) {
        showAlert("success", "Nilai berhasil disimpan");
        resetForm();
        fetchInitialData();
      }
    }
    setIsSubmitting(false);
  };

  const handleHapus = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Data nilai akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      startTransition(async () => {
        addOptimisticNilai(id);
        const { error } = await supabase.from("nilai").delete().eq("id", id);
        if (error) {
          showAlert("error", "Gagal menghapus data");
          fetchInitialData();
        } else {
          showAlert("success", "Data berhasil dihapus");
        }
      });
    }
  };

  const handleEdit = (n: any) => {
    setEditingId(n.id);
    setFormData({
      santri_id: n.santri_id,
      mapel_id: n.mapel_id,
      skor: n.skor.toString(),
      semester: n.semester,
      tahun_ajaran: n.tahun_ajaran
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormErrors({});
    setFormData({ santri_id: "", mapel_id: "", skor: "", semester: "", tahun_ajaran: "2024/2025" });
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-success"></div>
    </div>
  );

  return (
    // Menambahkan class animasi fade-in pada container utama
    <div className="container-fluid p-0 animate__animated animate__fadeIn" style={{ animationDuration: '0.8s' }}>
      <header className="mb-4">
        <h2 className="fw-bold mb-0 text-dark">Input Nilai</h2>
        <p className="text-secondary small">Kelola data nilai santri secara efisien</p>
      </header>

      <div className="row g-4">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top animate__animated animate__fadeInLeft" style={{ top: '20px' }}>
            <h6 className="fw-bold mb-4">
               <i className={`bi ${editingId ? 'bi-pencil-fill text-primary' : 'bi-plus-circle-fill text-success'} me-2`}></i>
               {editingId ? "Edit Nilai" : "Form Input"}
            </h6>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Nama Santri</label>
                <select className={`form-select border-light-subtle ${formErrors.santri_id ? 'is-invalid' : ''}`} value={formData.santri_id} onChange={(e) => setFormData({...formData, santri_id: e.target.value})}>
                  <option value="">Pilih Santri</option>
                  {santri.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                </select>
                {formErrors.santri_id && <div className="invalid-feedback text-xs">{formErrors.santri_id[0]}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Mata Pelajaran</label>
                <select className={`form-select border-light-subtle ${formErrors.mapel_id ? 'is-invalid' : ''}`} value={formData.mapel_id} onChange={(e) => setFormData({...formData, mapel_id: e.target.value})}>
                  <option value="">Pilih Mapel</option>
                  {mapel.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                </select>
                {formErrors.mapel_id && <div className="invalid-feedback text-xs">{formErrors.mapel_id[0]}</div>}
              </div>

              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label small fw-bold">Skor</label>
                  <input type="number" className={`form-control border-light-subtle ${formErrors.skor ? 'is-invalid' : ''}`} placeholder="0-100" value={formData.skor} onChange={(e) => setFormData({...formData, skor: e.target.value})} />
                  {formErrors.skor && <div className="invalid-feedback text-xs">{formErrors.skor[0]}</div>}
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label small fw-bold">Semester</label>
                  <select className={`form-select border-light-subtle ${formErrors.semester ? 'is-invalid' : ''}`} value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})}>
                    <option value="">Pilih</option>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold">Tahun Ajaran</label>
                <select className="form-select border-light-subtle" value={formData.tahun_ajaran} onChange={(e) => setFormData({...formData, tahun_ajaran: e.target.value})}>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div className="d-grid gap-2">
                <button type="submit" disabled={isSubmitting} className={`btn ${editingId ? 'btn-primary' : 'btn-success'} py-2 rounded-3 fw-bold shadow-sm`}>
                  {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                  {editingId ? "Perbarui Data" : "Simpan Data"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-light border py-2 rounded-3">Batal</button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR NILAI */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 animate__animated animate__fadeInRight">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <h6 className="fw-bold mb-0">Daftar Nilai Terinput</h6>
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <span className="input-group-text bg-white border-end-0 text-secondary"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Cari nama atau mapel..." 
                  defaultValue={querySearch}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-bold">Detail Santri</th>
                    <th className="small fw-bold">Mapel</th>
                    <th className="small fw-bold text-center">Skor</th>
                    <th className="small fw-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNilai.length > 0 ? filteredNilai.map((n) => (
                    // Efek transisi per baris saat muncul
                    <tr key={n.id} className="animate__animated animate__fadeInUp" style={{ animationDuration: '0.5s' }}>
                      <td>
                        <div className="fw-bold">{n.santri?.nama_lengkap}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>Sem. {n.semester} | {n.tahun_ajaran}</div>
                      </td>
                      <td className="small">{n.mapel?.nama_mapel}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill ${n.skor >= 75 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                          {n.skor}
                        </span>
                      </td>
                      <td className="text-center">
                        <button onClick={() => handleEdit(n)} className="btn btn-sm text-primary p-2"><i className="bi bi-pencil-square fs-5"></i></button>
                        <button onClick={() => handleHapus(n.id)} className="btn btn-sm text-danger p-2"><i className="bi bi-trash fs-5"></i></button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted small">Data tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}