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
  X,
  Eye,
  Edit3
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

  // View a completed member's card directly
  const handleViewMemberRecord = (record) => {
    if (record.isActive === false) {
      setPhoneError('This member account is currently disabled. Please contact the Rotary administrator.');
      addToast('This member account is currently disabled.', 'error');
      return;
    }

    setMemberRecord(record);
    setSubmittedData(record);
    setStep(3);
    addToast(`Viewing ID Card for ${record.name || 'Member'}`, 'info');
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
    <div className="min-h-screen bg-slate-100 flex flex-col w-full">
      
      {/* Top Page Header Banner */}
      <header className="bg-rotary-navy text-white border-b border-slate-800 py-6 sm:py-8 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-rotary-gold"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-rotary-gold">
                Rotary Club of Erode Central
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold font-display text-white">
              Member Profile Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Official membership registration and profile submission portal
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/25 p-2 sm:p-2.5 rounded-2xl border border-white/10 self-start sm:self-auto">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 1 ? 'text-white' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > 1 ? 'bg-emerald-500 text-white font-bold' : step === 1 ? 'bg-rotary-gold text-rotary-navy font-black' : 'bg-white/20 text-slate-300'
              }`}>
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span className="hidden sm:inline">Find Member</span>
            </div>

            <div className={`w-6 sm:w-8 h-0.5 ${step >= 2 ? 'bg-rotary-gold' : 'bg-white/20'}`}></div>

            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step >= 2 ? 'text-white' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > 2 ? 'bg-emerald-500 text-white font-bold' : step === 2 ? 'bg-rotary-gold text-rotary-navy font-black' : 'bg-white/20 text-slate-300'
              }`}>
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span className="hidden sm:inline">Profile Details</span>
            </div>

            <div className={`w-6 sm:w-8 h-0.5 ${step === 3 ? 'bg-rotary-gold' : 'bg-white/20'}`}></div>

            <div className={`flex items-center gap-1.5 text-xs font-bold ${
              step === 3 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step === 3 ? 'bg-emerald-500 text-white font-black' : 'bg-white/20 text-slate-300'
              }`}>
                3
              </span>
              <span className="hidden sm:inline">Complete</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {/* ================= STEP 1: MEMBER VERIFICATION & SELECT ================= */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            
            {/* Header with Mode Toggle */}
            <div className="bg-gradient-to-r from-rotary-navy via-rotary-darkBlue to-rotary-royal p-6 sm:p-8 text-white text-center">
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Step 1: Find Your Member Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Verify using your registered mobile number or select your name from the directory
              </p>

              {/* Mode Toggle Pills */}
              <div className="inline-flex rounded-xl bg-black/20 p-1 mt-4 text-xs font-bold text-slate-300 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('phone')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
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
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enter Registered Mobile Number
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Enter the 10-digit mobile number linked with your Rotary membership record.
                  </p>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      autoFocus
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value.replace(/\D/g, ''));
                        setPhoneError('');
                      }}
                      className={`w-full pl-14 pr-4 py-3.5 rounded-2xl border text-base font-mono font-medium focus:outline-none focus:ring-2 bg-slate-50/50 focus:bg-white transition ${
                        phoneError 
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500 text-rose-900' 
                          : 'border-slate-300 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue text-slate-900'
                      }`}
                    />
                  </div>

                  {phoneError && (
                    <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-medium animate-in fade-in">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || phoneInput.length < 10}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Mobile Number...</span>
                    </>
                  ) : (
                    <>
                      <span>Find My Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Select by Name Directory */}
            {lookupMode === 'select' && (
              <div className="p-6 sm:p-8 space-y-4">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search member by name, phone or address..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue"
                  />
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Member List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
                    filteredMemberList.map((member) => {
                      const isCompleted = member.status === 'Completed' || Boolean(
                        member.name && member.phone && member.businessAddress && member.vertical && member.profilePhoto
                      );

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-rotary-gold hover:bg-amber-50/20 transition group shadow-sm bg-white gap-3"
                        >
                          <div 
                            onClick={() => handleSelectMemberRecord(member)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                              {member.profilePhoto ? (
                                <img src={member.profilePhoto} alt={member.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                (member.name || 'M').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-rotary-navy flex items-center gap-2">
                                <span>{member.name || 'Unnamed Member'}</span>
                                {isCompleted ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                    Pending
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[220px] sm:max-w-md">
                                {member.memberAddress || (member.phone ? `+91 ${member.phone}` : 'No address specified')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {isCompleted ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleViewMemberRecord(member)}
                                  title="View Member ID Card"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition flex items-center gap-1 shadow-xs active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectMemberRecord(member)}
                                  title="Edit Member Profile"
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition flex items-center gap-1 shadow-xs active:scale-95"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Edit</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectMemberRecord(member)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rotary-navy bg-rotary-gold hover:brightness-105 transition flex items-center gap-1 shadow-xs active:scale-95"
                              >
                                <span>Complete Profile</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= STEP 2: COMPLETE PROFILE FORM (FULL PAGE 1-COLUMN VIEW) ================= */}
        {step === 2 && memberRecord && (
          <form onSubmit={handleSubmitProfile} className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            
            {/* Form Title & Change Member Bar */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-rotary-goldDark uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Step 2 of 2 • Member Form
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-800 mt-2">
                  Review & Complete Your Profile
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Update your contact, anniversary, address, and business information below
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {memberRecord?.status === 'Completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedData(memberRecord);
                      setStep(3);
                    }}
                    className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>View ID Card</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-600 hover:text-rotary-navy flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4 text-rotary-navy" />
                  <span>Change Member</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* CARD 1: Personal & Contact Information */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold font-display text-slate-800">
                    Personal & Contact Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Profile photo, full name, mobile number and key dates
                  </p>
                </div>

                {/* Profile Photo Upload (Required) */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Profile Photo <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    
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
                          <Camera className="w-10 h-10 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
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
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rotary-navy text-white hover:bg-rotary-darkBlue active:scale-95 transition shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-rotary-gold" />
                          <span>{photoPreview ? 'Change Photo' : 'Upload Profile Photo'}</span>
                        </button>

                        {photoPreview && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
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
                    <p className="text-xs text-rose-600 mt-2 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{photoError}</span>
                    </p>
                  )}
                </div>

                {/* Member Full Name */}
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number (10-Digit)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter your 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Date of Birth & Wedding Date */}
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

              </div>

              {/* RIGHT CARD: Addresses & Business Verticals */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold font-display text-slate-800">
                    Address & Business Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Residential address, business premises and industry classification
                  </p>
                </div>

                {/* Residential Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Residential / Member Address
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Door No, Street Name, Area, City - Pin code"
                    value={memberAddress}
                    onChange={(e) => setMemberAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                  />
                </div>

                {/* Business / Office Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Business / Office Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Company / Firm Name, Office Address, Area, City"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
                  />
                </div>

                {/* Vertical / Industry Classification */}
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

              </div>

            </div>

            {/* Submission Progress bar */}
            {isSubmitting && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Saving your profile changes...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rotary-royal to-rotary-gold h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Full-Width Action Buttons */}
            <div className="bg-white p-5 sm:px-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 hidden sm:block">
                Fields marked with <span className="text-rose-500 font-bold">*</span> are required for submission.
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancel / Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[220px] py-3.5 px-8 rounded-2xl font-bold text-sm bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </div>
            </div>

          </form>
        )}

        {/* ================= STEP 3: SUCCESS SCREEN ================= */}
        {step === 3 && submittedData && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center animate-in zoom-in-95 duration-300">
            
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
                  onClick={() => {
                    handleSelectMemberRecord(submittedData || memberRecord);
                  }}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-rotary-navy active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Edit Profile Details</span>
                </button>

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

      </main>
    </div>
  );
}
