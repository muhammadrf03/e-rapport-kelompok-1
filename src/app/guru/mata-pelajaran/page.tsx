"use client";
import React, { useEffect, useState, useOptimistic, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { showToast, confirmAction } from "@/utils/swal"; // Pastikan path import ini benar

export default function MataPelajaranPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [mapel, setMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    nama_mapel: "",
    nama_pengajar: "",
    kategori: "Umum",
  });

  // --- OPTIMISTIC UI UNTUK HAPUS ---
  const [optimisticMapel, addOptimisticMapel] = useOptimistic(
    mapel,
    (state, idHapus) => state.filter((item) => item.id !== idHapus)
  );

  useEffect(() => {
    fetchMapel();
  }, []);

  const fetchMapel = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mapel")
      .select("*")
      .order("nama_mapel", { ascending: true });

    if (!error && data) {
      setMapel(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingId) {
      const { error } = await supabase
        .from("mapel")
        .update(formData)
        .eq("id", editingId);
      
      if (!error) {
        showToast("success", "Mata pelajaran berhasil diperbarui!"); // Pakai showToast
      } else {
        showToast("error", "Gagal memperbarui data");
      }
    } else {
      const { error } = await supabase
        .from("mapel")
        .insert([formData]);
      
      if (!error) {
        showToast("success", "Mata pelajaran berhasil ditambahkan!"); // Pakai showToast
      } else {
        showToast("error", "Gagal menambahkan data");
      }
    }

    setShowModal(false);
    resetForm();
    fetchMapel();
    setIsSubmitting(false);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nama_mapel: item.nama_mapel,
      nama_pengajar: item.nama_pengajar || "",
      kategori: item.kategori || "Umum",
    });
    setShowModal(true);
  };

  const handleHapus = async (id: string, nama: string) => {
    // --- PAKAI confirmAction (Alert Konfirmasi) ---
    const confirm = await confirmAction(
      "Hapus Mata Pelajaran?",
      `Apakah Anda yakin ingin menghapus ${nama}?`
    );

    if (confirm.isConfirmed) {
      startTransition(async () => {
        addOptimisticMapel(id); // UI berubah seketika
        
        const { error } = await supabase.from("mapel").delete().eq("id", id);
        if (!error) {
          showToast("success", "Data berhasil dihapus");
          fetchMapel();
        } else {
          showToast("error", "Gagal menghapus data");
          fetchMapel(); // Revert jika gagal
        }
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nama_mapel: "", nama_pengajar: "", kategori: "Umum" });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* MODAL TAMBAH / EDIT */}
      {showModal && (
        <div className="modal d-block animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow animate__animated animate__zoomIn animate__faster">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0 text-dark">{editingId ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Nama Mata Pelajaran</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 text-dark" 
                      placeholder="Contoh: Fiqih, Nahwu, dll"
                      required 
                      value={formData.nama_mapel} 
                      onChange={(e) => setFormData({...formData, nama_mapel: e.target.value})} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Nama Pengajar (Guru)</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 text-dark" 
                      placeholder="Nama Lengkap Guru"
                      required 
                      value={formData.nama_pengajar} 
                      onChange={(e) => setFormData({...formData, nama_pengajar: e.target.value})} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Kategori</label>
                    <select 
                      className="form-select rounded-3 py-2 text-dark"
                      value={formData.kategori}
                      onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                    >
                      <option value="Umum">Umum</option>
                      <option value="Diniyah">Diniyah</option>
                      <option value="Al-Qur'an">Al-Qur'an</option>
                      <option value="Bahasa">Bahasa</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-success rounded-3 px-4 fw-bold shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? "Memproses..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <header className="mb-4 animate__animated animate__fadeInDown">
        <h2 className="fw-bold mb-0 text-dark">Kelola Mata Pelajaran</h2>
        <p className="text-secondary small">Tambah, edit, atau hapus mata pelajaran serta pengajarnya</p>
      </header>

      <button 
        onClick={() => { resetForm(); setShowModal(true); }}
        className="btn btn-success rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2 mb-4 shadow-sm animate__animated animate__fadeInLeft" 
        style={{ backgroundColor: '#14532d' }}
      >
        <i className="bi bi-plus-lg"></i> Tambah Mata Pelajaran
      </button>

      <div className="row g-4">
        {optimisticMapel.length > 0 ? optimisticMapel.map((item, index) => (
          <div className="col-md-4 animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 0.1}s` }} key={item.id}>
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 position-relative hover-card">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-book fs-4"></i>
                </div>
                <span className="badge rounded-pill bg-success-subtle text-success border-0 px-3 py-2" style={{ fontSize: '10px' }}>
                  {item.kategori || "Umum"}
                </span>
              </div>

              <h5 className="fw-bold text-dark mb-1">{item.nama_mapel}</h5>
              <p className="text-secondary small mb-4">
                <i className="bi bi-person-circle me-1"></i> {item.nama_pengajar || "Belum ada pengajar"}
              </p>

              <div className="d-flex gap-2 mt-auto">
                <button 
                  onClick={() => handleEdit(item)}
                  className="btn btn-outline-success w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold transition-all"
                >
                  <i className="bi bi-pencil small"></i> Edit
                </button>
                <button 
                  onClick={() => handleHapus(item.id, item.nama_mapel)}
                  className="btn btn-outline-danger w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold transition-all"
                >
                  <i className="bi bi-trash small"></i> Hapus
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12 text-center py-5">
            <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
               <i className="bi bi-journal-x fs-1 text-secondary opacity-50"></i>
            </div>
            <p className="text-secondary fw-medium">Belum ada data mata pelajaran.</p>
          </div>
        )}
      </div>
    </div>
  );
}