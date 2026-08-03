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

### Functional Modules Matrix
- **FR-100**: Note Management (Create, Edit, Auto Save, Soft Delete, Restore, Permanent Delete)
- **FR-200**: Search Engine (Real-time Keyword Search, Snippet Match, Highlight)
- **FR-300**: Subject Management (Single Subject Assignment & Filtering)
- **FR-400**: Tag Management (Multi-tag Assignment & Filtering)
- **FR-500**: Favorites Management (Star Toggle & Favorite View)
- **FR-600**: Trash Management (Trash View & Empty Trash Confirmation)
- **FR-700**: Application Settings (Dark/Light Theme, Font Size, Sort Options)
- **FR-800**: Import & Export (JSON Backup & Recovery)
- **FR-900**: Error Handling & Validation (Skeleton Loading, Zero States, Local Fallback)

---

### 5.2 FR-100 — Note Management

#### FR-101 — Create Note [P0]
- **Description**: Pengguna dapat membuat catatan baru kapan saja melalui tombol **New Note** (`Ctrl+N`).
- **Acceptance Criteria**:
  - Tombol **New Note** selalu terlihat pada halaman utama.
  - Sistem membuat Note baru dengan UUID unik.
  - Editor otomatis terbuka dan terfokus setelah Note dibuat.
- **Validation Rules**: Judul maks 150 karakter. Isi, subject, dan tag opsional.
- **Edge Cases**: Default judul `Untitled Note` jika kosong.
- **Dependencies**: IndexedDB / LocalStorage, UUID generator.

#### FR-102 — Edit Note & Auto Save [P0]
- **Description**: Pengguna dapat mengubah isi catatan kapan saja. Perubahan tersimpan otomatis tanpa tombol Save.
- **Acceptance Criteria**:
  - Perubahan isi disimpan secara otomatis (< 500ms debounce).
  - Field `updatedAt` diperbarui otomatis.
  - Refresh halaman tidak menyebabkan kehilangan data.
- **Dependencies**: IndexedDB, Debounce Utility.

#### FR-103 — Delete Note (Soft Delete) [P0]
- **Description**: Penghapusan dari daftar utama memindahkan catatan ke Trash (`isTrash: true`).
- **Acceptance Criteria**: Catatan menghilang dari daftar utama dan muncul di halaman Trash.

#### FR-104 — Restore Note [P0]
- **Description**: Catatan di Trash dapat dipulihkan kembali ke daftar utama.
- **Acceptance Criteria**: `isTrash: false`, catatan muncul kembali di daftar utama dengan data utuh.

#### FR-105 — Permanently Delete Note [P1]
- **Description**: Penghapusan permanen dari halaman Trash.
- **Acceptance Criteria**: Konfirmasi dialog sebelum data benar-benar dihapus dari IndexedDB.
