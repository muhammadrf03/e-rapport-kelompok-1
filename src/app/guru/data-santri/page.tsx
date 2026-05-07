"use client";
import React, { useEffect, useState, useOptimistic, useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import { showToast, confirmAction } from "@/utils/swal";
import { z } from "zod";

// --- TASK 2: ZOD SCHEMA DEFINITION ---
const santriSchema = z.object({
  nis: z.string().min(5, "NIS minimal 5 karakter"),
  nama_lengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  kelas: z.string().min(1, "Kelas harus diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function DataSantriPage() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // --- TASK 3: URL AS STATE (SEARCH) ---
  const querySearch = searchParams.get("search") || "";

  const [santri, setSantri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({}); // Simpan error validasi

  const [stats, setStats] = useState({
    total: 0,
    jumlahKelas: 0,
    kelasTerbanyak: "-"
  });

  const [formData, setFormData] = useState({
    nis: "",
    nama_lengkap: "",
    kelas: "",
    email: "",
    password: ""
  });

  // --- TASK 4: OPTIMISTIC UI STATE ---
  const [optimisticSantri, addOptimisticSantri] = useOptimistic(
    santri,
    (state, idHapus) => state.filter((s) => s.id !== idHapus)
  );

  useEffect(() => {
    fetchSantri();
  }, [querySearch]); // Fetch ulang jika URL search berubah

  const fetchSantri = async () => {
    setLoading(true);
    let query = supabase
      .from("santri")
      .select("*")
      .order("created_at", { ascending: false });

    if (querySearch) {
      query = query.or(`nama_lengkap.ilike.%${querySearch}%,nis.ilike.%${querySearch}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setSantri(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  // --- TASK 3: SEARCH HANDLER (UPDATE URL) ---
  const handleSearch = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const calculateStats = (data: any[]) => {
    const kelasList = data.map((s) => s.kelas).filter(Boolean);
    const uniqueKelas = Array.from(new Set(kelasList));
    const counts = kelasList.reduce((acc: any, curr: any) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    const terbanyak = Object.keys(counts).length > 0 
      ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) 
      : "-";

    setStats({
      total: data.length,
      jumlahKelas: uniqueKelas.length,
      kelasTerbanyak: terbanyak
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // --- TASK 2: ZOD VALIDATION ---
    const result = santriSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setFormErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    if (editingId) {
      const { error } = await supabase
        .from("santri")
        .update({
          nis: formData.nis,
          nama_lengkap: formData.nama_lengkap,
          kelas: formData.kelas,
          password: formData.password 
        })
        .eq("id", editingId);
      
      if (!error) {
        showToast("success", "Data profil santri berhasil diperbarui!");
        setShowModal(false);
        resetForm();
        await fetchSantri();
      } else {
        showToast("error", "Gagal update: " + error.message);
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            full_name: formData.nama_lengkap,
            role: 'santri' 
          }
        }
      });

      if (authError) {
        showToast("error", "Gagal daftar akun: " + authError.message);
        setIsSubmitting(false);
        return;
      }

      if (authData.user) {
        const { error: dbError } = await supabase.from("santri").insert([
          { 
            id: authData.user.id,
            nis: formData.nis,
            nama_lengkap: formData.nama_lengkap,
            kelas: formData.kelas,
            email: formData.email,
            password: formData.password
          }
        ]);

        if (!dbError) {
          showToast("success", "Santri berhasil dibuat!");
          setShowModal(false);
          resetForm();
          await fetchSantri();
        } else {
          showToast("error", "Gagal simpan: " + dbError.message);
        }
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const confirm = await confirmAction(
      "Hapus Data Santri?",
      "Data yang dihapus tidak dapat dikembalikan."
    );

    if (confirm.isConfirmed) {
      // --- TASK 4: OPTIMISTIC UI IMPLEMENTATION ---
      startTransition(async () => {
        addOptimisticSantri(id); // UI langsung hapus tanpa nunggu server
        
        const { error } = await supabase.from("santri").delete().eq("id", id);
        if (!error) {
          showToast("success", "Data santri berhasil dihapus");
          fetchSantri(); // Refresh background
        } else {
          showToast("error", "Gagal menghapus: " + error.message);
          fetchSantri(); // Revert UI jika gagal
        }
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nis: item.nis || "",
      nama_lengkap: item.nama_lengkap || "",
      kelas: item.kelas || "",
      email: item.email || "",
      password: item.password || ""
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormErrors({});
    setFormData({ nis: "", nama_lengkap: "", kelas: "", email: "", password: "" });
  };

  if (loading && !querySearch) return (
    <div className="d-flex justify-content-center align-items-center vh-100 text-success">
      <div className="spinner-border me-2"></div>
    </div>
  );

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* MODAL FORM */}
      {showModal && (
        <div className="modal d-block animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0">{editingId ? "Edit Santri" : "Tambah Santri"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">NIS</label>
                      <input type="text" className={`form-control ${formErrors.nis ? 'is-invalid' : ''}`} value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})} />
                      {formErrors.nis && <div className="invalid-feedback">{formErrors.nis[0]}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Kelas</label>
                      <input type="text" className={`form-control ${formErrors.kelas ? 'is-invalid' : ''}`} value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} />
                      {formErrors.kelas && <div className="invalid-feedback">{formErrors.kelas[0]}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Nama Lengkap</label>
                      <input type="text" className={`form-control ${formErrors.nama_lengkap ? 'is-invalid' : ''}`} value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} />
                      {formErrors.nama_lengkap && <div className="invalid-feedback">{formErrors.nama_lengkap[0]}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Email</label>
                      <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingId} />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email[0]}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Password</label>
                      <input type="text" className={`form-control ${formErrors.password ? 'is-invalid' : ''}`} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      {formErrors.password && <div className="invalid-feedback">{formErrors.password[0]}</div>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-success px-4 fw-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Memproses..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="mb-4">
        <h2 className="fw-bold mb-0 text-dark">Data Santri</h2>
        <p className="text-secondary small">Kelola informasi akun santri terdaftar</p>
      </header>

      {/* STATS CARDS */}
      <div className="row g-4 mb-4">
        {[
          { label: "Total Santri", val: stats.total, icon: "bi-people", color: "text-success" },
          { label: "Jumlah Kelas", val: stats.jumlahKelas, icon: "bi-journal-text", color: "text-primary" },
          { label: "Kelas Terbanyak", val: stats.kelasTerbanyak, icon: "bi-graph-up", color: "text-warning" }
        ].map((s, i) => (
          <div className="col-md-4" key={i}>
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <div className={`bg-light ${s.color} rounded-3 d-inline-flex align-items-center justify-content-center mb-3`} style={{ width: '45px', height: '45px' }}>
                <i className={`${s.icon} fs-4`}></i>
              </div>
              <div className="text-secondary small fw-bold mb-1">{s.label}</div>
              <h1 className="fw-bold mb-0">{s.val}</h1>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH BAR (TASK 3) */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="d-flex flex-column flex-md-row gap-3">
          <div className="input-group border rounded-3 px-3 py-1 flex-grow-1 bg-white">
            <span className="input-group-text bg-transparent border-0 text-secondary"><i className="bi bi-search"></i></span>
            <input 
              type="text" 
              className="form-control border-0 shadow-none" 
              placeholder="Cari nama atau NIS..." 
              defaultValue={querySearch} 
              onChange={(e) => handleSearch(e.target.value)} 
            />
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-success rounded-3 px-4 fw-bold d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-plus-lg"></i> Tambah Santri
          </button>
        </div>
      </div>

      {/* TABLE (TASK 4: USES OPTIMISTIC DATA) */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 small fw-bold text-secondary">NIS</th>
                <th className="py-3 small fw-bold text-secondary">Nama Lengkap</th>
                <th className="py-3 small fw-bold text-secondary">Akses Login</th>
                <th className="py-3 small fw-bold text-secondary">Kelas</th>
                <th className="py-3 small fw-bold text-secondary text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {optimisticSantri.length > 0 ? (
                optimisticSantri.map((item) => (
                  <tr key={item.id} className="animate__animated animate__fadeIn">
                    <td className="px-4 py-3 fw-bold text-dark">{item.nis}</td>
                    <td className="py-3 text-dark">{item.nama_lengkap}</td>
                    <td className="py-3">
                      <div className="small text-secondary">{item.email}</div>
                      <div className="small text-success font-monospace">Pass: {item.password}</div>
                    </td>
                    <td className="py-3">
                      <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 border-0">
                        {item.kelas}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button onClick={() => handleEdit(item)} className="btn btn-sm btn-outline-primary border-0 rounded-circle"><i className="bi bi-pencil-square fs-5"></i></button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-outline-danger border-0 rounded-circle"><i className="bi bi-trash fs-5"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-secondary">Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}