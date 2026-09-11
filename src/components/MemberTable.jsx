import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  UserCheck,
  UserX,
  Phone, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Power
} from 'lucide-react';
import { useToast } from './Toast';
import { VERTICAL_OPTIONS } from '../constants/verticals';

const VERTICAL_COLORS = {
  'IT Services': 'bg-blue-50 text-blue-700 border-blue-200',
  'Software Development': 'bg-sky-50 text-sky-700 border-sky-200',
  'Education': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Healthcare': 'bg-rose-50 text-rose-700 border-rose-200',
  'Hospital': 'bg-rose-50 text-rose-700 border-rose-200',
  'Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Finance & Investment': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Financial Services': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Banking': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Retail': 'bg-amber-50 text-amber-700 border-amber-200',
  'Retail Business': 'bg-amber-50 text-amber-700 border-amber-200',
  'Manufacturing': 'bg-slate-100 text-slate-700 border-slate-300',
  'Textile Manufacturing': 'bg-violet-50 text-violet-700 border-violet-200',
  'Textile Trading': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'Real Estate': 'bg-purple-50 text-purple-700 border-purple-200',
  'Property Developer': 'bg-purple-50 text-purple-700 border-purple-200',
  'Agriculture': 'bg-lime-50 text-lime-800 border-lime-200',
  'Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
  'Digital Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
  'Civil Construction': 'bg-amber-50 text-amber-800 border-amber-200',
  'Solar Energy': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Renewable Energy': 'bg-teal-50 text-teal-700 border-teal-200',
  'Other': 'bg-gray-50 text-gray-700 border-gray-200'
};

const isMemberCompleted = (m) => {
  if (!m) return false;
  if (m.status === 'Completed') return true;
  return Boolean(
    m.name?.trim() &&
    m.phone &&
    String(m.phone).replace(/\D/g, '').slice(-10) &&
    m.businessAddress?.trim() &&
    m.vertical?.trim() &&
    m.profilePhoto?.trim()
  );
};

export default function MemberTable({ 
  members = [], 
  isLoading = false,
  onViewMember,
  onEditMember,
  onToggleStatus,
  onDeleteMember,
  onOpenUpload,
  onOpenAdd
}) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Completed' | 'Pending' | 'Active' | 'Disabled'
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const itemsPerPage = 10;

  const handleToggleMember = onToggleStatus || onDeleteMember;

  // Filtered, searched, and alphabetically sorted members
  const filteredMembers = useMemo(() => {
    const list = members.filter((member) => {
      const completed = isMemberCompleted(member);
      const isActive = member.isActive !== false;

      // Status filter
      if (statusFilter === 'Completed' && !completed) return false;
      if (statusFilter === 'Pending' && completed) return false;
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Disabled' && isActive) return false;

      // Vertical filter (handles single or multi-vertical comma-separated values)
      if (verticalFilter !== 'ALL') {
        const memberVerts = (member.vertical || '').split(',').map(s => s.trim().toLowerCase());
        const target = verticalFilter.toLowerCase();
        if (!memberVerts.includes(target) && !(member.vertical || '').toLowerCase().includes(target)) {
          return false;
        }
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const name = (member.name || '').toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const memberAddr = (member.memberAddress || '').toLowerCase();
      const busAddr = (member.businessAddress || '').toLowerCase();
      const vertical = (member.vertical || '').toLowerCase();
      const dob = (member.dob || member.dateOfBirth || '').toLowerCase();
      const weddingDate = (member.weddingDate || member.anniversaryDate || '').toLowerCase();

      return (
        name.includes(term) ||
        phone.includes(term) ||
        memberAddr.includes(term) ||
        busAddr.includes(term) ||
        vertical.includes(term) ||
        dob.includes(term) ||
        weddingDate.includes(term)
      );
    });

    // Always sort members alphabetically by name A-Z
    return [...list].sort((a, b) => 
      (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' })
    );
  }, [members, searchTerm, statusFilter, verticalFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const handleCopyDirectLink = (phone, id) => {
    const url = phone 
      ? `${window.location.origin}/member-form?phone=${phone}`
      : `${window.location.origin}/member-form`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast(phone ? `Direct link for ${phone} copied!` : 'Public form link copied!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeCount = members.filter(m => m.isActive !== false).length;
  const disabledCount = members.filter(m => m.isActive === false).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      
      {/* Controls Bar: Search & Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, address, vertical..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue bg-white shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & Status Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-rotary-navy shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                All ({members.length})
              </button>
              <button
                onClick={() => { setStatusFilter('Completed'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'Completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:text-emerald-700'
                }`}
              >
                Completed ({members.filter(isMemberCompleted).length})
              </button>
              <button
                onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'hover:text-amber-700'
                }`}
              >
                Pending ({members.filter(m => !isMemberCompleted(m)).length})
              </button>
              {disabledCount > 0 && (
                <button
                  onClick={() => { setStatusFilter('Disabled'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'Disabled'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'hover:text-rose-700 text-rose-700'
                  }`}
                >
                  Disabled ({disabledCount})
                </button>
              )}
            </div>

            {/* Vertical Filter Dropdown */}
            <div className="relative">
              <select
                value={verticalFilter}
                onChange={(e) => {
                  setVerticalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 cursor-pointer shadow-sm max-w-[180px] truncate"
              >
                <option value="ALL">All Verticals (100)</option>
                {Array.from(
                  (() => {
                    const set = new Set(VERTICAL_OPTIONS.filter((v) => v !== 'Other'));
                    members.forEach((m) => {
                      if (m.vertical) {
                        m.vertical.split(',').forEach((v) => {
                          const trimmed = v.trim();
                          if (trimmed && trimmed !== 'Other') set.add(trimmed);
                        });
                      }
                    });
                    return set;
                  })()
                ).sort((a, b) => a.localeCompare(b)).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Member Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-[12px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4 w-16 text-center">Photo</th>
              <th className="py-3.5 px-4">Member Name</th>
              <th className="py-3.5 px-4">Phone Number</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Member Address</th>
              <th className="py-3.5 px-4">Vertical</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-400">
                  <div className="inline-block w-8 h-8 border-4 border-rotary-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="font-medium">Loading Rotary member directory...</p>
                </td>
              </tr>
            ) : paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700">No members found</p>
                    <p className="text-xs text-slate-400">
                      {searchTerm || statusFilter !== 'ALL' || verticalFilter !== 'ALL'
                        ? 'Try adjusting your search criteria or filter tags.'
                        : 'Your directory is currently empty. Upload an Excel file or add a member to get started.'}
                    </p>
                    {!members.length && (
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          onClick={onOpenUpload}
                          className="text-xs font-bold px-3 py-2 rounded-lg bg-rotary-navy text-white hover:bg-rotary-darkBlue transition"
                        >
                          Upload Excel
                        </button>
                        <button
                          onClick={onOpenAdd}
                          className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                        >
                          Add Single Member
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => {
                const completed = isMemberCompleted(member);
                const isEnabled = member.isActive !== false;
                const verticalColor = VERTICAL_COLORS[member.vertical] || VERTICAL_COLORS['Other'];
                const initial = (member.name || 'M').charAt(0).toUpperCase();

                return (
                  <tr 
                    key={member.id}
                    className={`hover:bg-blue-50/40 transition-colors group ${
                      !isEnabled ? 'bg-slate-50/75 opacity-75' : ''
                    }`}
                  >
                    {/* Photo */}
                    <td className="py-3 px-4 text-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm relative">
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name || 'Member'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, fallback to initial
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                        {!isEnabled && (
                          <span 
                            title="Disabled"
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"
                          />
                        )}
                      </div>
                    </td>

                    {/* Member Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="hover:text-rotary-navy cursor-pointer" onClick={() => onViewMember(member)}>
                          {member.name || <span className="text-slate-400 italic">Unnamed Member</span>}
                        </span>
                        {!isEnabled && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 font-medium">
                      {member.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <span>{member.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">No phone</span>
                      )}
                    </td>

                    {/* Member Address */}
                    <td className="py-3 px-4 hidden md:table-cell text-slate-600 text-xs max-w-xs truncate" title={member.memberAddress}>
                      {member.memberAddress || <span className="text-slate-300 italic">Not set</span>}
                    </td>

                    {/* Vertical */}
                    <td className="py-3 px-4">
                      {member.vertical ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {member.vertical.split(',').map((v) => {
                            const trimmed = v.trim();
                            if (!trimmed) return null;
                            const vColor = VERTICAL_COLORS[trimmed] || 'bg-blue-50 text-blue-700 border-blue-200';
                            return (
                              <span key={trimmed} className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${vColor}`}>
                                {trimmed}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        {completed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {!isEnabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        
                        {/* View Button */}
                        <button
                          onClick={() => onViewMember(member)}
                          title="View Member ID Card & Details"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 active:scale-95 transition shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditMember(member)}
                          title="Edit Member Profile"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 active:scale-95 transition shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit</span>
                        </button>

                        {/* Copy direct link */}
                        <button
                          onClick={() => handleCopyDirectLink(member.phone, member.id)}
                          title="Copy member form direct link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rotary-navy hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                        >
                          {copiedId === member.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Enable / Disable Member */}
                        <button
                          onClick={() => handleToggleMember?.(member)}
                          title={isEnabled ? "Disable Member" : "Enable Member"}
                          className={`p-1.5 rounded-lg border transition ${
                            isEnabled
                              ? 'text-slate-400 border-transparent hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                              : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          {isEnabled ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredMembers.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredMembers.length)}</span> to{' '}
            <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
            <span className="font-bold">{filteredMembers.length}</span> members
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
