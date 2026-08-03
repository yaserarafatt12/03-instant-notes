# Product Requirements Document (PRD) — InstantNotes

## BAB 1 — Product Vision

### 1.1 Ringkasan Produk
InstantNotes adalah aplikasi pencatat pribadi berbasis web (*Local-First & Offline-by-Default*) yang dirancang untuk membantu siswa, mahasiswa, dan praktisi menyimpan, mencari, serta mengelola catatan dengan cepat tanpa bergantung pada koneksi internet ataupun akun.

### 1.2 Filosofi Produk
> **"The fastest way from thought → note → retrieval."**
95% pengguna tidak membutuhkan database relasional atau visual kanban board yang rumit. Pengguna membutuhkan aplikasi tempat mereka dapat membuka, mengetik, mencari, dan selesai dalam hitungan detik.

### 1.3 Positioning
Bukan pengganti Notion, Obsidian, ataupun Evernote, melainkan:
> **"The fastest personal note finder."**

### 1.4 Non-Goals (Scope Boundary V1)
- Tidak ada akun / cloud authentication.
- Tidak ada cloud sync server.
- Tidak ada fitur kolaborasi / real-time sharing.
- Tidak ada markdown renderer berat / visual graph.

---

## BAB 2 — Market Positioning & Competitive Analysis

| Produk | Yang Diambil | Yang Tidak Diambil |
|---|---|---|
| **Apple Notes** | Kesederhanaan UI 3-panel | Sinkronisasi iCloud wajib |
| **Google Keep** | Kecepatan mencatat instan | Integrasi akun Google |
| **Obsidian** | Tag & pencarian cepat | Graph view & plugin kompleks |
| **Notion** | Penataan subjek / topik | Database relasional & blok rumit |

---

## BAB 3 — User Experience (UX) & Design Specifications

### 3.1 Design Principles
1. **Zero Learning Curve**: Catatan pertama dalam < 30 detik.
2. **Search Before Browse**: Pencarian instan sebagai navigasi utama.
3. **One-Click Editing**: Buka catatan langsung siap diketik.
4. **Offline Confidence**: IndexedDB local storage dengan instant auto-save.
5. **Minimal Friction**: Akses fitur utama via pintasan papan ketik (keyboard shortcuts).

---

## BAB 5 — Functional Requirements Specification (FRS)

### Requirement Priority
- **P0 (Critical)**: Wajib tersedia pada versi pertama (MVP).
- **P1 (Important)**: Penting, dapat dikembangkan setelah MVP stabil.
- **P2 (Future)**: Fitur tambahan opsional.

### 5.2 FR-100 — Note Management (Complete Matrix: FR-101 s/d FR-110)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-101** | Create Note | P0 | ✅ Live | Membuat catatan baru via `New Note` / `Ctrl+N` dengan UUID unik. |
| **FR-102** | Edit Note | P0 | ✅ Live | Mengubah isi & judul catatan kapan saja. |
| **FR-103** | Soft Delete Note | P0 | ✅ Live | Pindahkan catatan ke tempat sampah (`isTrash: true`). |
| **FR-104** | Restore Note | P0 | ✅ Live | Memulihkan catatan dari tempat sampah kembali ke daftar utama. |
| **FR-105** | Permanent Delete | P1 | ✅ Live | Hapus permanen catatan dari tempat sampah via IndexedDB. |
| **FR-106** | Duplicate Note | P1 | ✅ Live | Membuat salinan catatan baru dengan UUID & timestamp baru. |
| **FR-107** | Auto Save | P0 | ✅ Live | Penyimpanan otomatis tanpa tombol Save (< 500ms debounce). |
| **FR-108** | Note Metadata | P1 | ✅ Live | Format relatif tanggal (`Baru saja`, `2 menit lalu`, `Kemarin`). |
| **FR-109** | Pin Note | P2 | ⏳ Future | Menyematkan catatan di posisi paling atas (Masa Depan). |
| **FR-110** | Recent Notes | P1 | ✅ Live | Menyimpan & menyaring 10 catatan yang terakhir dibuka (`lastOpenedAt`). |
