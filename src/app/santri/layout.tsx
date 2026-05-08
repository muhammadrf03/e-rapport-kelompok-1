"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function SantriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Menu disesuaikan untuk Santri
  const menu = [
    { name: "Dashboard", path: "/santri/dashboard", icon: "bi-grid" },
    { name: "Nilai", path: "/santri/nilai", icon: "bi-people" },
    { name: "Raport", path: "/santri/raport-santri", icon: "bi-book" },
  ];

  const logout = async () => {
    if (confirm("Keluar dari aplikasi?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* CSS Animasi Internal agar tidak perlu buka global.css */}
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .icon-santri-animasi {
          display: inline-block;
          animation: subtle-float 3s ease-in-out infinite;
          font-size: 24px;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>

      <div className="d-flex">
        {/* SIDEBAR */}
        <nav className="text-white min-vh-100 d-flex flex-column position-fixed" 
             style={{ width: '280px', backgroundColor: '#14532d', zIndex: 1000 }}>
          
          {/* Header Identitas */}
          <div className="p-4 mt-2">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-4 d-flex align-items-center justify-content-center fw-bold border border-white border-opacity-25" 
                   style={{ width: '56px', height: '56px', backgroundColor: '#567c55' }}>
                {/* Ikon Toga Menggantikan "GR" */}
                <span className="icon-santri-animasi">🎓</span>
              </div>
              <div>
                <div className="fw-bold mb-0" style={{ fontSize: '18px', letterSpacing: '0.5px' }}>E-Raport</div>
                <div className="opacity-75" style={{ fontSize: '13px' }}>Santri Digital</div>
              </div>
            </div>
          </div>

          <hr className="mx-4 my-2 border-white opacity-25" />

          {/* Menu Navigasi */}
          <ul className="nav nav-pills flex-column px-3 mt-3 gap-2 flex-grow-1">
            {menu.map((item) => {
              const aktif = pathname === item.path;
              return (
                <li className="nav-item" key={item.path}>
                  <Link href={item.path} 
                    className={`nav-link d-flex align-items-center gap-3 py-3 px-4 rounded-4 transition-all ${
                      aktif ? 'bg-white text-success fw-bold shadow-sm' : 'text-white opacity-75'
                    }`}
                    style={aktif ? { color: '#14532d', backgroundColor: '#ffffff' } : {}}>
                    <i className={`bi ${item.icon} fs-5`}></i>
                    <span style={{ fontSize: '16px' }}>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Bagian Bawah / Logout */}
          <div className="p-4">
            <hr className="mb-4 border-white opacity-25" />
            <button onClick={logout} 
                    className="btn text-white w-100 text-start d-flex align-items-center gap-3 px-4 opacity-75 border-0 bg-transparent shadow-none transition-all">
              <i className="bi bi-box-arrow-left fs-5"></i>
              <span style={{ fontSize: '16px' }}>Keluar</span>
            </button>
          </div>
        </nav>

        {/* CONTENT AREA */}
        <main className="w-100 min-vh-100" style={{ marginLeft: '280px', backgroundColor: '#f1f5f2' }}>
          <div className="p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}