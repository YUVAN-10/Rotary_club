import React, { useState } from 'react';
import { UserCheck, UserX, RefreshCw, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { setMemberActiveStatus } from '../services/memberService';
import { useToast } from './Toast';

export default function ToggleStatusModal({ isOpen, member, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !member) return null;

  const isCurrentlyActive = member.isActive !== false;
  const targetState = !isCurrentlyActive; // If currently active, target is false (Disable); if disabled, target is true (Enable)

  const handleToggle = async () => {
    setIsUpdating(true);
    const res = await setMemberActiveStatus(member.id, targetState);
    setIsUpdating(false);

    if (res.success) {
      addToast(
        targetState
          ? `Member ${member.name || member.phone} has been enabled successfully.`
          : `Member ${member.name || member.phone} has been disabled.`,
        'success'
      );
      onSuccess?.();
      onClose?.();
    } else {
      addToast(res.error || 'Failed to update member status.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isUpdating}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isCurrentlyActive 
              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}
        >
          {isCurrentlyActive ? (
            <UserX className="w-7 h-7" />
          ) : (
            <UserCheck className="w-7 h-7" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-xl text-slate-800">
          {isCurrentlyActive ? 'Disable Member?' : 'Enable Member?'}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
          {isCurrentlyActive ? (
            <>
              Are you sure you want to disable <span className="font-bold text-slate-800">{member.name || member.phone}</span> ({member.phone})?
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Disabled members cannot edit or submit their profile form, but their records stay safely in the database.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to re-enable <span className="font-bold text-slate-800">{member.name || member.phone}</span> ({member.phone})?
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The member will be able to access and update their profile form again.
              </span>
            </>
          )}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={isUpdating}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleToggle}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              isCurrentlyActive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            }`}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : isCurrentlyActive ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>Disable Member</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Enable Member</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
