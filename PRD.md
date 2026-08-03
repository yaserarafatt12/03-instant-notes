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

---

### 5.3 FR-200 — Search Engine (Complete Matrix: FR-201 s/d FR-210)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-201** | Instant Search | P0 | ✅ Live | Hasil pencarian real-time berkecepatan tinggi tanpa tombol Enter/Search (<100ms). |
| **FR-202** | Search by Title | P0 | ✅ Live | Case-insensitive searching pada judul catatan. |
| **FR-203** | Search by Content | P0 | ✅ Live | Case-insensitive tokenization searching pada seluruh isi catatan. |
| **FR-204** | Search by Subject | P0 | ✅ Live | Penyaringan & pencarian catatan berdasarkan subjek/topik. |
| **FR-205** | Search by Tag | P0 | ✅ Live | Pencarian & penyaringan catatan berdasarkan tag (`#tag`). |
| **FR-206** | Search Ranking | P1 | ✅ Live | Algoritma relevansi: Title match (50) > Subject (30) > Tag (30) > Content (10). |
| **FR-207** | Highlight Matching Text | P1 | ✅ Live | Penyorotan visual kata kunci dengan `<HighlightText />`. |
| **FR-208** | Empty Search State | P0 | ✅ Live | Zero state saat pencarian kosong dengan tombol "Clear Search". |
| **FR-209** | Fuzzy Search | P2 | ✅ Live | Algoritma Levenshtein distance untuk toleransi typo (misal: 'fisik' -> 'fisika'). |
| **FR-210** | Search History | P2 | ✅ Live | Menyimpan riwayat pencarian lokal di peramban. |

---

### 5.4 FR-300 — Subject Management (Complete Matrix: FR-301 s/d FR-312)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-301** | Create Subject | P0 | ✅ Live | Pengelompokan catatan berdasarkan topik utama (maks 40 karakter). |
| **FR-302** | Rename Subject | P1 | ✅ Live | Mengubah nama subjek tanpa merusak atau mengubah isi catatan. |
| **FR-303** | Delete Subject | P1 | ✅ Live | Menghapus subjek (catatan otomatis fallback ke `Umum` / `No Subject`). |
| **FR-304** | Prevent Duplicate | P0 | ✅ Live | Pencegahan nama subjek ganda (case-insensitive check). |
| **FR-305** | Assign Subject | P0 | ✅ Live | Prinsip 1 catatan = 1 subjek utama. |
| **FR-306** | Remove Subject | P1 | ✅ Live | Menghapus keterkaitan subjek dari catatan. |
| **FR-307** | Subject Color | P2 | ✅ Live | Identitas warna visual fixed palette pada badge subjek. |
| **FR-308** | Subject Statistics | P2 | ✅ Live | Hitungan jumlah catatan otomatis per subjek pada sidebar (contoh: `Fisika (12)`). |
| **FR-309** | Subject Filter | P0 | ✅ Live | Penyaringan 1-klik catatan berdasarkan subjek. |
| **FR-310** | Empty Subject State | P1 | ✅ Live | Zero state saat subjek belum memiliki catatan. |
| **FR-311** | Default Subject | P1 | ✅ Live | Default ke `Umum` / `No Subject` saat pembuatan tanpa kategori. |
| **FR-312** | Subject Validation | P0 | ✅ Live | Validasi UTF-8, unik, maks 40 karakter, non-spasi kosong. |

---

### 5.5 FR-400 — Tag Management (Complete Matrix: FR-401 s/d FR-412)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-401** | Create Tag | P0 | ✅ Live | Pembuatan tag fleksibel (maks 25 karakter, case-insensitive). |
| **FR-402** | Assign Multiple Tags | P0 | ✅ Live | Banyak tag per catatan tanpa duplikasi dalam satu catatan. |
| **FR-403** | Remove Tag | P0 | ✅ Live | Menghapus tag dari catatan tertentu tanpa menghapus tag sistem. |
| **FR-404** | Rename Tag | P1 | ✅ Live | Mengubah nama tag pada seluruh catatan yang menggunakannya. |
| **FR-405** | Delete Tag | P1 | ✅ Live | Menghapus tag dari seluruh catatan sistem. |
| **FR-406** | Tag Autocomplete | P1 | ✅ Live | Autocomplete saran tag saat pengetikan `#tag` di editor. |
| **FR-407** | Prevent Duplicate Tag | P0 | ✅ Live | Mencegah tag ganda secara case-insensitive (`exam` == `Exam`). |
| **FR-408** | Multi Tag Filter | P1 | ✅ Live | Penyaringan catatan berdasarkan tag di sidebar. |
| **FR-409** | Popular Tags | P2 | ✅ Live | Pengurutan & statistik frekuensi tag paling banyak digunakan. |
| **FR-410** | Tag Color | P2 | ✅ Live | Warna badge tag visual (amber/emerald accent). |
| **FR-411** | Merge Tags | P2 | ✅ Live | Penggabungan dua tag dengan arti sama. |
| **FR-412** | Empty Tag State | P1 | ✅ Live | Tampilan informatif zero state saat belum ada tag. |

---

### 5.6 FR-500 — Favorites (Complete Matrix: FR-501 s/d FR-510)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-501** | Mark as Favorite | P0 | ✅ Live | Toggle bintang favorit `☆` <-> `★`. |
| **FR-502** | Favorite List | P0 | ✅ Live | Tampilan khusus seluruh catatan favorit di sidebar. |
| **FR-503** | Favorite Filter | P1 | ✅ Live | Pipeline integrasi penyaringan Favorit + Search + Subject + Tag. |
| **FR-504** | Favorite Sorting | P1 | ✅ Live | Pengurutan Favorit mengikuti sistem sorting utama. |
| **FR-505** | Bulk Favorite | P2 | ✅ Live | Mengubah status favorit beberapa catatan. |
| **FR-506** | Favorite Shortcut | P2 | ✅ Live | Pintasan papan ketik `Alt+F` untuk langsung berpindah ke tampilan Favorit. |
| **FR-507** | Favorite Badge | P1 | ✅ Live | Badge bintang visual `★` konsisten di Note List, Search Result, Subject, dan Tag view. |
| **FR-508** | Favorite Persistence | P0 | ✅ Live | Penyimpanan status `isFavorite` permanen di IndexedDB. |
| **FR-509** | Favorite Statistics | P2 | ✅ Live | Hitungan jumlah favorit otomatis di sidebar (contoh: `Favorit (5)`). |
| **FR-510** | Remove All Favorites | P2 | ✅ Live | Opsi reset status seluruh favorit kembali menjadi catatan biasa. |

---

### 5.7 FR-600 — Trash Management (Complete Matrix: FR-601 s/d FR-610)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-601** | Soft Delete | P0 | ✅ Live | Menandai `isTrash: true` tanpa menghapus data asli dari IndexedDB. |
| **FR-602** | Trash View | P0 | ✅ Live | Tampilan khusus tempat sampah beserta tanggal penghapusan & metadata. |
| **FR-603** | Restore Note | P0 | ✅ Live | Memulihkan catatan dari Trash kembali ke daftar aktif 100% utuh. |
| **FR-604** | Permanent Delete | P1 | ✅ Live | Hapus permanen dari IndexedDB & otomatis perbarui Search Index. |
| **FR-605** | Empty Trash | P1 | ✅ Live | Konfirmasi & pembersihan permanen seluruh isi tempat sampah (reset counter ke 0). |
| **FR-606** | Bulk Restore | P2 | ✅ Live | Pemulihan masal beberapa catatan dari tempat sampah. |
| **FR-607** | Bulk Delete | P2 | ✅ Live | Penghapusan masal secara permanen dari tempat sampah. |
| **FR-608** | Trash Counter | P1 | ✅ Live | Hitungan otomatis jumlah catatan di tempat sampah pada sidebar (contoh: `Trash (12)`). |
| **FR-609** | Delete Protection | P1 | ✅ Live | Modal dialog konfirmasi untuk mencegah salah klik penghapusan permanen. |
| **FR-610** | Auto Cleanup | P3 | ⏳ Future | Retensi penghapusan otomatis 30/90 hari (Masa Depan). |

---

### 5.8 FR-700 — Settings & Preferences (Complete Matrix: FR-701 s/d FR-710)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-701** | Theme Preference | P0 | ✅ Live | Mode Light, Dark, dan System (auto-sync `prefers-color-scheme`). |
| **FR-702** | Font Size | P1 | ✅ Live | Ukuran teks realtime: Small (14px), Medium (16px), Large (18px). |
| **FR-703** | Default Sorting | P1 | ✅ Live | Urutan default otomatis diingat (Recently Edited, Newest, Oldest, A-Z, Z-A). |
| **FR-704** | Search History | P2 | ✅ Live | Tombol pembersihan riwayat pencarian lokal. |
| **FR-705** | Keyboard Shortcut Toggle | P2 | ✅ Live | Toggle mengaktifkan/menonaktifkan seluruh pintasan papan ketik (`Ctrl+N`, `Ctrl+K`, `Alt+F`, `Esc`). |
| **FR-706** | Reset Settings | P2 | ✅ Live | Mengembalikan preferensi ke konfigurasi bawaan aplikasi. |
| **FR-707** | About InstantNotes | P3 | ✅ Live | Informasi modal offline: Versi 1.0, Developer, Link GitHub Repo, & Pernyataan Privasi. |
| **FR-709** | Settings Persistence | P0 | ✅ Live | Menyimpan preferensi di `localStorage` agar tidak hilang saat browser ditutup. |
| **FR-710** | Default Settings Fallback | P0 | ✅ Live | Fallback otomatis ke default (`theme: system, font: 16, sort: updated, shortcuts: true`) jika data belum ada. |

---

### 5.9 FR-800 — Import & Export (Complete Matrix: FR-801 s/d FR-810)

| ID | Requirement Name | Priority | Status | Description |
|---|---|---|---|---|
| **FR-801** | Export All Notes | P0 | ✅ Live | Unduh cadangan JSON penuh (`instantnotes-backup.json`) berisi seluruh catatan, subjek, tag, dan metadata. |
| **FR-802** | Export Selected Notes | P1 | ✅ Live | Ekspor sebagian catatan terpilih ke dalam file backup JSON. |
| **FR-803** | Export as Plain Text | P2 | ✅ Live | Ekspor 1 catatan langsung ke file teks `.txt` (`FileDown` icon di toolbar editor). |
| **FR-804** | Import Backup | P0 | ✅ Live | Pemulihan catatan dari file backup JSON tanpa server/internet. |
| **FR-805** | Import Validation | P0 | ✅ Live | Validasi integritas format JSON & skema sebelum penulisan ke IndexedDB. |
| **FR-806** | Conflict Resolution | P2 | ✅ Live | Penanganan aman konflik ID saat import (Replace/Duplicate). |
| **FR-807** | Backup Metadata | P1 | ✅ Live | Metadata lengkap di dalam backup JSON (`version: 1.0.0`, `exportedAt`, `totalNotes`, `totalSubjects`, `totalTags`). |
| **FR-808** | Version Compatibility | P2 | ✅ Live | Pengecekan kompatibilitas versi schema JSON. |
| **FR-809** | Backup Confirmation | P1 | ✅ Live | Notifikasi instan tanpa reload saat export berhasil. |
| **FR-810** | Restore Confirmation | P1 | ✅ Live | Modal konfirmasi dialog sebelum mengimpor / menimpa data. |

---

## BAB 6 — Non-Functional Requirements (NFR-900 Matrix)

| ID | Requirement Name | Priority | Target Benchmark | Status |
|---|---|---|---|---|
| **NFR-901** | Startup Performance | P0 | Cold start < 3s, Warm start < 1s | ✅ Passed (Vite 200ms) |
| **NFR-902** | Search Performance | P0 | < 50ms for 1,000 notes | ✅ Passed (Vitest 5ms) |
| **NFR-903** | Offline Availability | P0 | 100% features work without internet | ✅ Passed (Local IndexedDB) |
| **NFR-904** | Auto Save Reliability | P0 | 500ms debounced save without loss | ✅ Passed |
| **NFR-905** | Data Integrity | P0 | Zero duplicate IDs / zero corrupted notes | ✅ Passed |
| **NFR-906** | UI Responsiveness | P1 | < 100ms interaction latency | ✅ Passed |
| **NFR-907** | Browser Compatibility | P1 | Chrome, Edge, Firefox, Brave | ✅ Passed |
| **NFR-908** | Responsive Design | P1 | Desktop (>=1280px), Tablet, Mobile | ✅ Passed |
| **NFR-909** | Accessibility | P1 | WCAG AA contrast & ARIA labels | ✅ Passed |
| **NFR-910** | Maintainability | P1 | TypeScript modular architecture | ✅ Passed |
| **NFR-911** | Code Quality | P1 | Strict TS, 0 lint error, 0 build warning | ✅ Passed |
| **NFR-912** | Security | P0 | 0 `dangerouslySetInnerHTML`, input sanitization | ✅ Passed |
| **NFR-913** | Privacy | P0 | Privacy by Default (0 telemetry, local-only) | ✅ Passed |

---

## BAB 7 — UI/UX Specification (UX-1000 s/d UX-1500 Matrix)

| Module ID | Module Title | Status | Core Specification |
|---|---|---|---|
| **UX-1000** | UI & Design Philosophy | ✅ Live | Modern Minimalism, 3-panel layout, *Content First*, *One Click Rule*, *Instant Feedback*. |
| **UX-1100** | Design Tokens Specification | ✅ Live | Centralized design tokens: Color, Typography, Spacing (4-point), Border Radius, Shadow, Motion, Z-Index. |
| **UX-1200** | Typography System | ✅ Live | Inter sans-serif stack, JetBrains Mono code font, 7-level hierarchy, max 720px (70-80 chars) reading width, 1.7 line height. |
| **UX-1300** | Color & Theme System | ✅ Live | Neutral Slate UI + Amber-500 accent + Semantic feedback (Green success, Rose error, Amber warning, Sky info). WCAG AA compliant. |
| **UX-1400** | Layout & Grid System | ✅ Live | 8-Point Grid system (8, 16, 24, 32, 40, 48, 64px), 280px desktop sidebar, 720-800px editor reading width, bottom-right toasts. |
| **UX-1500** | Component Library Specification | ✅ Live | 17 Atomic components (Button `CMP-1501`, Input `CMP-1502`, SearchBar `CMP-1503`, Textarea `CMP-1504`, Sidebar `CMP-1505`, NavItem `CMP-1506`, NoteCard `CMP-1507`, SubjectBadge `CMP-1508`, TagChip `CMP-1509`, Dropdown `CMP-1510`, Modal `CMP-1511`, Dialog `CMP-1512`, Toast `CMP-1513`, Tooltip `CMP-1514`, EmptyState `CMP-1515`, Skeleton `CMP-1516`, Spinner `CMP-1517`). |
