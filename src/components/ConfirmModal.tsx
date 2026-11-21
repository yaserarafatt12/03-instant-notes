import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/75 backdrop-blur-md font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden p-5 space-y-4 text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            {variant === 'danger' && <Trash2 className="w-4 h-4 text-rose-400" />}
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 hover:text-white font-semibold text-xs rounded-full transition-all border border-white/15"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 font-bold text-xs rounded-full transition-all active:scale-[0.98] ${
              variant === 'danger'
                ? 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 border border-rose-300/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_rgba(244,63,94,0.3)]'
                : 'glass-btn-primary text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
