import React, { useState, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Phone, 
  MapPin, 
  Briefcase, 
  Tag, 
  Check, 
  RefreshCw, 
  Camera, 
  Upload, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { addSingleMember } from '../services/memberService';
import { uploadProfilePhoto, validateImageFile } from '../services/storageService';
import { useToast } from './Toast';

const VERTICAL_OPTIONS = [
  'IT Services',
  'Education',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Agriculture',
  'Marketing',
  'Other'
];

export default function AddMemberModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    memberAddress: '',
    businessAddress: '',
    vertical: '',
    profilePhoto: '',
    status: 'Pending'
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handlePhotoSelect = (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData((prev) => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Please enter member name.', 'error');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      addToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    try {
      let finalPhotoUrl = formData.profilePhoto || '';

      // Upload photo if new file selected
      if (photoFile) {
        setUploadProgress(40);
        const uploadRes = await uploadProfilePhoto(
          photoFile, 
          cleanPhone, 
          (prog) => setUploadProgress(Math.max(40, prog))
        );

        if (uploadRes.success && uploadRes.downloadUrl) {
          finalPhotoUrl = uploadRes.downloadUrl;
        } else {
          console.warn('Photo upload issue:', uploadRes.error);
        }
      }

      setUploadProgress(80);

      // Auto-set status to Completed if all fields are filled
      let computedStatus = formData.status;
      if (finalPhotoUrl && formData.businessAddress.trim() && formData.vertical) {
        computedStatus = 'Completed';
      }

      // Add to Firestore
      const res = await addSingleMember({
        ...formData,
        phone: cleanPhone,
        profilePhoto: finalPhotoUrl,
        status: computedStatus
      });

      setUploadProgress(100);

      if (res.success) {
        addToast('Member added successfully!', 'success');
        onSuccess?.();
        onClose?.();
        
        // Reset state
        setFormData({
          name: '',
          phone: '',
          memberAddress: '',
          businessAddress: '',
          vertical: '',
          profilePhoto: '',
          status: 'Pending'
        });
        setPhotoFile(null);
        setPhotoPreview('');
      } else {
        addToast(res.error || 'Failed to add member.', 'error');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      addToast(err.message || 'Failed to save member.', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rotary-navy to-rotary-royal px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rotary-gold/20 text-rotary-goldLight">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                Add New Rotary Member
              </h3>
              <p className="text-xs text-slate-300">
                Register a member manually with profile photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Profile Photo Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Profile Photo (Optional)
            </label>
            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-7 h-7 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e.target.files[0])}
                  disabled={isSubmitting}
                />
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rotary-navy text-white text-xs font-bold hover:bg-rotary-darkBlue active:scale-95 transition shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-rotary-gold" />
                    <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  JPG, JPEG, PNG (Auto-compressed for fast saving)
                </p>
              </div>
            </div>
          </div>

          {/* Member Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Member Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rtn. Senthil Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number (10-digit) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
              />
            </div>
          </div>

          {/* Member Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Residential / Member Address
            </label>
            <textarea
              rows={2}
              placeholder="Door No, Street Name, Area, Erode - Pin code"
              value={formData.memberAddress}
              onChange={(e) => setFormData({ ...formData, memberAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
            />
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Business Address (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Company name, office location, Erode"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
            />
          </div>

          {/* Vertical dropdown & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vertical / Sector
              </label>
              <select
                value={formData.vertical}
                onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
              >
                <option value="">Select Vertical...</option>
                {VERTICAL_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Progress bar during saving */}
          {isSubmitting && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Saving member to database...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rotary-navy via-rotary-royal to-rotary-gold h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-rotary-navy" />
                  <span>Save Member</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
