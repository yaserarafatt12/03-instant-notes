import React, { useEffect, useState, useRef } from 'react';
import { Star, Trash2, X, Tag, BookOpen, Save, Sparkles } from 'lucide-react';
import type { Note } from '../types/note';

interface NoteEditorProps {
  note: Note | null;
  onSave: (updated: Note) => void;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleTrash: (id: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onClose,
  onToggleFavorite,
  onToggleTrash,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [savedStatus, setSavedStatus] = useState<string>('Tersimpan');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSubject(note.subject);
      setTags(note.tags);
      setSavedStatus('Tersimpan');
    }
  }, [note?.id]);

  // Focus title on opening a brand new note
  useEffect(() => {
    if (note && !note.title && !note.content) {
      titleRef.current?.focus();
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600 select-none">
        <Sparkles className="w-12 h-12 mb-3 stroke-1 opacity-50" />
        <p className="text-sm font-medium">Pilih catatan di sebelah kiri atau buat catatan baru</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">Pintasan: Ctrl+N</p>
      </div>
    );
  }

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutoSave(val, content, subject, tags);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutoSave(title, val, subject, tags);
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    triggerAutoSave(title, content, val, tags);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);
        triggerAutoSave(title, content, subject, updatedTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    triggerAutoSave(title, content, subject, updatedTags);
  };

  const triggerAutoSave = (t: string, c: string, s: string, tg: string[]) => {
    setSavedStatus('Menyimpan...');
    const updatedNote: Note = {
      ...note,
      title: t,
      content: c,
      subject: s,
      tags: tg,
      updatedAt: Date.now(),
    };
    onSave(updatedNote);
    setTimeout(() => setSavedStatus('Tersimpan secara lokal'), 400);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-900">
            <Save className="w-3.5 h-3.5" />
            <span>{savedStatus}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(note.id)}
            className={`p-2 rounded-xl transition-colors ${
              note.isFavorite
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={note.isFavorite ? 'Favorit' : 'Tambah ke Favorit'}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => onToggleTrash(note.id)}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
            title="Pindahkan ke tempat sampah"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Tutup editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
        {/* Title Input */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Judul catatan..."
          className="w-full text-2xl font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 border-none focus:outline-none"
        />

        {/* Subject & Tags Controls */}
        <div className="flex flex-wrap items-center gap-3 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Subject Picker */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <input
              type="text"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="Tambah Subjek (misal: Fisika)..."
              className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
            />
          </div>

          {/* Tags List & Add Input */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-medium rounded-md"
              >
                #{t}
                <button onClick={() => handleRemoveTag(t)} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ Tag (Tekan Enter)..."
              className="bg-transparent text-slate-600 dark:text-slate-400 focus:outline-none placeholder:text-slate-400 text-xs"
            />
          </div>
        </div>

        {/* Content Textarea */}
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Mulai ketik catatan di sini... Semua teks tersimpan secara instan."
          className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 border-none focus:outline-none resize-none leading-relaxed text-sm font-normal"
        />
      </div>
    </div>
  );
};
