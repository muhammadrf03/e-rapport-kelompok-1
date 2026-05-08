"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function HalamanMasuk() {
  const [alamatEmail, setAlamatEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sedangMemproses, setSedangMemproses] = useState(false);

  // LOGIKA GURU (GOOGLE OAUTH)
  const masukLewatGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) alert("Masalah Google: " + error.message);
  };

  // LOGIKA SANTRI (EMAIL & PASSWORD)
  const masukSebagaiSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    setSedangMemproses(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: alamatEmail,
      password: kataSandi,
    });
    
    if (error) {
      alert("Gagal masuk: " + error.message);
    } else {
      window.location.href = "/santri/dashboard";
    }
    setSedangMemproses(false);
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#e8f5e9" }}>
      {/* CSS Animasi Langsung di Sini */}
      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .toga-bounce {
          display: inline-block;
          animation: floating 3s ease-in-out infinite;
          font-size: 2.5rem;
        }
      `}</style>

      <div className="card border-0 shadow-sm p-4" style={{ width: "400px", borderRadius: "20px" }}>
        <div className="card-body">
          <div className="text-center mb-3">
             <div className="bg-success text-white d-inline-flex align-items-center justify-content-center rounded-circle" 
                  style={{ width: "80px", height: "80px" }}>
               {/* Ikon Toga Bergerak */}
               <span className="toga-bounce">🎓</span>
             </div>
          </div>
          
          <h2 className="text-center fw-bold mb-0">Login</h2>
          <p className="text-center text-muted small mb-4">E-Raport Pondok Pesantren</p>

          <form onSubmit={masukSebagaiSantri}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input 
                type="email" 
                className="form-control bg-light border-0 py-2" 
                placeholder="Masukkan Email"
                style={{ borderRadius: "10px" }}
                value={alamatEmail}
                onChange={(e) => setAlamatEmail(e.target.value)}
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold">Password</label>
              <input 
                type="password" 
                className="form-control bg-light border-0 py-2" 
                placeholder="Masukkan Password"
                style={{ borderRadius: "10px" }}
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                required 
              />
            </div>

            <div className="d-grid gap-2 mb-2">
              <button 
                type="submit" 
                className="btn btn-success py-2 fw-bold" 
                style={{ borderRadius: "10px", backgroundColor: "#4CAF50" }}
                disabled={sedangMemproses}
              >
                {sedangMemproses ? "..." : "Login Murid"}
              </button>
            </div>
            
            <div className="text-center mb-2">
              <span className="text-muted small">atau</span>
            </div>

            <div className="d-grid">
              <button 
                type="button" 
                onClick={masukLewatGoogle} 
                className="btn btn-outline-success py-2 fw-bold"
                style={{ borderRadius: "10px" }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                     alt="Google" 
                     style={{ width: "18px", marginRight: "8px" }} />
                Login Guru
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}