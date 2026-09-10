import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Phone, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Camera, 
  Briefcase, 
  Building2, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  ShieldCheck,
  Sparkles,
  Award,
  User,
  Trash2,
  Search,
  Users,
  ChevronRight,
  Calendar,
  Heart,
  Cake,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMemberByPhone, getAllMembers, updateMemberProfile } from '../services/memberService';
import { uploadProfilePhoto, validateImageFile } from '../services/storageService';
import { useToast } from '../components/Toast';
import SearchableVerticalSelect from '../components/SearchableVerticalSelect';
import EasyDatePicker from '../components/EasyDatePicker';
import { VERTICAL_OPTIONS, parseVerticals, formatVerticals } from '../constants/verticals';
import { formatDateDisplay } from '../utils/dateUtils';

export default function MemberFormPage() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Steps: 1 = Phone Verification / Member Select, 2 = Complete Profile Form, 3 = Success Screen
  const [step, setStep] = useState(1);

  // Step 1: Lookup mode ('phone' or 'select')
  const [lookupMode, setLookupMode] = useState('phone');
  
  // By Phone Mode
  const [phoneInput, setPhoneInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // By Select Member Mode
  const [memberList, setMemberList] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Selected Member Record
  const [memberRecord, setMemberRecord] = useState(null);

  // Step 2: All Editable Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [vertical, setVertical] = useState([]);
  const [customVertical, setCustomVertical] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  
  // Submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedData, setSubmittedData] = useState(null);

  // Fetch all members when switching to 'select' mode
  const fetchAllMembersList = async () => {
    if (memberList.length > 0) return;
    setIsLoadingMembers(true);
    const res = await getAllMembers();
    setIsLoadingMembers(false);
    if (res.success) {
      setMemberList(res.data || []);
    } else {
      addToast('Could not load member list. Please search by mobile number.', 'error');
    }
  };

  const handleSwitchMode = (mode) => {
    setLookupMode(mode);
    setPhoneError('');
    if (mode === 'select') {
      fetchAllMembersList();
    }
  };

  // Auto-fill from query parameter if present
  useEffect(() => {
    const queryPhone = searchParams.get('phone');
    if (queryPhone) {
      const clean = queryPhone.replace(/\D/g, '').slice(-10);
      if (clean.length === 10) {
        setPhoneInput(clean);
        handleVerifyPhone(clean);
      }
    }
  }, [searchParams]);

  // Step 1: Mobile verification
  const handleVerifyPhone = async (phoneToVerify) => {
    const targetPhone = (phoneToVerify || phoneInput).replace(/\D/g, '').slice(-10);
    
    if (!targetPhone || targetPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setPhoneError('');
    setIsVerifying(true);

    const res = await getMemberByPhone(targetPhone);
    setIsVerifying(false);

    if (res.success && res.data) {
      if (res.data.isActive === false) {
        setMemberRecord(null);
        setPhoneError('This member account is currently disabled. Please contact the Rotary administrator.');
        addToast('This member account is currently disabled.', 'error');
        return;
      }
      handleSelectMemberRecord(res.data);
    } else {
      setMemberRecord(null);
      setPhoneError('This mobile number is not registered with Rotary Club of Erode Central.');
      addToast('This mobile number is not registered.', 'error');
    }
  };

  // Select a member from the directory list
  const handleSelectMemberRecord = (record) => {
    if (record.isActive === false) {
      setPhoneError('This member account is currently disabled. Please contact the Rotary administrator.');
      addToast('This member account is currently disabled.', 'error');
      return;
    }

    setMemberRecord(record);
    setName(record.name || '');
    setPhone(record.phone || '');
    setDob(record.dob || record.dateOfBirth || '');
    setWeddingDate(record.weddingDate || record.anniversaryDate || '');
    setMemberAddress(record.memberAddress || '');
    setBusinessAddress(record.businessAddress || '');
    const parsedVerts = parseVerticals(record.vertical || '');
    setVertical(parsedVerts.standard);
    setCustomVertical(parsedVerts.custom);
    if (record.profilePhoto) {
      setPhotoPreview(record.profilePhoto);
    } else {
      setPhotoPreview('');
    }
    setPhotoFile(null);
    setStep(2);
    addToast(`Welcome, ${record.name || 'Member'}!`, 'success');
  };

  // Filter members in 'select' mode and maintain alphabetical sorting by name (A–Z)
  const filteredMemberList = useMemo(() => {
    const list = memberList.filter(m => m.isActive !== false);
    let result = list;
    if (memberSearchQuery.trim()) {
      const query = memberSearchQuery.toLowerCase();
      result = list.filter((m) => {
        const nameMatch = (m.name || '').toLowerCase().includes(query);
        const addrMatch = (m.memberAddress || '').toLowerCase().includes(query);
        const phoneMatch = (m.phone || '').toLowerCase().includes(query);
        return nameMatch || addrMatch || phoneMatch;
      });
    }
    return [...result].sort((a, b) => 
      (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' })
    );
  }, [memberList, memberSearchQuery]);

  // Step 2: Photo selection & validation
  const handlePhotoSelect = (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error);
      addToast(validation.error, 'error');
      return;
    }

    setPhotoError('');
    setPhotoFile(file);
    
    // Live preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 2: Form submission
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      addToast('Please enter your full name.', 'error');
      return;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';

    if (!photoFile && !photoPreview) {
      setPhotoError('Profile photo is required. Please upload your photo.');
      addToast('Please upload a profile photo.', 'error');
      return;
    }

    if (!businessAddress.trim()) {
      addToast('Please enter your business / office address.', 'error');
      return;
    }

    const resolvedVertical = formatVerticals(vertical, customVertical);

    if (!resolvedVertical.trim()) {
      addToast('Please select or specify at least one business vertical / category.', 'error');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      let finalPhotoUrl = photoPreview;

      // Upload photo if new file selected
      if (photoFile) {
        setUploadProgress(35);
        const uploadPhone = cleanPhone || memberRecord.id;
        const uploadRes = await uploadProfilePhoto(
          photoFile, 
          uploadPhone, 
          (prog) => setUploadProgress(Math.max(35, prog))
        );

        if (!uploadRes.success) {
          throw new Error(uploadRes.error || 'Failed to upload photo.');
        }
        finalPhotoUrl = uploadRes.downloadUrl;
      }

      setUploadProgress(80);

      // Update Firestore Member Document with all updated fields
      const updateRes = await updateMemberProfile(memberRecord.id, {
        name: name.trim(),
        phone: cleanPhone,
        dob: dob,
        weddingDate: weddingDate,
        memberAddress: memberAddress.trim(),
        businessAddress: businessAddress.trim(),
        vertical: resolvedVertical,
        profilePhoto: finalPhotoUrl
      });

      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Failed to update member profile in database.');
      }

      setUploadProgress(100);

      // Save summary for success screen
      setSubmittedData({
        ...memberRecord,
        name: name.trim(),
        phone: cleanPhone,
        dob: dob,
        weddingDate: weddingDate,
        memberAddress: memberAddress.trim(),
        businessAddress: businessAddress.trim(),
        vertical: resolvedVertical,
        profilePhoto: finalPhotoUrl,
        status: 'Completed'
      });

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#0F2C59', '#1E3A8A', '#FDE047', '#10B981']
        });
      } catch (cErr) {
        // ignore if canvas confetti is unavailable
      }

      setStep(3);
      addToast('Your member profile has been submitted successfully!', 'success');
    } catch (err) {
      console.error('Submission error:', err);
      addToast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setStep(1);
    setPhoneInput('');
    setMemberRecord(null);
    setName('');
    setPhone('');
    setDob('');
    setWeddingDate('');
    setMemberAddress('');
    setBusinessAddress('');
    setVertical('');
    setCustomVertical('');
    setPhotoFile(null);
    setPhotoPreview('');
    setSubmittedData(null);
    setPhoneError('');
    setMemberSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6">
      
      {/* Container */}
      <div className="max-w-xl mx-auto w-full my-auto">
        
        {/* Form Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">
            Member Profile Submission
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rotary Club of Erode Central
          </p>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 1 ? 'text-rotary-navy' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > 1 ? 'bg-emerald-600 text-white' : step === 1 ? 'bg-rotary-gold text-rotary-navy' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span>Find Member</span>
            </div>

            <div className={`w-10 h-0.5 ${step >= 2 ? 'bg-rotary-gold' : 'bg-slate-200'}`}></div>

            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 2 ? 'text-rotary-navy' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > 2 ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-rotary-gold text-rotary-navy' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span>Profile Details</span>
            </div>

            <div className={`w-10 h-0.5 ${step === 3 ? 'bg-rotary-gold' : 'bg-slate-200'}`}></div>

            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step === 3 ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                3
              </span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: MEMBER VERIFICATION & SELECT ================= */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header with Mode Toggle */}
            <div className="bg-gradient-to-r from-rotary-navy via-rotary-darkBlue to-rotary-royal p-6 text-white text-center">
              <h2 className="text-xl font-bold font-display">
                Step 1: Find Your Member Profile
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Verify using your mobile number or select your name from the directory
              </p>

              {/* Mode Toggle Pills */}
              <div className="inline-flex rounded-xl bg-black/20 p-1 mt-4 text-xs font-bold text-slate-300 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('phone')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    lookupMode === 'phone'
                      ? 'bg-rotary-gold text-rotary-navy shadow-sm'
                      : 'hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>By Mobile Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('select')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    lookupMode === 'select'
                      ? 'bg-rotary-gold text-rotary-navy shadow-sm'
                      : 'hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Select by Name</span>
                </button>
              </div>
            </div>

            {/* TAB 1: By Mobile Number */}
            {lookupMode === 'phone' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyPhone();
                }}
                className="p-6 sm:p-8 space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                      <span>🇮🇳 +91</span>
                      <span className="text-slate-300">|</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoFocus
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value.replace(/\D/g, ''));
                        setPhoneError('');
                      }}
                      className={`w-full pl-24 pr-4 py-3 rounded-2xl border text-base font-mono font-medium focus:outline-none focus:ring-2 transition ${
                        phoneError
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white'
                      }`}
                    />
                  </div>
                  
                  {phoneError && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{phoneError}</p>
                        <button
                          type="button"
                          onClick={() => handleSwitchMode('select')}
                          className="text-xs text-rotary-navy font-bold underline mt-1 block"
                        >
                          Don't have your mobile registered? Click here to select by name →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || phoneInput.length !== 10}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Searching database...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('select')}
                    className="text-xs font-semibold text-rotary-navy hover:underline"
                  >
                    Don't have a registered mobile number? Find by name
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Select Member by Name & Search */}
            {lookupMode === 'select' && (
              <div className="p-6 sm:p-8 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search your name or address..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
                  />
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Member List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {isLoadingMembers ? (
                    <div className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rotary-gold mb-2" />
                      <p className="text-xs font-medium">Loading club member list...</p>
                    </div>
                  ) : filteredMemberList.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-xs font-semibold">No member found matching "{memberSearchQuery}"</p>
                      <p className="text-[11px] text-slate-400 mt-1">Please try searching with another name or switch to mobile search.</p>
                    </div>
                  ) : (
                    filteredMemberList.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMemberRecord(member)}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-rotary-gold hover:bg-amber-50/40 cursor-pointer transition group shadow-sm bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                            {member.profilePhoto ? (
                              <img src={member.profilePhoto} alt={member.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              (member.name || 'M').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-rotary-navy">
                              {member.name || 'Unnamed Member'}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                              {member.memberAddress || (member.phone ? `+91 ${member.phone}` : 'No address specified')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.status === 'Completed' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rotary-gold transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('phone')}
                    className="text-xs font-semibold text-slate-500 hover:text-rotary-navy transition inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to Mobile Verification</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= STEP 2: COMPLETE PROFILE FORM (ALL FIELDS EDITABLE) ================= */}
        {step === 2 && memberRecord && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rotary-navy to-rotary-royal p-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rotary-gold uppercase tracking-wider">
                    Step 2 of 2
                  </span>
                  <h2 className="text-xl font-bold font-display">
                    Member Profile Form
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Review and update your details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg transition"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change Member</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitProfile} className="p-6 sm:p-8 space-y-5">
              
              {/* Profile Photo Upload (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Profile Photo <span className="text-rose-500">*</span>
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-rotary-gold/80 transition bg-slate-50/50">
                  
                  {/* Preview Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-slate-400">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/jpg"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files[0])}
                    />
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rotary-navy text-white hover:bg-rotary-darkBlue active:scale-95 transition shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 text-rotary-gold" />
                        <span>{photoPreview ? 'Change Photo' : 'Upload Profile Photo'}</span>
                      </button>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Accepted formats: <span className="font-semibold text-slate-700">JPG, JPEG, PNG</span> (Auto-compressed)
                    </p>
                    
                    {photoFile && (
                      <p className="text-[11px] font-semibold text-emerald-600 truncate max-w-xs">
                        Selected: {photoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {photoError && (
                  <p className="text-xs text-rose-600 mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{photoError}</span>
                  </p>
                )}
              </div>

              {/* Member Full Name (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Member Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rtn. Senthil Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
                />
              </div>

              {/* Mobile Number (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (10-Digit)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter your 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
                  />
                </div>
              </div>

              {/* Date of Birth & Wedding Date (Easy Selection: Month, Date, Year) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EasyDatePicker
                  label="Date of Birth"
                  type="dob"
                  value={dob}
                  onChange={(val) => setDob(val)}
                  minYear={1930}
                  maxYear={new Date().getFullYear()}
                />

                <EasyDatePicker
                  label="Wedding Date"
                  type="wedding"
                  value={weddingDate}
                  onChange={(val) => setWeddingDate(val)}
                  minYear={1950}
                  maxYear={new Date().getFullYear() + 1}
                />
              </div>

              {/* Residential Address (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential / Member Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Door No, Street Name, Area, City - Pin code"
                  value={memberAddress}
                  onChange={(e) => setMemberAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
                />
              </div>

              {/* Business / Office Address (Editable, Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Office Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Company / Firm Name, Office Address, Area, City"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white"
                />
              </div>

              {/* Vertical / Industry Classification (Editable, Required) */}
              <SearchableVerticalSelect
                required
                value={vertical}
                onChange={(val) => {
                  setVertical(val);
                  if (val !== 'Other') {
                    setCustomVertical('');
                  }
                }}
                customValue={customVertical}
                onCustomChange={(customVal) => setCustomVertical(customVal)}
                label="Vertical / Classification"
                placeholder="Select your business vertical / category..."
              />

              {/* Progress bar during submission */}
              {isSubmitting && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Saving your profile changes...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rotary-royal to-rotary-gold h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-rotary-navy" />
                    <span>Submit & Save Profile</span>
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS SCREEN ================= */}
        {step === 3 && submittedData && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-center animate-in zoom-in-95 duration-300">
            
            {/* Top Celebration Banner */}
            <div className="bg-gradient-to-br from-rotary-navy via-rotary-darkBlue to-rotary-royal px-6 pt-10 pb-16 text-white relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                Submission Successful!
              </h2>
              <p className="text-xs sm:text-sm text-rotary-goldLight mt-1 font-medium">
                Your member profile has been submitted successfully.
              </p>
            </div>

            {/* Profile Card Preview */}
            <div className="px-6 pb-8 pt-0 -mt-10 max-w-sm mx-auto">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-md text-left space-y-4">
                
                {/* Photo & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow flex-shrink-0">
                    <img
                      src={submittedData.profilePhoto}
                      alt={submittedData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {submittedData.name}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                      {submittedData.vertical}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</span>
                    <p className="font-mono text-slate-800 font-semibold">{submittedData.phone ? `+91 ${submittedData.phone}` : '—'}</p>
                  </div>

                  {submittedData.dob && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                      <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <span>🎂</span> {formatDateDisplay(submittedData.dob)}
                      </p>
                    </div>
                  )}

                  {submittedData.weddingDate && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Wedding Date</span>
                      <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <span>💍</span> {formatDateDisplay(submittedData.weddingDate)}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Residential Address</span>
                    <p className="text-slate-700 leading-relaxed">{submittedData.memberAddress || '—'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Business Address</span>
                    <p className="text-slate-700 leading-relaxed">{submittedData.businessAddress}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>OK, Done!</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
