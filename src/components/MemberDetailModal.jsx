import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Briefcase, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Edit3,
  Award,
  Building2,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from './Toast';

export default function MemberDetailModal({ isOpen, member, onClose, onEdit, onToggleStatus }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !member) return null;

  const isEnabled = member.isActive !== false;
  const isCompleted = member.status === 'Completed' || Boolean(
    member.name?.trim() &&
    member.phone &&
    String(member.phone).replace(/\D/g, '').slice(-10) &&
    member.businessAddress?.trim() &&
    member.vertical?.trim() &&
    member.profilePhoto?.trim()
  );
  const directFormUrl = member.phone 
    ? `${window.location.origin}/member-form?phone=${member.phone}`
    : `${window.location.origin}/member-form`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directFormUrl);
    setCopied(true);
    addToast(member.phone ? 'Direct profile link copied!' : 'Member form link copied!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden relative flex flex-col">
        
        {/* Top Decorative Card Banner */}
        <div className="bg-gradient-to-r from-rotary-navy via-rotary-darkBlue to-rotary-royal px-6 sm:px-8 pt-8 pb-16 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rotary-gold"></span>
            <span className="text-rotary-goldLight text-xs font-bold tracking-wider uppercase">
              Rotary Club of Erode Central
            </span>
          </div>
          <h3 className="font-display font-black text-2xl text-white">
            Official Member Profile
          </h3>
        </div>

        {/* Profile Showcase Body */}
        <div className="px-6 sm:px-8 pb-8 pt-0 -mt-12">
          
          {/* Header Bar with Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-md">
            
            {/* Avatar Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-700 font-bold text-3xl">
                {member.profilePhoto ? (
                  <img
                    src={member.profilePhoto}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(member.name || 'M')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name, Vertical, Status */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-800 leading-tight">
                {member.name || 'Unnamed Member'}
              </h2>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {member.vertical ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {member.vertical}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Vertical not assigned</span>
                )}

                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full text-xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed Profile</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-xs border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Submission</span>
                  </span>
                )}

                {isEnabled ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full text-xs border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Disabled</span>
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Detailed Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            
            {/* Mobile Number Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Phone className="w-4 h-4 text-rotary-navy" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Mobile Number</span>
              </div>
              <p className="font-mono font-bold text-slate-800 text-sm mt-1">
                {member.phone ? `+91 ${member.phone}` : <span className="text-slate-400 font-normal italic">No mobile registered</span>}
              </p>
            </div>

            {/* Vertical / Classification Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Tag className="w-4 h-4 text-rotary-gold" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Vertical / Sector</span>
              </div>
              <p className="font-bold text-slate-800 text-sm mt-1">
                {member.vertical || <span className="text-slate-400 font-normal italic">Not specified</span>}
              </p>
            </div>

            {/* Residential Address Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Residential Address</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {member.memberAddress || <span className="text-slate-400 italic">No residential address provided</span>}
              </p>
            </div>

            {/* Business Address Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Business Address</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {member.businessAddress || <span className="text-slate-400 italic">No business address provided</span>}
              </p>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-200">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 active:scale-95 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Member Form Link'}</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Enable / Disable Button */}
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(member)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    isEnabled
                      ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {isEnabled ? (
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
              )}

              <button
                onClick={() => {
                  onClose();
                  onEdit(member);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rotary-navy text-white font-bold text-xs hover:bg-rotary-darkBlue active:scale-95 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-rotary-gold" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
