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
  AlertCircle,
  Calendar,
  Heart,
  Cake,
  ArrowLeft
} from 'lucide-react';
import { addSingleMember } from '../services/memberService';
import { uploadProfilePhoto, validateImageFile } from '../services/storageService';
import { useToast } from './Toast';
import SearchableVerticalSelect from './SearchableVerticalSelect';
import EasyDatePicker from './EasyDatePicker';
import { VERTICAL_OPTIONS, formatVerticals } from '../constants/verticals';
import { formatDateDisplay } from '../utils/dateUtils';

export default function AddMemberModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    weddingDate: '',
    memberAddress: '',
    businessAddress: '',
    vertical: [],
    customVertical: '',
    profilePhoto: ''
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

        if (!uploadRes.success) {
          throw new Error(uploadRes.error || 'Failed to upload photo.');
        }
        finalPhotoUrl = uploadRes.downloadUrl;
      }

      setUploadProgress(80);

      const resolvedVertical = formatVerticals(formData.vertical, formData.customVertical);

      // Auto-compute status: Completed if Name, Phone, Business Address, Vertical, and Profile Photo exist
      const isComplete = Boolean(
        formData.name.trim() &&
        cleanPhone &&
        formData.businessAddress.trim() &&
        resolvedVertical.trim() &&
        finalPhotoUrl.trim()
      );
      const computedStatus = isComplete ? 'Completed' : 'Pending';

      // Add to Firestore
      const res = await addSingleMember({
        name: formData.name.trim(),
        phone: cleanPhone,
        dob: formData.dob || '',
        weddingDate: formData.weddingDate || '',
        memberAddress: formData.memberAddress.trim(),
        businessAddress: formData.businessAddress.trim(),
        vertical: resolvedVertical,
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
          dob: '',
          weddingDate: '',
          memberAddress: '',
          businessAddress: '',
          vertical: [],
          customVertical: '',
          profilePhoto: ''
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col w-full h-full min-h-screen animate-in fade-in duration-200">
      
      {/* Full Page Top Header Bar */}
      <header className="bg-rotary-navy text-white border-b border-slate-800 flex-shrink-0 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center gap-2 text-sm font-semibold"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-rotary-gold" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-2xl text-white leading-tight">
                Add New Member
              </h1>
              <p className="text-xs text-slate-300 hidden sm:block">
                Rotary Club of Erode Central • Register a new club member
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Full Page Content Area */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full pb-32">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-6">
            
            {/* CARD 1: Personal Details & Contact */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold font-display text-slate-800">
                  Personal & Contact Details
                </h2>
                <p className="text-xs text-slate-500">
                  Enter member name, mobile number and photo
                </p>
              </div>

              {/* Photo Preview & Upload */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Member Photo (Optional)
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files[0])}
                    />
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rotary-navy text-white text-xs font-bold hover:bg-rotary-darkBlue active:scale-95 transition shadow-sm disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-rotary-gold" />
                        <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-500">
                      Formats: <span className="font-semibold text-slate-700">JPG, JPEG, PNG</span> (Auto-compressed)
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
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (10-digit) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Date of Birth & Wedding Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EasyDatePicker
                  label="Date of Birth"
                  type="dob"
                  value={formData.dob}
                  onChange={(val) => setFormData((prev) => ({ ...prev, dob: val }))}
                  minYear={1930}
                  maxYear={new Date().getFullYear()}
                />

                <EasyDatePicker
                  label="Wedding Date"
                  type="wedding"
                  value={formData.weddingDate}
                  onChange={(val) => setFormData((prev) => ({ ...prev, weddingDate: val }))}
                  minYear={1950}
                  maxYear={new Date().getFullYear() + 1}
                />
              </div>

            </div>

            {/* RIGHT CARD: Addresses & Business Verticals */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold font-display text-slate-800">
                  Address & Classification
                </h2>
                <p className="text-xs text-slate-500">
                  Residential address, office details and business vertical
                </p>
              </div>

              {/* Member Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential / Member Address
                </label>
                <textarea
                  rows={3}
                  placeholder="Door No, Street Name, Area, Erode - Pin code"
                  value={formData.memberAddress}
                  onChange={(e) => setFormData({ ...formData, memberAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                />
              </div>

              {/* Business Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Address (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Company name, office location, Erode"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
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

            </div>

          </div>

          {/* Fixed Floating Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-4 px-4 sm:px-8 shadow-2xl z-30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              {isSubmitting ? (
                <div className="w-full sm:max-w-xs space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Saving member...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rotary-navy to-rotary-gold h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 hidden sm:block">
                  Fields marked with <span className="text-rose-500 font-bold">*</span> are required.
                </p>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Member...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-rotary-navy" />
                      <span>Save Member</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>
      </main>

    </div>
  );
}
