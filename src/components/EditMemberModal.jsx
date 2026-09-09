import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, RefreshCw, Upload, Camera } from 'lucide-react';
import { updateMemberAdmin } from '../services/memberService';
import { uploadProfilePhoto } from '../services/storageService';
import { useToast } from './Toast';
import SearchableVerticalSelect from './SearchableVerticalSelect';
import { VERTICAL_OPTIONS, parseVerticals, formatVerticals } from '../constants/verticals';

export default function EditMemberModal({ isOpen, member, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    memberAddress: '',
    businessAddress: '',
    vertical: [],
    customVertical: '',
    profilePhoto: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (member) {
      const parsedVerts = parseVerticals(member.vertical || '');
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        memberAddress: member.memberAddress || '',
        businessAddress: member.businessAddress || '',
        vertical: parsedVerts.standard,
        customVertical: parsedVerts.custom,
        profilePhoto: member.profilePhoto || '',
        isActive: member.isActive !== false
      });
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    const res = await uploadProfilePhoto(file, formData.phone || 'photo');
    setIsUploadingPhoto(false);

    if (res.success && res.downloadUrl) {
      setFormData((prev) => ({ ...prev, profilePhoto: res.downloadUrl }));
      addToast('Profile photo updated!', 'success');
    } else {
      addToast(res.error || 'Failed to upload photo.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Member name is required.', 'error');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      addToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    const resolvedVertical = formatVerticals(formData.vertical, formData.customVertical);

    // Auto-calculate status based on field completeness
    const isComplete = Boolean(
      formData.name.trim() &&
      cleanPhone &&
      formData.businessAddress.trim() &&
      resolvedVertical &&
      formData.profilePhoto
    );
    const computedStatus = isComplete ? 'Completed' : 'Pending';

    setIsSubmitting(true);
    const res = await updateMemberAdmin(member.id, {
      name: formData.name.trim(),
      phone: cleanPhone,
      memberAddress: formData.memberAddress.trim(),
      businessAddress: formData.businessAddress.trim(),
      vertical: resolvedVertical,
      profilePhoto: formData.profilePhoto,
      status: computedStatus,
      isActive: Boolean(formData.isActive)
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast('Member updated successfully!', 'success');
      onSuccess?.();
      onClose?.();
    } else {
      addToast(res.error || 'Failed to update member.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rotary-navy to-rotary-royal px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rotary-gold/20 text-rotary-goldLight">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                Edit Member Profile
              </h3>
              <p className="text-xs text-slate-300">
                Update details for {member.name || member.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Photo Preview & Change */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700">Member Photo</p>
              <label className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 text-rotary-navy" />
                <span>{isUploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  disabled={isUploadingPhoto}
                />
              </label>
              {formData.profilePhoto && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, profilePhoto: '' })}
                  className="ml-2 text-xs text-rose-500 hover:underline"
                >
                  Remove
                </button>
              )}
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
              value={formData.memberAddress}
              onChange={(e) => setFormData({ ...formData, memberAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
            />
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Business Address
            </label>
            <textarea
              rows={2}
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
            />
          </div>

          {/* Vertical searchable dropdown */}
          <SearchableVerticalSelect
            value={formData.vertical}
            onChange={(val) => {
              setFormData({
                ...formData,
                vertical: val,
                customVertical: val.includes('Other') ? formData.customVertical : ''
              });
            }}
            customValue={formData.customVertical}
            onCustomChange={(customVal) => {
              setFormData({
                ...formData,
                customVertical: customVal
              });
            }}
            label="Vertical / Sector"
          />

          {/* Account Status */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive === true}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active (Enabled)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive === false}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Disabled
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Disabled members cannot access or submit their profile form.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rotary-navy text-white hover:bg-rotary-darkBlue active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-rotary-gold" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
