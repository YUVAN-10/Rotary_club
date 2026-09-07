import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';
import { deleteMember } from '../services/memberService';
import { useToast } from './Toast';

export default function DeleteConfirmModal({ isOpen, member, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteMember(member.id);
    setIsDeleting(false);

    if (res.success) {
      addToast(`Member ${member.name || member.phone} deleted successfully.`, 'success');
      onSuccess?.();
      onClose?.();
    } else {
      addToast(res.error || 'Failed to delete member.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center">
        
        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="font-display font-bold text-lg text-slate-800">
          Delete Member?
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-slate-800">{member.name || member.phone}</span> ({member.phone})? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
