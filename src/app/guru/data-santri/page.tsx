"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DataSantriPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State Management
  const [santri, setSantri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchSantri();
  }, []);

  const fetchSantri = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("santri")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSantri(data);
      calculateStats(data);
    }
    setLoading(false);
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
      
      if (!error) alert("Data profil santri berhasil diperbarui!");
      else alert("Gagal update database: " + error.message);
    } else {
      // 1. Daftarkan Akun ke Supabase Auth
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
        alert("Gagal daftar Auth: " + authError.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Simpan profil ke tabel santri
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

        if (!dbError) alert("Santri dan Akun Login berhasil dibuat!");
        else alert("Gagal simpan ke database: " + dbError.message);
      }
    }

    setShowModal(false);
    resetForm();
    await fetchSantri();
    setIsSubmitting(false);
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

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data santri ini?")) {
      const { error } = await supabase.from("santri").delete().eq("id", id);
      if (!error) fetchSantri();
      else alert("Gagal menghapus: " + error.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nis: "", nama_lengkap: "", kelas: "", email: "", password: "" });
  };

  const filteredSantri = santri.filter((s) =>
    s.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nis?.toString().includes(searchTerm)
  );

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="container-fluid p-0">
      {/* MODAL FORM */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0 text-dark">{editingId ? "Edit Data Santri" : "Tambah Santri Baru"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">NIS</label>
                      <input type="text" className="form-control" required value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Kelas</label>
                      <input type="text" className="form-control" required value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Nama Lengkap</label>
                      <input type="text" className="form-control" required value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Email (Login)</label>
                      <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!!editingId} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">Password</label>
                      <input type="text" className="form-control" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
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
      <div className="row g-4 mb-4 text-center text-md-start">
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
              <h1 className="fw-bold mb-0 text-dark">{s.val}</h1>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="d-flex flex-column flex-md-row gap-3">
          <div className="input-group border rounded-3 px-3 py-1 flex-grow-1 bg-white">
            <span className="input-group-text bg-transparent border-0 text-secondary"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control border-0 shadow-none text-dark" placeholder="Cari santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-success rounded-3 px-4 py-2 fw-bold d-flex align-items-center justify-content-center gap-2">
            <i className="bi bi-plus-lg"></i> Tambah Santri
          </button>
        </div>
      </div>

      {/* TABLE */}
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
              {filteredSantri.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 fw-bold text-dark">{item.nis}</td>
                  <td className="py-3 text-dark">{item.nama_lengkap}</td>
                  <td className="py-3">
                    <div className="small text-secondary">{item.email}</div>
                    <div className="small text-success font-monospace">Pass: {item.password}</div>
                  </td>
                  <td className="py-3">
                    <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 border-0" style={{ fontSize: '11px' }}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}