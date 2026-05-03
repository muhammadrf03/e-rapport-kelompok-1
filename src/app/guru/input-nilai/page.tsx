"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function InputNilaiPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [santri, setSantri] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    santri_id: "",
    mapel_id: "",
    skor: "",
    semester: "",
    tahun_ajaran: "2024/2025"
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.mapel_id || !formData.skor) {
      alert("Mohon lengkapi semua field");
      return;
    }

    const payload = {
      santri_id: formData.santri_id,
      mapel_id: formData.mapel_id,
      skor: parseInt(formData.skor),
      semester: formData.semester,
      tahun_ajaran: formData.tahun_ajaran
    };

    if (editingId) {
      const { error } = await supabase.from("nilai").update(payload).eq("id", editingId);
      if (!error) alert("Nilai berhasil diperbarui");
    } else {
      const { error } = await supabase.from("nilai").insert([payload]);
      if (!error) alert("Nilai berhasil disimpan");
    }

    resetForm();
    fetchInitialData();
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
  };

  const handleHapus = async (id: string) => {
    if (confirm("Hapus data nilai ini?")) {
      const { error } = await supabase.from("nilai").delete().eq("id", id);
      if (!error) fetchInitialData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ santri_id: "", mapel_id: "", skor: "", semester: "", tahun_ajaran: "2024/2025" });
  };

  const filteredNilai = nilaiList.filter(n => 
    n.santri?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.mapel?.nama_mapel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="container-fluid p-0">
      <header className="mb-4">
        <h2 className="fw-bold mb-0 text-dark">Input Nilai</h2>
        <p className="text-secondary small">Input nilai santri untuk setiap mata pelajaran</p>
      </header>

      <div className="row g-4">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '20px' }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className={`rounded-3 d-flex align-items-center justify-content-center text-white ${editingId ? 'bg-primary' : 'bg-success'}`} style={{ width: '45px', height: '45px' }}>
                <i className={`bi ${editingId ? 'bi-pencil-square' : 'bi-file-earmark-medical'} fs-5`}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">{editingId ? "Edit Nilai" : "Form Input Nilai"}</h6>
                <small className="text-secondary">{editingId ? "Perbarui skor santri" : "Tambah skor baru"}</small>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold small">Nama Santri</label>
                <select className="form-select border-light-subtle py-2 rounded-3" value={formData.santri_id} onChange={(e) => setFormData({...formData, santri_id: e.target.value})}>
                  <option value="">Pilih Santri</option>
                  {santri.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small">Mata Pelajaran</label>
                <select className="form-select border-light-subtle py-2 rounded-3" value={formData.mapel_id} onChange={(e) => setFormData({...formData, mapel_id: e.target.value})}>
                  <option value="">Pilih Mata Pelajaran</option>
                  {mapel.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                </select>
              </div>

              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label fw-bold small">Skor (0-100)</label>
                  <input type="number" className="form-control border-light-subtle py-2 rounded-3" placeholder="0" value={formData.skor} onChange={(e) => setFormData({...formData, skor: e.target.value})} />
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label fw-bold small">Semester</label>
                  <select className="form-select border-light-subtle py-2 rounded-3" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})}>
                    <option value="">Pilih</option>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold small">Tahun Ajaran</label>
                <select className="form-select border-light-subtle py-2 rounded-3" value={formData.tahun_ajaran} onChange={(e) => setFormData({...formData, tahun_ajaran: e.target.value})}>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className={`btn ${editingId ? 'btn-primary' : 'btn-success'} flex-grow-1 py-2 rounded-3 fw-bold`}>
                  {editingId ? "Update Nilai" : "Simpan Nilai"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-light rounded-3 px-3"><i className="bi bi-x-lg"></i></button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR NILAI */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
              <div>
                <h6 className="fw-bold mb-0">Daftar Nilai Terinput</h6>
                <small className="text-secondary">Total: {filteredNilai.length} record ditemukan</small>
              </div>
              <div className="input-group" style={{ maxWidth: '250px' }}>
                <span className="input-group-text bg-white border-end-0 text-secondary"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control border-start-0 ps-0 small" placeholder="Cari santri/mapel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-bold">Santri</th>
                    <th className="small fw-bold">Mapel</th>
                    <th className="small fw-bold text-center">Skor</th>
                    <th className="small fw-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNilai.map((n) => (
                    <tr key={n.id}>
                      <td className="small">
                        <div className="fw-bold">{n.santri?.nama_lengkap}</div>
                        <div className="text-muted" style={{ fontSize: '10px' }}>Sem. {n.semester} | {n.tahun_ajaran}</div>
                      </td>
                      <td className="small">{n.mapel?.nama_mapel}</td>
                      <td className="text-center">
                        <span className={`badge rounded-pill ${n.skor >= 75 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {n.skor}
                        </span>
                      </td>
                      <td className="text-center">
                        <button onClick={() => handleEdit(n)} className="btn btn-sm btn-link text-primary p-1 me-2"><i className="bi bi-pencil-square"></i></button>
                        <button onClick={() => handleHapus(n.id)} className="btn btn-sm btn-link text-danger p-1"><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}