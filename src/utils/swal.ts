import Swal from "sweetalert2";
import "animate.css"; // Import library animasi

// Helper untuk Toast (Notifikasi Pojok)
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  // Efek animasi saat muncul dan hilang
  showClass: {
    popup: "animate__animated animate__fadeInRight animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutRight animate__faster",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const showToast = (icon: "success" | "error" | "warning" | "info", title: string) => {
  Toast.fire({ 
    icon, 
    title,
    // Custom style agar lebih modern
    background: "#fff",
    customClass: {
      popup: "rounded-4 shadow-sm",
      title: "fw-semibold text-dark fs-6"
    }
  });
};

// Helper untuk Konfirmasi (Hapus/Logout)
export const confirmAction = async (title: string, text: string, icon: "warning" | "question" = "warning") => {
  return await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: "#14532d", 
    cancelButtonColor: "#f8d7da", // Warna soft merah untuk batal
    confirmButtonText: "Ya, Lanjutkan",
    cancelButtonText: "<span style='color: #dc3545'>Batal</span>", // Text batal jadi merah
    reverseButtons: true,
    
    // UI Styling yang tidak kaku
    padding: "2em",
    color: "#1a202c",
    background: "#ffffff",
    backdrop: `rgba(20, 83, 45, 0.15)`, // Backdrop hijau transparan tipis
    
    // Animasi Popup yang smooth
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    
    // Custom Class untuk CSS Tailwind/Bootstrap
    customClass: {
      popup: "rounded-5 shadow-lg",
      title: "fw-bold",
      confirmButton: "btn-confirm-swal py-2 px-4 rounded-3",
      cancelButton: "btn-cancel-swal py-2 px-4 rounded-3 border-0",
    },
  });
};