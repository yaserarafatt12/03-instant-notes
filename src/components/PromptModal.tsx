import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (val: string) => void;
  title: string;
  initialValue?: string;
  placeholder?: string;
  submitText?: string;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialValue = '',
  placeholder = 'Masukkan nilai...',
  submitText = 'Simpan',
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md font-sans select-none animate-in fade-in duration-150"
      style={{ backgroundColor: 'var(--surface-modal-backdrop)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden p-5 space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold q-text-primary tracking-tight flex items-center gap-2">
            <Edit2 className="w-4 h-4 q-text-muted" />
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2 glass-input rounded-xl text-xs font-medium q-text-primary placeholder:text-slate-500 focus:outline-none transition-all"
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 glass-control q-text-primary font-semibold text-xs rounded-full"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 glass-btn-primary disabled:opacity-50 font-semibold text-xs rounded-full active:scale-[0.98]"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
