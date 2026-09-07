import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  MessageSquare,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from './Toast';

const VERTICAL_COLORS = {
  'IT Services': 'bg-blue-50 text-blue-700 border-blue-200',
  'Education': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Healthcare': 'bg-rose-50 text-rose-700 border-rose-200',
  'Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Retail': 'bg-amber-50 text-amber-700 border-amber-200',
  'Manufacturing': 'bg-slate-100 text-slate-700 border-slate-300',
  'Real Estate': 'bg-purple-50 text-purple-700 border-purple-200',
  'Agriculture': 'bg-lime-50 text-lime-800 border-lime-200',
  'Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
  'Other': 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function MemberTable({ 
  members = [], 
  isLoading = false,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onOpenUpload,
  onOpenAdd
}) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Completed' | 'Pending'
  const [verticalFilter, setVerticalFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const itemsPerPage = 10;

  // Filtered and searched members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Status filter
      if (statusFilter === 'Completed' && member.status !== 'Completed') return false;
      if (statusFilter === 'Pending' && member.status === 'Completed') return false;

      // Vertical filter
      if (verticalFilter !== 'ALL' && member.vertical !== verticalFilter) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const name = (member.name || '').toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const memberAddr = (member.memberAddress || '').toLowerCase();
      const busAddr = (member.businessAddress || '').toLowerCase();
      const vertical = (member.vertical || '').toLowerCase();

      return (
        name.includes(term) ||
        phone.includes(term) ||
        memberAddr.includes(term) ||
        busAddr.includes(term) ||
        vertical.includes(term)
      );
    });
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
                Completed ({members.filter(m => m.status === 'Completed').length})
              </button>
              <button
                onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'hover:text-amber-700'
                }`}
              >
                Pending ({members.filter(m => m.status !== 'Completed').length})
              </button>
            </div>

            {/* Vertical Filter Dropdown */}
            <div className="relative">
              <select
                value={verticalFilter}
                onChange={(e) => {
                  setVerticalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Verticals</option>
                <option value="IT Services">IT Services</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
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
              <th className="py-3.5 px-4 hidden lg:table-cell">Business Address</th>
              <th className="py-3.5 px-4">Vertical</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="py-16 text-center text-slate-400">
                  <div className="inline-block w-8 h-8 border-4 border-rotary-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="font-medium">Loading Rotary member directory...</p>
                </td>
              </tr>
            ) : paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-16 text-center text-slate-500">
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
                          className="text-xs font-bold px-3 py-2 rounded-lg bg-rotary-gold text-rotary-navy hover:brightness-105 transition"
                        >
                          Add Member
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => {
                const isCompleted = member.status === 'Completed';
                const verticalColor = VERTICAL_COLORS[member.vertical] || 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-blue-50/40 transition-colors duration-150 group"
                  >
                    {/* Photo thumbnail */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={() => onViewMember(member)}
                        className="w-11 h-11 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-rotary-gold transition flex items-center justify-center text-slate-700 font-bold text-sm"
                        title="Click to view details"
                      >
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, fallback to initials
                              e.target.style.display = 'none';
                            }}
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
                    </td>

                    {/* Member Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div 
                        onClick={() => onViewMember(member)}
                        className="cursor-pointer hover:text-rotary-royal transition"
                      >
                        {member.name || 'Unnamed Member'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal md:hidden mt-0.5 truncate max-w-[180px]">
                        {member.memberAddress || 'No address provided'}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4">
                      {member.phone ? (
                        <span className="font-mono font-medium text-slate-700 text-xs sm:text-sm">
                          {member.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No mobile</span>
                      )}
                    </td>



                    {/* Member Address */}
                    <td className="py-3 px-4 hidden md:table-cell text-slate-600 text-xs max-w-xs truncate" title={member.memberAddress}>
                      {member.memberAddress || <span className="text-slate-300 italic">Not set</span>}
                    </td>

                    {/* Business Address */}
                    <td className="py-3 px-4 hidden lg:table-cell text-slate-600 text-xs max-w-xs truncate" title={member.businessAddress}>
                      {member.businessAddress || <span className="text-slate-300 italic">—</span>}
                    </td>

                    {/* Vertical */}
                    <td className="py-3 px-4">
                      {member.vertical ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${verticalColor}`}>
                          {member.vertical}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isCompleted ? (
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
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        
                        {/* Copy direct link */}
                        <button
                          onClick={() => handleCopyDirectLink(member.phone, member.id)}
                          title="Copy direct form link for this member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rotary-royal hover:bg-slate-100 transition"
                        >
                          {copiedId === member.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* View card */}
                        <button
                          onClick={() => onViewMember(member)}
                          title="View Member ID Card"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit member */}
                        <button
                          onClick={() => onEditMember(member)}
                          title="Edit Member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete member */}
                        <button
                          onClick={() => onDeleteMember(member)}
                          title="Delete Member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
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
