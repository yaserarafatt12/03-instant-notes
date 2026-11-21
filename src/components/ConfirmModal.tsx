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
            {variant === 'danger' && <Trash2 className="w-4 h-4 text-rose-400" />}
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 q-text-muted hover:q-text-primary rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs q-text-secondary leading-relaxed font-normal">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 glass-control q-text-primary font-semibold text-xs rounded-full"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 font-semibold text-xs rounded-full transition-all active:scale-[0.98] ${
              variant === 'danger'
                ? 'bg-rose-500/85 hover:bg-rose-500 border border-rose-300/35 text-white'
                : 'glass-btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
