"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function TestKoneksi() {
  const [status, setStatus] = useState<string>("Checking...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // Kita mencoba mengambil data dari tabel 'profiles' 
        // (Walaupun kosong, jika tidak error berarti koneksi berhasil)
        const { data, error } = await supabase.from("profiles").select("*").limit(1);

        if (error) {
          throw error;
        }

        setStatus("✅ Koneksi Berhasil! Database Supabase terhubung.");
      } catch (err: any) {
        setError(err.message);
        setStatus("❌ Koneksi Gagal.");
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body text-center">
          <h5 className="card-title">Status Koneksi Supabase</h5>
          <p className={`fw-bold ${error ? "text-danger" : "text-success"}`}>
            {status}
          </p>
          {error && (
            <div className="alert alert-danger mt-3">
              <strong>Error Log:</strong> {error}
              <br />
              <small>Pastikan URL dan Anon Key di .env.local sudah benar.</small>
            </div>
          )}
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => window.location.reload()}
          >
            Cek Ulang
          </button>
        </div>
      </div>
    </div>
  );
}